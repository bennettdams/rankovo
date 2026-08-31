function hasPostgresCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

const postgresForeignKeyViolation = "23503";

/** Postgres `23503` — foreign key violation, including when wrapped as `error.cause`. */
export function isForeignKeyViolation(error: unknown): boolean {
  if (hasPostgresCode(error, postgresForeignKeyViolation)) return true;

  return (
    typeof error === "object" &&
    error !== null &&
    "cause" in error &&
    hasPostgresCode(error.cause, postgresForeignKeyViolation)
  );
}
