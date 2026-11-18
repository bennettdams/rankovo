import { redirect } from "next/navigation";
import type { z, ZodType } from "zod";
import { hrefWithSearchParams } from "./url-state";

/** Next.js passes repeated keys (`?q=a&q=b`) as arrays. Only the first value is used. */
function flattenSearchParams(searchParams: unknown): Record<string, string> {
  if (searchParams === null || typeof searchParams !== "object") {
    return {};
  }

  const flattened: Record<string, string> = {};
  for (const [key, value] of Object.entries(searchParams)) {
    const valueFirst: unknown = Array.isArray(value) ? value[0] : value;
    if (typeof valueFirst === "string") flattened[key] = valueFirst;
  }
  return flattened;
}

/**
 * Parses search params with the schema. Invalid keys (e.g. from a hand-edited URL)
 * are removed by redirecting to `pathname` with the remaining params.
 *
 * Pages call this inside `<Suspense>`, where the response has already started
 * streaming with status 200. Next.js then sends the redirect as a client-side
 * navigation instead of an HTTP 307.
 */
export function parseSearchParamsOrRedirect<TSchema extends ZodType>({
  schema,
  searchParams,
  pathname,
}: {
  schema: TSchema;
  searchParams: unknown;
  pathname: string;
}): z.output<TSchema> {
  const params = flattenSearchParams(searchParams);
  const parsed = schema.safeParse(params);
  if (parsed.success) return parsed.data;

  const keysInvalid = new Set(
    parsed.error.issues.map((issue) => issue.path[0]),
  );
  const paramsValid = Object.fromEntries(
    Object.entries(params).filter(([key]) => !keysInvalid.has(key)),
  );

  // Nothing to remove means the schema itself rejects the URL (e.g. a required key),
  // so redirecting would loop forever.
  if (Object.keys(paramsValid).length === Object.keys(params).length) {
    throw parsed.error;
  }
  redirect(hrefWithSearchParams(pathname, paramsValid));
}
