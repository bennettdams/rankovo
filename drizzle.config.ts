import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

export default defineConfig({
  out: "./src/db/migrations",
  schema: "./src/db/db-schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // print all SQL statements during drizzle-kit push command
  verbose: true,
  // prompts confirmation to run printed SQL statements when running drizzle-kit push command
  strict: true,
});
