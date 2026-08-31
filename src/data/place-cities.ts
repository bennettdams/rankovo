import { placeCitiesTable, placesTable } from "@/db/db-schema";
import { eq, sql } from "drizzle-orm";
import { cities, type City } from "./static";

/**
 * Builds a SQL list literal of allowed cities in `static.ts` order, e.g.
 * `'Berlin', 'Bremen', …`. Used only as the sort key for `array_position`.
 */
const citiesOrderSql = sql.join(
  cities.map((city) => sql`${city}`),
  sql`, `,
);

function isCity(value: unknown): value is City {
  return typeof value === "string" && (cities as readonly string[]).includes(value);
}

/**
 * Correlated subquery: the current place's `place_cities` rows as one array.
 * The outer query must already join `places`.
 *
 * `array_agg` stays in SQL (one round-trip, no JS grouping). Column/table
 * identifiers are Drizzle references, so a schema rename fails typecheck:
 * `${placeCitiesTable.city}`, `${eq(placeCitiesTable.placeId, placesTable.id)}`.
 *
 * 1. Inner select from `place_cities` correlated to `places.id`.
 * 2. `array_agg(city ORDER BY array_position(static-list, city))` — stable
 *    order matching `static.ts`, independent of insert order.
 * 3. `coalesce(…, '{}')` — no cities becomes `[]`, never null.
 */
export function sqlCitiesForPlace() {
  return sql<City[]>`coalesce(
    (
      select array_agg(
        ${placeCitiesTable.city}
        order by array_position(
          array[${citiesOrderSql}]::varchar[],
          ${placeCitiesTable.city}
        )
      )
      from ${placeCitiesTable}
      where ${eq(placeCitiesTable.placeId, placesTable.id)}
    ),
    '{}'::varchar[]
  )`.mapWith((value): City[] => {
    if (!Array.isArray(value)) return [];
    return value.filter(isCity);
  });
}
