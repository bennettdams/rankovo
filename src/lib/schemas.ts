import { type ZodPipe, type ZodType, z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ZodTypeUnknown = ZodType<unknown, any>;

export const schemaNonEmptyString = z
  .string("Expected a string")
  .trim()
  .min(1, "Cannot be empty");

/**
 * Function overloads, so the return type can be inferred based on the variant parameter.
 */
export function schemaSearchParamSingle<TSchema extends ZodType>(
  schema: TSchema,
  variant: "string",
): ZodPipe<ReturnType<TSchema["optional"]>, z.ZodNullable<z.ZodString>>;
export function schemaSearchParamSingle<TSchema extends ZodType>(
  schema: TSchema,
  variant: "number",
): ZodPipe<ReturnType<TSchema["optional"]>, z.ZodNullable<z.ZodNumber>>;
export function schemaSearchParamSingle<TSchema extends ZodType>(
  schema: TSchema,
  variant: "date",
): ZodPipe<ReturnType<TSchema["optional"]>, z.ZodNullable<z.ZodDate>>;
export function schemaSearchParamSingle<TSchema extends ZodType>(
  schema: TSchema,
  variant: "boolean",
): ZodPipe<ReturnType<TSchema["optional"]>, z.ZodNullable<z.ZodBoolean>>;
export function schemaSearchParamSingle<
  TSchema extends ZodTypeUnknown,
  TVariant extends "string" | "number" | "date" | "boolean",
>(schema: TSchema, variant: TVariant) {
  return schemaNonEmptyString
    .optional()
    .transform((raw) => {
      if (raw === undefined) return null;

      switch (variant) {
        case "string":
          return raw === "" ? null : raw;
        case "number":
          return Number(raw);
        case "date":
          return new Date(raw);
        case "boolean":
          return raw === "true" ? true : raw === "false" ? false : null;
        default: {
          const exhaustiveCheck: never = variant;
          throw new Error(`Unhandled case: ${exhaustiveCheck}`);
        }
      }
    })
    .pipe(schema.nullable());
}

export function schemaSearchParamMultiple<TSchema extends ZodTypeUnknown>(
  schema: TSchema,
) {
  return schemaNonEmptyString
    .optional()
    .transform((raw) => (!raw ? null : raw.split(",")))
    .pipe(z.array(schema).nullable());
}
