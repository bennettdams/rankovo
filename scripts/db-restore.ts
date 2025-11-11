#!/usr/bin/env bun

import { loadEnvConfig } from "@next/env";
import { spawn } from "child_process";
import { existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const BACKUP_DIR = join(process.cwd(), "backups");
const RESTORE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

function logWithTimestamp(
  message: string,
  level: "info" | "error" | "warn" = "info",
): void {
  const timestamp = new Date().toISOString();
  const prefix = level === "error" ? "❌" : level === "warn" ? "⚠️" : "ℹ️";
  console.info(`${prefix} [${timestamp}] ${message}`);
}

async function runPgCommand(
  command: string,
  args: string[],
  description: string,
  timeoutMs: number = RESTORE_TIMEOUT_MS,
): Promise<void> {
  const dbPassword = process.env.DB_PASSWORD!;

  logWithTimestamp(`Starting: ${description}`);

  return new Promise((resolve, reject) => {
    const pgProcess = spawn(command, args, {
      env: {
        ...process.env,
        PGPASSWORD: dbPassword,
      },
      stdio: ["inherit", "inherit", "pipe"],
    });

    let errorOutput = "";
    let isTimeout = false;

    const timeout = setTimeout(() => {
      isTimeout = true;
      logWithTimestamp(
        `Operation timed out after ${timeoutMs / 1000} seconds`,
        "error",
      );
      pgProcess.kill("SIGTERM");
      setTimeout(() => {
        if (!pgProcess.killed) {
          pgProcess.kill("SIGKILL");
        }
      }, 5000);
      reject(
        new Error(`${description} timed out after ${timeoutMs / 1000} seconds`),
      );
    }, timeoutMs);

    pgProcess.stderr.on("data", (data) => {
      const output = data.toString();
      if (output.includes("ERROR") || output.includes("FATAL")) {
        errorOutput += output;
        logWithTimestamp(`Error output: ${output.trim()}`, "error");
      } else {
        if (output.includes("processing") || output.includes("completed")) {
          logWithTimestamp(output.trim());
        }
      }
    });

    pgProcess.on("close", (code) => {
      clearTimeout(timeout);

      if (isTimeout) return;

      if (code === 0) {
        logWithTimestamp(`${description} completed successfully`);
        resolve();
      } else {
        const errorMsg = `${description} failed with exit code ${code}`;
        logWithTimestamp(errorMsg, "error");
        if (errorOutput) {
          logWithTimestamp(`Error details: ${errorOutput}`, "error");
        }
        reject(new Error(errorMsg));
      }
    });

    pgProcess.on("error", (err) => {
      clearTimeout(timeout);

      if (isTimeout) return;

      const errorMsg = `Failed to start ${command}: ${err.message}`;
      logWithTimestamp(errorMsg, "error");

      if (err.message.includes("ENOENT")) {
        logWithTimestamp(
          "Make sure PostgreSQL client tools are installed",
          "error",
        );
      }

      reject(new Error(errorMsg));
    });
  });
}

function listBackupFiles(): Array<{
  name: string;
  path: string;
  date: Date;
  size: string;
}> {
  if (!existsSync(BACKUP_DIR)) {
    logWithTimestamp("No backup directory found", "error");
    return [];
  }

  const files = readdirSync(BACKUP_DIR)
    .filter((file) => file.startsWith("db-backup-") && file.endsWith(".dump"))
    .map((file) => {
      const filePath = join(BACKUP_DIR, file);
      const stats = statSync(filePath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      return {
        name: file,
        path: filePath,
        date: stats.mtime,
        size: `${sizeInMB} MB`,
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return files;
}

async function restoreDatabase(backupFilePath: string): Promise<void> {
  const dbHost = process.env.DB_HOST;
  const dbPort = process.env.DB_PORT;
  const dbUser = process.env.DB_USER;
  const dbName = process.env.DB_NAME;
  const dbPassword = process.env.DB_PASSWORD;

  if (!dbHost || !dbPort || !dbUser || !dbName || !dbPassword) {
    throw new Error(
      "Missing required database environment variables. Please set DB_HOST, DB_PORT, DB_USER, DB_NAME, and DB_PASSWORD.",
    );
  }

  if (!existsSync(backupFilePath)) {
    throw new Error(`Backup file not found: ${backupFilePath}`);
  }

  logWithTimestamp(`Target database: ${dbUser}@${dbHost}:${dbPort}/${dbName}`);
  logWithTimestamp(`Restoring from: ${backupFilePath}`);

  const restoreArgs = [
    "--host",
    dbHost,
    "--port",
    dbPort,
    "--username",
    dbUser,
    "--dbname",
    dbName,
    "--verbose",
    "--clean", // Drop existing objects before recreating
    "--no-owner", // Don't set ownership
    "--no-privileges", // Don't set privileges
    "--single-transaction", // Wrap restore in a single transaction for atomicity
    "--exit-on-error", // Stop on first error instead of continuing
    backupFilePath,
  ];

  await runPgCommand("pg_restore", restoreArgs, "Database restore");

  logWithTimestamp("Database restore completed successfully! 🎉");
}

async function main() {
  try {
    const backupFilePath = process.argv[2];

    if (!backupFilePath) {
      logWithTimestamp("Available backup files:");
      const backups = listBackupFiles();

      if (backups.length === 0) {
        logWithTimestamp("No backup files found", "error");
        process.exit(1);
      }

      backups.forEach((backup, index) => {
        console.info(
          `  ${index + 1}. ${backup.name} (${backup.size}, ${backup.date.toISOString()})`,
        );
      });

      console.info("\nUsage:");
      console.info("  bun run scripts/db-restore.ts <backup-file-path>");
      console.info(
        "  bun run scripts/db-restore.ts latest  # restore the most recent backup",
      );
      console.info("\nExample:");
      console.info(`  bun run scripts/db-restore.ts "${backups[0]?.path}"`);
      process.exit(0);
    }

    let actualBackupPath: string;

    if (backupFilePath === "latest") {
      const backups = listBackupFiles();
      if (backups.length === 0) {
        logWithTimestamp("No backup files found", "error");
        process.exit(1);
      }
      const latestBackup = backups[0]!; // Safe because we checked length above
      actualBackupPath = latestBackup.path;
      logWithTimestamp(`Using latest backup: ${latestBackup.name}`);
    } else {
      actualBackupPath = backupFilePath.startsWith("/")
        ? backupFilePath
        : join(BACKUP_DIR, backupFilePath);
    }

    logWithTimestamp("Database restore utility starting");
    await restoreDatabase(actualBackupPath);
    logWithTimestamp("Restore process completed successfully");
    process.exit(0);
  } catch (error) {
    logWithTimestamp("Restore process failed", "error");
    logWithTimestamp(
      error instanceof Error ? error.message : String(error),
      "error",
    );
    process.exit(1);
  }
}

// Handle process interruption
process.on("SIGINT", () => {
  logWithTimestamp("Restore process interrupted by user", "warn");
  process.exit(1);
});

process.on("SIGTERM", () => {
  logWithTimestamp("Restore process terminated", "warn");
  process.exit(1);
});

// Run the script
main();
