import { loadEnvConfig } from "@next/env";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

// Fix for "sorry, too many clients already" from:
// https://www.answeroverflow.com/m/1162714716137865236

declare global {
  var db: PostgresJsDatabase | undefined;
}

let db: PostgresJsDatabase;

if (process.env.NODE_ENV === "production") {
  const client = postgres(
    process.env.DATABASE_URL!,
    // avoid clash of cached prepared statements for connection pool
    { prepare: false },
  );

  db = drizzle({
    client,
  });
} else {
  if (!global.db) {
    const client = postgres(
      process.env.DATABASE_URL!,
      // avoid clash of cached prepared statements for connection pool
      { prepare: false },
    );

    global.db = drizzle({
      client,
    });
  }

  db = global.db;
}

export { db };
