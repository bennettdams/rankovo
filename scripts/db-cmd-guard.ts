#!/usr/bin/env bun

import { loadEnvConfig } from "@next/env";
import { spawn } from "child_process";
import {
  getDbConfig,
  isProductionDatabase,
  promptForConfirmation,
} from "./db-utils";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

function executeCommand(command: string, args: string[] = []): Promise<number> {
  return new Promise((resolve, reject) => {
    const fullCommand = `${command} ${args.join(" ")}`.trim();
    console.info(`\n🚀 Executing: ${fullCommand}`);

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
    console.info("Usage: bun run db-wrapper <command> [args...]");
    process.exit(1);
  }

  // Get and validate database config once
  let dbConfig;
  try {
    dbConfig = getDbConfig();
  } catch (error) {
    console.info("\n❌ No valid database URL detected.");
    if (error instanceof Error) {
      console.info(error.message);
    }
    process.exit(0);
  }

  const isProd = isProductionDatabase(dbConfig);

  console.info(`📝 Command: ${command}`);

  if (isProd) {
    console.info("\n🔴 PRODUCTION ENVIRONMENT DETECTED 🔴");

    const confirmed = await promptForConfirmation(
      '\n⚠️  You are about to run a script against the PRODUCTION database!\nType "yes-production" to proceed: ',
      "yes-production",
    );

    if (!confirmed) {
      console.info("\n❌ Operation cancelled by user");
      process.exit(0);
    }

    console.info("\n✅ Confirmed. Proceeding with command execution...");
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
