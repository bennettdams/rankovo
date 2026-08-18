import { cities, type City } from "@/data/static";

/** Compact label for cards/rows: all cities for 1–2, otherwise `{n} Städte`. */
export function formatCitiesLabel(placeCities: City[]): string | null {
  if (placeCities.length === 0) return null;
  if (placeCities.length <= 2) return placeCities.join(", ");
  return `${placeCities.length} Städte`;
}

/** Full comma-separated list for detail surfaces. */
export function formatCitiesFull(placeCities: City[]): string | null {
  if (placeCities.length === 0) return null;
  return placeCities.join(", ");
}

/** First assigned city in `static.ts` order — deterministic map preview pick. */
export function pickCityForMap(placeCities: City[]): City | null {
  if (placeCities.length === 0) return null;
  return cities.find((city) => placeCities.includes(city)) ?? null;
}
