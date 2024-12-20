export function stringifySearchParams(params: Record<string, unknown>): string {
  const urlParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === "string") {
      urlParams.append(key, value);
    } else if (Array.isArray(value) && value.length > 0) {
      urlParams.append(key, value.join(","));
    }
  });
  return urlParams.toString();
}
