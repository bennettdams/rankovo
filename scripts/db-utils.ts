import { spawn } from "child_process";
import { createInterface } from "readline";

export function logWithTimestamp(
  message: string,
  level: "info" | "error" | "warn" = "info",
): void {
  const timestamp = new Date().toISOString();
  const prefix = level === "error" ? "❌" : level === "warn" ? "⚠️" : "ℹ️";
  console.info(`${prefix} [${timestamp}] ${message}`);
}

export async function promptForConfirmation(
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

export async function runPgCommand(
  command: string,
  args: string[],
  description: string,
  dbConfig: DbConfig,
  timeoutMs?: number,
): Promise<void> {
  logWithTimestamp(`Starting: ${description}`);

  return new Promise((resolve, reject) => {
    const pgProcess = spawn(command, args, {
      env: {
        ...process.env,
        PGPASSWORD: dbConfig.password,
      },
      stdio: ["inherit", "inherit", "pipe"],
    });

    let errorOutput = "";
    let isTimeout = false;
    let timeout: NodeJS.Timeout | undefined;

    if (timeoutMs) {
      timeout = setTimeout(() => {
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
          new Error(
            `${description} timed out after ${timeoutMs / 1000} seconds`,
          ),
        );
      }, timeoutMs);
    }

    let progressCounter = 0;
    const progressChars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

    // Progress indicator - show spinner every 200ms
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
      // Capture all stderr output for potential error reporting
      errorOutput += output;

      if (output.includes("ERROR") || output.includes("FATAL")) {
        clearProgress();
        logWithTimestamp(`Error output: ${output.trim()}`, "error");
      } else if (
        output.includes("processing") ||
        output.includes("completed")
      ) {
        clearProgress();
        logWithTimestamp(output.trim());
      }
    });

    pgProcess.on("close", (code) => {
      clearProgress();
      if (timeout) clearTimeout(timeout);

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
      clearProgress();
      if (timeout) clearTimeout(timeout);

      if (isTimeout) return;

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

export interface DbConfig {
  host: string;
  port: string;
  user: string;
  name: string;
  password: string;
}

/**
 * Parse DATABASE_URL into separate components.
 * Standardizes environment variable handling across scripts.
 */
export function getDbConfig(): DbConfig {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "Missing required DATABASE_URL environment variable. " +
        "Please set DATABASE_URL in your environment.",
    );
  }

  try {
    const url = new URL(databaseUrl);

    const config = {
      host: url.hostname,
      port: url.port,
      user: url.username,
      name: url.pathname.slice(1), // Remove leading slash
      password: url.password,
    };

    // Validate all required fields are present and non-empty
    const missingFields: string[] = [];
    if (!config.host) missingFields.push("host");
    if (!config.port) missingFields.push("port");
    if (!config.user) missingFields.push("user");
    if (!config.name) missingFields.push("database name");
    if (!config.password) missingFields.push("password");

    if (missingFields.length > 0) {
      throw new Error(
        `DATABASE_URL is missing required fields: ${missingFields.join(", ")}. ` +
          `Ensure your DATABASE_URL is in the format: postgresql://user:password@host:port/database`,
      );
    }

    return config;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("Invalid URL")) {
      throw new Error(
        `DATABASE_URL is not a valid URL. Expected format: postgresql://user:password@host:port/database`,
      );
    }
    throw error;
  }
}

/**
 * Detect if running against production database.
 */
export function isProductionDatabase(): boolean {
  const databaseUrl = process.env.DATABASE_URL;
  return databaseUrl !== "postgresql://ben:password@localhost:5432/rankovo-dev";
}
