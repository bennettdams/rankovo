#!/usr/bin/env bun

import { loadEnvConfig } from "@next/env";
import { spawn } from "child_process";
import { existsSync, mkdirSync, statSync, unlinkSync } from "fs";
import { join } from "path";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const BACKUP_DIR = join(process.cwd(), "backups");
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const BACKUP_FILENAME = `db-backup-${TIMESTAMP}.dump`;
const BACKUP_PATH = join(BACKUP_DIR, BACKUP_FILENAME);

function logWithTimestamp(
  message: string,
  level: "info" | "error" | "warn" = "info",
): void {
  const timestamp = new Date().toISOString();
  const prefix = level === "error" ? "❌" : level === "warn" ? "⚠️" : "ℹ️";
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function validateBackupFile(filePath: string): Promise<boolean> {
  try {
    // Check if file exists and has reasonable size
    if (!existsSync(filePath)) {
      logWithTimestamp("Backup file does not exist", "error");
      return false;
    }

    const stats = statSync(filePath);
    if (stats.size === 0) {
      logWithTimestamp("Backup file is empty", "error");
      return false;
    }

    // Test if the backup file is valid using pg_restore --list
    const validateArgs = ["--list", filePath];

    await runPgCommand("pg_restore", validateArgs, "Backup validation");
    logWithTimestamp("Backup file validation successful");
    return true;
  } catch (error) {
    logWithTimestamp(`Backup validation failed: ${error}`, "error");
    return false;
  }
}

async function runPgCommand(
  command: string,
  args: string[],
  description: string,
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
    let progressCounter = 0;
    const progressChars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

    // Progress indicator - show spinner every 2 seconds
    const progressInterval = setInterval(() => {
      const spinner = progressChars[progressCounter % progressChars.length];
      process.stdout.write(`\r${spinner} ${description} in progress...`);
      progressCounter++;
    }, 200);

    const clearProgress = () => {
      clearInterval(progressInterval);
      process.stdout.write("\r"); // Clear the progress line
    };

    pgProcess.stderr.on("data", (data) => {
      const output = data.toString();
      // pg_dump and pg_restore write verbose output to stderr, so we need to distinguish between errors and info
      if (output.includes("ERROR") || output.includes("FATAL")) {
        errorOutput += output;
        clearProgress();
        logWithTimestamp(`Error output: ${output.trim()}`, "error");
      } else {
        // Log verbose output at debug level (only show important parts)
        if (output.includes("processing") || output.includes("completed")) {
          clearProgress();
          logWithTimestamp(output.trim());
        }
      }
    });

    pgProcess.on("close", (code) => {
      clearProgress();

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
      clearProgress();

      const errorMsg = `Failed to start ${command}: ${err.message}`;
      logWithTimestamp(errorMsg, "error");

      if (err.message.includes("ENOENT")) {
        logWithTimestamp(
          "Make sure PostgreSQL client tools are installed (pg_dump, pg_restore, psql commands)",
          "error",
        );
        logWithTimestamp("On macOS: brew install postgresql", "info");
        logWithTimestamp(
          "On Ubuntu/Debian: sudo apt-get install postgresql-client",
          "info",
        );
      }

      reject(new Error(errorMsg));
    });
  });
}

async function createBackup(): Promise<void> {
  const startTime = Date.now();

  try {
    logWithTimestamp("Starting database backup process");
    logWithTimestamp(`Backup directory: ${BACKUP_DIR}`);
    logWithTimestamp(`Backup file: ${BACKUP_FILENAME}`);

    // Ensure backup directory exists
    if (!existsSync(BACKUP_DIR)) {
      logWithTimestamp("Creating backup directory");
      mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const dbHost = process.env.DB_HOST;
    const dbPort = process.env.DB_PORT;
    const dbUser = process.env.DB_USER;
    const dbName = process.env.DB_NAME;
    const dbPassword = process.env.DB_PASSWORD;

    if (!dbHost || !dbPort || !dbUser || !dbName || !dbPassword)
      throw new Error(
        "Missing required database environment variables. Please set DB_HOST, DB_PORT, DB_USER, DB_NAME, and DB_PASSWORD.",
      );

    logWithTimestamp(
      `Target database: ${dbUser}@${dbHost}:${dbPort}/${dbName}`,
    );

    // Create the backup
    const backupArgs = [
      "--host",
      dbHost,
      "--port",
      dbPort,
      "--username",
      dbUser,
      "--dbname",
      dbName,
      "--verbose",
      "--clean", // Include DROP statements
      "--no-owner", // Don't output commands to set ownership
      "--no-privileges", // Don't output commands to set privileges
      "--format=custom", // Custom format: compressed, portable, allows selective restore. See the more common CLI command "-Fc"
      "--compress=9", // Maximum compression (1-9, 9 is best)
      "--lock-wait-timeout=30000", // Wait max 30 seconds for locks (prevents hanging)
      "--file",
      BACKUP_PATH,
    ];

    await runPgCommand("pg_dump", backupArgs, "Database backup");

    // Validate the backup file
    const isValid = await validateBackupFile(BACKUP_PATH);
    if (!isValid) {
      throw new Error(
        "Backup validation failed - the backup file may be corrupted",
      );
    }

    const duration = Date.now() - startTime;
    const stats = statSync(BACKUP_PATH);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    logWithTimestamp("Backup completed successfully! 🎉");
    logWithTimestamp(`Backup file: ${BACKUP_PATH}`);
    logWithTimestamp(`File size: ${sizeInMB} MB`);
    logWithTimestamp(`Duration: ${(duration / 1000).toFixed(1)} seconds`);

    logWithTimestamp("To restore this backup:");
    logWithTimestamp(
      `  pg_restore --host=HOST --port=PORT --username=USER --dbname=DB --clean --verbose "${BACKUP_PATH}"`,
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);

    logWithTimestamp(
      `Backup failed after ${(duration / 1000).toFixed(1)} seconds`,
      "error",
    );
    logWithTimestamp(`Error: ${errorMsg}`, "error");

    // Clean up failed backup file if it exists
    if (existsSync(BACKUP_PATH)) {
      try {
        unlinkSync(BACKUP_PATH);
        logWithTimestamp("Cleaned up incomplete backup file");
      } catch (cleanupError) {
        logWithTimestamp(
          `Failed to clean up incomplete backup file: ${cleanupError}`,
          "warn",
        );
      }
    }

    throw error;
  }
}

async function main() {
  try {
    logWithTimestamp("Database backup utility starting");

    await createBackup();

    logWithTimestamp("Backup process completed successfully");
    process.exit(0);
  } catch (error) {
    logWithTimestamp("Backup process failed", "error");
    logWithTimestamp(
      error instanceof Error ? error.message : String(error),
      "error",
    );
    process.exit(1);
  }
}

// Handle process interruption
process.on("SIGINT", () => {
  logWithTimestamp("Backup process interrupted by user", "warn");
  process.exit(1);
});

process.on("SIGTERM", () => {
  logWithTimestamp("Backup process terminated", "warn");
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logWithTimestamp(`Uncaught exception: ${error.message}`, "error");
  console.error(error.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logWithTimestamp(`Unhandled rejection at ${promise}: ${reason}`, "error");
  process.exit(1);
});

// Run the script
main();
