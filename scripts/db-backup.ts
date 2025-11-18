#!/usr/bin/env bun

import { loadEnvConfig } from "@next/env";
import { existsSync, mkdirSync, statSync, unlinkSync } from "fs";
import { join } from "path";
import { createInterface } from "readline";
import {
  type DbConfig,
  getDbConfig,
  isProductionDatabase,
  logWithTimestamp,
  runPgCommand,
} from "./db-utils";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

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

export const BACKUP_DIR = join(process.cwd(), "backups");

function generateBackupFilename(prefix: string = "db-backup"): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `${prefix}-${timestamp}.dump`;
}

async function validateBackupFile(
  filePath: string,
  dbConfig: DbConfig,
): Promise<boolean> {
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

    await runPgCommand(
      "pg_restore",
      validateArgs,
      "Backup validation",
      dbConfig,
    );
    logWithTimestamp("Backup file validation successful");
    return true;
  } catch (error) {
    logWithTimestamp(`Backup validation failed: ${error}`, "error");
    return false;
  }
}

/**
 * Creates a database backup and returns the path to the backup file.
 * @param filenamePrefix - Optional prefix for the backup filename (default: "db-backup")
 * @param description - Optional description for logging (default: "Database backup")
 * @returns Path to the created backup file
 */
export async function createBackup(
  filenamePrefix: string = "db-backup",
  description: string = "Database backup",
): Promise<string> {
  const startTime = Date.now();
  const backupFilename = generateBackupFilename(filenamePrefix);
  const backupPath = join(BACKUP_DIR, backupFilename);

  try {
    logWithTimestamp(`Starting ${description}`);
    logWithTimestamp(`Backup directory: ${BACKUP_DIR}`);
    logWithTimestamp(`Backup file: ${backupFilename}`);

    // Ensure backup directory exists
    if (!existsSync(BACKUP_DIR)) {
      logWithTimestamp("Creating backup directory");
      mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const dbConfig = getDbConfig();

    logWithTimestamp(
      `Target database: ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.name}`,
    );

    // Create the backup
    const backupArgs = [
      "--host",
      dbConfig.host,
      "--port",
      dbConfig.port,
      "--username",
      dbConfig.user,
      "--dbname",
      dbConfig.name,
      "--verbose",
      "--clean", // Include DROP statements
      "--no-owner", // Don't output commands to set ownership
      "--no-privileges", // Don't output commands to set privileges
      "--format=custom", // Custom format: compressed, portable, allows selective restore. See the more common CLI command "-Fc"
      "--compress=9", // Maximum compression (1-9, 9 is best)
      "--lock-wait-timeout=30000", // Wait max 30 seconds for locks (prevents hanging)
      "--file",
      backupPath,
    ];

    await runPgCommand("pg_dump", backupArgs, description, dbConfig);

    // Validate the backup file
    const isValid = await validateBackupFile(backupPath, dbConfig);
    if (!isValid) {
      throw new Error(
        "Backup validation failed - the backup file may be corrupted",
      );
    }

    const duration = Date.now() - startTime;
    const stats = statSync(backupPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    logWithTimestamp(`${description} completed successfully! 🎉`);
    logWithTimestamp(`Backup file: ${backupPath}`);
    logWithTimestamp(`File size: ${sizeInMB} MB`);
    logWithTimestamp(`Duration: ${(duration / 1000).toFixed(1)} seconds`);

    return backupPath;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);

    logWithTimestamp(
      `${description} failed after ${(duration / 1000).toFixed(1)} seconds`,
      "error",
    );
    logWithTimestamp(`Error: ${errorMsg}`, "error");

    // Clean up failed backup file if it exists
    if (existsSync(backupPath)) {
      try {
        unlinkSync(backupPath);
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
  logWithTimestamp("🟧 Starting backup");
  try {
    logWithTimestamp("Database backup utility starting");

    // Check if production and require confirmation
    const isProd = isProductionDatabase();
    if (isProd) {
      logWithTimestamp("⚠️  PRODUCTION DATABASE DETECTED ⚠️", "warn");

      const confirmed = await promptForConfirmation(
        '\n🔴 PRODUCTION Database backup will access production data!\nType "yes-production" to confirm: ',
        "yes-production",
      );

      if (!confirmed) {
        logWithTimestamp("Backup cancelled by user", "warn");
        process.exit(0);
      }
    }

    const backupPath = await createBackup();

    logWithTimestamp("Backup process completed successfully");
    logWithTimestamp("To restore this backup:");
    logWithTimestamp(`  bun run scripts/db-restore.ts "${backupPath}"`);
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

// Run the script only when executed directly (not when imported)
// @ts-expect-error - Bun-specific property
if (import.meta.main) {
  main();
}
