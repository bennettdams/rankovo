import { categories } from "@/data/static";
import { z } from "zod";

export function schemaSearchParam<TSchema extends z.ZodSchema>(
  schema: TSchema,
) {
  return z
    .string()
    .min(1)
    .optional()
    .transform((raw) => (!raw ? null : raw.split(",")))
    .pipe(z.array(schema).nullable());
}

export const schemaCategory = z.enum(categories);

export const schemaFiltersRankings = z.object({
  categories: schemaSearchParam(schemaCategory),
  test: schemaSearchParam(z.string()),
});

export type RankingsFilters = z.output<typeof schemaFiltersRankings>;
