import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const client = postgres(process.env.DATABASE_URL!);

export const db = drizzle({
  client,
  // logger: process.env.NODE_ENV === "development" ? true : undefined,
});
