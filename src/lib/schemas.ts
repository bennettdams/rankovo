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
