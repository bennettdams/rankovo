import { categories, ratingHighest, ratingLowest } from "@/data/static";
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

const messageRating = `Please pick between ${ratingLowest} and ${ratingHighest}`;
export const schemaRating = z
  .number()
  .min(ratingLowest, messageRating)
  .max(ratingHighest, messageRating);

export const schemaFiltersRankings = z.object({
  categories: schemaSearchParamMultiple(schemaCategory),
  ratingMin: schemaSearchParamSingle(schemaRating),
  ratingMax: schemaSearchParamSingle(schemaRating),
});

export type FiltersRankings = z.output<typeof schemaFiltersRankings>;
