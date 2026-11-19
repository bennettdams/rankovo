/**
 * App-side value of one search param. Matches the outputs of `schemaSearchParamSingle`
 * (`string | number | boolean | Date | null`) and `schemaSearchParamMultiple` (`string[] | null`).
 */
export type SearchParamValue =
  string | number | boolean | Date | readonly string[] | null;

/** List items are joined with `,`, so a `,` (and the escape char `%`) inside an item is escaped. */
export function escapeListItem(item: string): string {
  return item.replace(/[%,]/g, (char) => (char === "%" ? "%25" : "%2C"));
}

/**
 * Reverses `escapeListItem`: `%2C` becomes `,` and `%25` becomes `%`.
 * A single pass, so an escaped percent in front of `2C` (`%252C`) stays `%2C` instead of becoming a comma.
 */
export function unescapeListItem(item: string): string {
  return item.replace(/%2C|%25/g, (code) => (code === "%2C" ? "," : "%"));
}

export function stringifySearchParams(
  obj: Record<string, SearchParamValue>,
): string {
  const urlParams = new URLSearchParams();

  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value === "string") {
      if (value.length > 0) urlParams.append(key, value);
    } else if (typeof value === "number" && Number.isFinite(value)) {
      urlParams.append(key, String(value));
    } else if (typeof value === "boolean") {
      urlParams.append(key, String(value));
    } else if (value instanceof Date && !Number.isNaN(value.getTime())) {
      // The full timestamp, because a date-only string is parsed as UTC and would shift local dates.
      urlParams.append(key, value.toISOString());
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        urlParams.append(key, value.map(escapeListItem).join(","));
      }
    } else if (value !== null) {
      // we allow passing null, but everything else should be considered an error
      throw new Error(`Search param: Unhandled value type: ${value}`);
    }
  });

  return urlParams.toString();
}

export function hrefWithSearchParams(
  pathname: string,
  params: Record<string, SearchParamValue>,
): string {
  const queryString = stringifySearchParams(params);
  return queryString ? `${pathname}?${queryString}` : pathname;
}
