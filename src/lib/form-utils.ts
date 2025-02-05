export function transformFromStringToNumber(numAsString: string) {
  if (numAsString === "") return undefined;

  const num = Number(numAsString);
  if (isNaN(num)) return undefined;

  return num;
}
