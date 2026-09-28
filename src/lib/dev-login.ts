/**
 * Fail closed: `/dev/login` stays off unless this is explicitly `"true"` in a
 * non-production runtime. Set it in `.env.local`.
 */
export function isDevLoginEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_DEV_LOGIN === "true"
  );
}
