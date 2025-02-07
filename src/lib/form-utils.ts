export function transformFromStringToNumber(numAsString: string | null) {
  if (numAsString === "" || numAsString === null) return null;

  const num = Number(numAsString);
  if (isNaN(num)) return null;

  return num;
}
