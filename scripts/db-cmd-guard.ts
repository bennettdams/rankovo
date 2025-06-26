#!/usr/bin/env bun

import { loadEnvConfig } from "@next/env";
import { spawn } from "child_process";
import { createInterface } from "readline";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function promptForConfirmation(): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      '⚠️  You are about to run a script against the PRODUCTION database!\nType "continue" to proceed: ',
      (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase() === "continue");
      },
    );
  });
}

function executeCommand(command: string, args: string[] = []): Promise<number> {
  return new Promise((resolve, reject) => {
    const fullCommand = `${command} ${args.join(" ")}`.trim();
    console.log(`\n🚀 Executing: ${fullCommand}`);

    const child = spawn(fullCommand, {
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      resolve(code || 0);
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

async function main() {
  const command = process.argv[2];
  const commandArgs = process.argv.slice(3);

  if (!command) {
    console.error("❌ Error: Please provide a command to execute");
    console.log("Usage: bun run db-wrapper <command> [args...]");
    process.exit(1);
  }

  const databaseURL = process.env.DATABASE_URL;
  if (!databaseURL) {
    console.log("\n❌ No database URL detected.");
    process.exit(0);
  }

  const isProduction =
    databaseURL !== "postgresql://ben:password@localhost:5432/rankovo-dev";

  console.log(`📝 Command: ${command}`);

  if (isProduction) {
    console.log("\n🔴 PRODUCTION ENVIRONMENT DETECTED 🔴");

    const confirmed = await promptForConfirmation();

    if (!confirmed) {
      console.log("\n❌ Operation cancelled by user");
      process.exit(0);
    }

    console.log("\n✅ Confirmed. Proceeding with command execution...");
  }

  try {
    const exitCode = await executeCommand(command, commandArgs);
    process.exit(exitCode);
  } catch (error) {
    console.error("❌ Error executing command:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
