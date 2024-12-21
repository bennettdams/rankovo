import { categories } from "@/data/static";
import { z } from "zod";

function schemaSearchParamMultiple<TSchema extends z.ZodSchema>(
  schema: TSchema,
) {
  return z
    .string()
    .min(1)
    .optional()
    .transform((raw) => (!raw ? null : raw.split(",")))
    .pipe(z.array(schema).nullable());
}

function schemaSearchParamSingle<TSchema extends z.ZodSchema>(schema: TSchema) {
  return z
    .string()
    .min(1)
    .optional()
    .transform((raw) => (!raw ? null : Number(raw)))
    .pipe(schema.nullable());
}

export const schemaCategory = z.enum(categories);

export const schemaRating = z.number().min(0).max(10);

export const schemaFiltersRankings = z.object({
  categories: schemaSearchParamMultiple(schemaCategory),
  rating: schemaSearchParamSingle(schemaRating),
});

export type RankingsFilters = z.output<typeof schemaFiltersRankings>;
