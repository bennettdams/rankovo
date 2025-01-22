import { z } from "zod";

export function schemaSearchParamMultiple<TSchema extends z.ZodSchema>(
  schema: TSchema,
) {
  return z
    .string()
    .min(1)
    .optional()
    .transform((raw) => (!raw ? null : raw.split(",")))
    .pipe(z.array(schema).nullable());
}

export function schemaSearchParamSingle<TSchema extends z.ZodSchema>(
  schema: TSchema,
  variant: "string" | "number",
) {
  return z
    .string()
    .min(1)
    .optional()
    .transform((raw) =>
      !raw ? null : variant === "number" ? Number(raw) : raw,
    )
    .pipe(schema.nullable());
}
