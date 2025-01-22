import type { ReadonlyURLSearchParams } from "next/navigation";

export function stringifySearchParams(obj: Record<string, unknown>): string {
  const urlParams = new URLSearchParams();
  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value === "string") {
      urlParams.append(key, value);
    } else if (typeof value === "number") {
      urlParams.append(key, String(value));
    } else if (Array.isArray(value) && value.length > 0) {
      urlParams.append(key, value.join(","));
    } else if (value !== null) {
      // we allow passing null, but everything else should be considered an error
      throw new Error(`Search param: Unhandled value type: ${value}`);
    }
  });

  return urlParams.toString();
}

export function createQueryString(
  name: string,
  value: string,
  searchParams: ReadonlyURLSearchParams,
) {
  const params = new URLSearchParams(searchParams.toString());
  params.set(name, value);

  return params.toString();
}
