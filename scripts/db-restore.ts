#!/usr/bin/env bun

import { loadEnvConfig } from "@next/env";
import { existsSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { createInterface } from "readline";
import { BACKUP_DIR, createBackup } from "./db-backup";
import {
  getDbConfig,
  isProductionDatabase,
  logWithTimestamp,
  runPgCommand,
} from "./db-utils";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const RESTORE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

async function promptForConfirmation(
  message: string,
  expectedAnswer: string,
): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.trim() === expectedAnswer);
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
  const dbConfig = getDbConfig();

  if (!existsSync(backupFilePath)) {
    throw new Error(`Backup file not found: ${backupFilePath}`);
  }

  logWithTimestamp(
    `Target database: ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.name}`,
  );
  logWithTimestamp(`Restoring from: ${backupFilePath}`);

  // Check if production and require confirmation
  const isProd = isProductionDatabase();
  if (isProd) {
    logWithTimestamp("⚠️  PRODUCTION DATABASE DETECTED ⚠️", "warn");
  }

  // Always require confirmation for restore (it's destructive)
  const expectedAnswer = isProd ? "yes-production" : "yes";
  const confirmed = await promptForConfirmation(
    `\n${isProd ? "🔴 PRODUCTION " : ""}Database restore will OVERWRITE all existing data!\nType "${expectedAnswer}" to confirm: `,
    expectedAnswer,
  );

  if (!confirmed) {
    logWithTimestamp("Restore cancelled by user", "warn");
    process.exit(0);
  }

  // Create pre-restore backup as safety net
  const preRestoreBackupPath = await createBackup(
    "db-backup-pre-restore",
    "Pre-restore safety backup",
  );
  logWithTimestamp(
    `Safety backup created. You can revert using: bun run scripts/db-restore.ts "${preRestoreBackupPath}"`,
  );

  const restoreArgs = [
    "--host",
    dbConfig.host,
    "--port",
    dbConfig.port,
    "--username",
    dbConfig.user,
    "--dbname",
    dbConfig.name,
    "--verbose",
    "--clean", // Drop existing objects before recreating
    "--no-owner", // Don't set ownership
    "--no-privileges", // Don't set privileges
    "--single-transaction", // Wrap restore in a single transaction for atomicity
    "--exit-on-error", // Stop on first error instead of continuing
    backupFilePath,
  ];

  await runPgCommand(
    "pg_restore",
    restoreArgs,
    "Database restore",
    dbConfig,
    RESTORE_TIMEOUT_MS,
  );

  logWithTimestamp("Database restore completed successfully! 🎉");
}

async function main() {
  logWithTimestamp("🟦 Starting restore");
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
      console.info("\nExample:");
      console.info(`  bun run scripts/db-restore.ts "${backups[0]?.path}"`);
      process.exit(0);
    }

    const actualBackupPath = backupFilePath.startsWith("/")
      ? backupFilePath
      : join(BACKUP_DIR, backupFilePath);

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

// Run the script only when executed directly (not when imported)
// @ts-expect-error - Bun-specific property
if (import.meta.main) {
  main();
}
