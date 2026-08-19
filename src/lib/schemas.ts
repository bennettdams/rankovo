import { type ZodPipe, type ZodType, z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ZodTypeUnknown = ZodType<unknown, any>;

export const schemaNonEmptyString = z
  .string("Text erwartet")
  .trim()
  .min(1, "Kann nicht leer sein");

export function schemaSearchParamSingle<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- with the generic z.output<schemaSearchParamSingle(z.enum(["foo", "bar"]), "string")> infers to "foo" | "bar" | null instead of string | null
  TSchema extends z.ZodString | z.ZodLiteral<any> | z.ZodEnum<any>,
>(
  schema: TSchema,
  variant: "string",
): ZodPipe<ReturnType<TSchema["optional"]>, z.ZodNullable<TSchema>>;
export function schemaSearchParamSingle<
  TSchema extends z.ZodNumber | z.ZodPipe<z.ZodNumber, z.ZodNumber>,
>(
  schema: TSchema,
  variant: "number",
): ZodPipe<ReturnType<TSchema["optional"]>, z.ZodNullable<TSchema>>;
export function schemaSearchParamSingle<TSchema extends z.ZodDate>(
  schema: TSchema,
  variant: "date",
): ZodPipe<ReturnType<TSchema["optional"]>, z.ZodNullable<TSchema>>;
export function schemaSearchParamSingle<TSchema extends z.ZodBoolean>(
  schema: TSchema,
  variant: "boolean",
): ZodPipe<ReturnType<TSchema["optional"]>, z.ZodNullable<TSchema>>;
export function schemaSearchParamSingle<
  TSchema extends ZodTypeUnknown,
  TVariant extends "string" | "number" | "date" | "boolean",
>(schema: TSchema, variant: TVariant) {
  return (
    z
      // We do not use schemaNonEmptyString (which has trim()) here, because we want to allow search params with leading/trailing spaces,
      // as they might be intentional (e.g. searching for " ABC " with the spaces)
      .string()
      .min(1)
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
      .pipe(schema.nullable())
  );
}

export function schemaSearchParamMultiple<TSchema extends ZodTypeUnknown>(
  schema: TSchema,
) {
  return schemaNonEmptyString
    .optional()
    .transform((raw) => (!raw ? null : raw.split(",")))
    .pipe(z.array(schema).nullable());
}
