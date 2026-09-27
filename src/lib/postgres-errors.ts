type ErrorRecord = Record<string, unknown>;
type PostgresErrorLike = ErrorRecord & { code: string };

function isErrorRecord(error: unknown): error is ErrorRecord {
  return typeof error === "object" && error !== null;
}

function hasPostgresCode(
  error: unknown,
  code: string,
): error is PostgresErrorLike {
  return isErrorRecord(error) && error.code === code;
}

/** Drizzle wraps driver errors, the Postgres error then sits in `error.cause`. */
function postgresErrorWithCode(
  error: unknown,
  code: string,
): PostgresErrorLike | null {
  if (hasPostgresCode(error, code)) return error;

  if (isErrorRecord(error) && hasPostgresCode(error.cause, code)) {
    return error.cause;
  }

  return null;
}

const postgresForeignKeyViolation = "23503";
const postgresUniqueViolation = "23505";

/** Postgres `23503` — foreign key violation, including when wrapped as `error.cause`. */
export function isForeignKeyViolation(error: unknown): boolean {
  return postgresErrorWithCode(error, postgresForeignKeyViolation) !== null;
}

/**
 * Name of the violated constraint or index for a Postgres `23505` unique
 * violation, `null` for every other error.
 */
export function uniqueViolationConstraint(error: unknown): string | null {
  const postgresError = postgresErrorWithCode(error, postgresUniqueViolation);
  if (!postgresError) return null;

  return "constraint_name" in postgresError &&
    typeof postgresError.constraint_name === "string"
    ? postgresError.constraint_name
    : null;
}
