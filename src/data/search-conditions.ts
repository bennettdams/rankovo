import { placeCitiesTable, placesTable, productsTable } from "@/db/db-schema";
import { db } from "@/db/drizzle-setup";
import { and, eq, exists, ilike, or, type SQL } from "drizzle-orm";
import { minCharsSearch } from "./static";

/**
 * Pattern for a case-insensitive "contains" `ILIKE`.
 *
 * Postgres `ILIKE` treats `%` as "any text", `_` as "any one character", and
 * `\` as the default escape. Wrapping the raw query in `%…%` would turn those
 * characters into wildcards: searching `100%` would match `1000` and
 * `100 extra`, not names that contain a percent sign.
 *
 * Escape `\`, `%`, and `_` first, then wrap in `%…%`, so search means "name
 * contains this text".
 *
 * @example
 * ilikeContains("döner")
 * // "%döner%" — still a contains search
 *
 * @example
 * ilikeContains("100%")
 * // "%100\\%%" — matches "100%", not "100" + anything
 *
 * @example
 * ilikeContains("A_B")
 * // "%A\\_B%" — matches "A_B", not "AXB"
 *
 * @example
 * ilike(productsTable.name, ilikeContains(q))
 */
export function ilikeContains(value: string): string {
  const escaped = value
    .replaceAll("\\", "\\\\")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_");

  return `%${escaped}%`;
}

/**
 * `EXISTS (SELECT place_id FROM place_cities … WHERE …)` — true if the outer
 * place has at least one matching city row.
 *
 * Why EXISTS instead of joining `place_cities` in the main FROM?
 * - A join would duplicate product rows (one per matching city).
 * - EXISTS only checks “is there ≥1 matching row?” and keeps one product row.
 *
 * The subquery selects a real column (`placeId`) so the builder stays typed;
 * EXISTS ignores the selected values and only cares whether any row matches.
 * `eq(placeCitiesTable.placeId, placesTable.id)` correlates to the outer
 * `places` row (the parent query must already join `places`).
 */
export function existsPlaceCityMatching(cityCondition: SQL) {
  return exists(
    db
      .select({ placeId: placeCitiesTable.placeId })
      .from(placeCitiesTable)
      .where(and(eq(placeCitiesTable.placeId, placesTable.id), cityCondition)),
  );
}

export function conditionsSearchProducts(searchQuery: string) {
  // Clean and split the search query
  const searchTerms = searchQuery
    .trim()
    .toLowerCase()
    .split(/\s+/) // Split by whitespace
    .filter((term) => {
      // Remove empty strings
      if (term.length === 0) return false;
      // Exclude common search term conjunction (e.g. "Burger in Berlin")
      if (term === "in") return false;

      return true;
    });

  if (searchTerms.length === 0) {
    return undefined;
  }

  // Create ILIKE conditions for each search term across all searchable fields
  const searchConditions = searchTerms.map((term) => {
    const wildcardTerm = ilikeContains(term);

    return or(
      ilike(productsTable.name, wildcardTerm),
      ilike(productsTable.note, wildcardTerm),
      ilike(productsTable.category, wildcardTerm),
      ilike(placesTable.name, wildcardTerm),
      // Match if any linked city name contains the search term (see existsPlaceCityMatching).
      existsPlaceCityMatching(ilike(placeCitiesTable.city, wildcardTerm)),
    );
  });

  return searchConditions;
}

export function conditionsSearchReviewProducts(
  productName: string | null,
  placeName: string | null,
) {
  const filters: (SQL | undefined)[] = [];

  if (productName) {
    const productConditions = conditionsSearchProducts(productName);
    if (productConditions) filters.push(...productConditions);
  }

  const placeQuery = placeName?.trim();
  if (placeQuery && placeQuery.length >= minCharsSearch) {
    filters.push(ilike(placesTable.name, ilikeContains(placeQuery)));
  }

  return filters.length > 0 ? filters : undefined;
}
