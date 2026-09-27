import { categories, cities, ratingHighest, ratingLowest } from "@/data/static";
import { type ZodPipe, type ZodType, z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ZodTypeUnknown = ZodType<unknown, any>;

export const schemaNonEmptyString = z
  .string("Text erwartet")
  .trim()
  .min(1, "Kann nicht leer sein");

const messageRating = `Bitte wähle zwischen ${ratingLowest} und ${ratingHighest}`;
export const schemaRating = z
  .number({ error: messageRating })
  .min(ratingLowest, messageRating)
  .max(ratingHighest, messageRating);

export const schemaUrl = z.url({
  error: "Bitte gib eine gültige URL ein (beginnt mit 'https')",
  protocol: /^https$/,
});

export const schemaNote = z
  .string()
  .max(255)
  .nullable()
  .transform((note) => (note === "" ? null : note));

export const schemaCity = z.enum(cities);
function schemaTrimmedName(min: number, max: number) {
  return z
    .string({ error: "Kann nicht leer sein" })
    .trim()
    .min(min, "Kann nicht leer sein")
    .max(max);
}
export const schemaPlaceName = schemaTrimmedName(1, 255);
export const schemaProductName = schemaTrimmedName(2, 255);
export const schemaCategory = z.enum(categories, {
  message: "Bitte wähle eine Kategorie aus",
});

const schemaExistingId = z.number().int().positive();
const schemaReviewIdExisting = z.templateLiteral([
  "product-",
  z.number().int().nonnegative(),
]);
const schemaReviewIdNew = z.templateLiteral([
  "new-",
  z.number().int().nonnegative(),
]);
const schemaReviewId = z.union([
  schemaReviewIdExisting,
  schemaReviewIdNew,
]);
const schemaVisitPlace = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("existing"), id: schemaExistingId }),
  z.object({
    kind: z.literal("new"),
    name: schemaPlaceName,
    cities: z.array(schemaCity),
  }),
]);

const schemaVisitProduct = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("existing"), id: schemaExistingId }),
  z.object({
    kind: z.literal("new"),
    name: schemaProductName,
    category: schemaCategory,
  }),
]);

/** One restaurant visit: the place plus every product rated there, saved together. */
export const schemaCreateVisit = z
  .object({
    place: schemaVisitPlace,
    reviews: z
      .array(
        z.object({
          id: schemaReviewId,
          product: schemaVisitProduct,
          rating: schemaRating,
          note: schemaNote,
        }),
      )
      .min(1, "Bewerte mindestens ein Produkt"),
    urlSource: schemaUrl.nullable(),
    overwriteAuthorId: z.string().nullable(),
  })
  .superRefine((visit, ctx) => {
    const productIdsSeen = new Set<number>();
    const productNamesSeen = new Set<string>();

    visit.reviews.forEach(({ product }, index) => {
      if (product.kind === "existing") {
        if (productIdsSeen.has(product.id)) {
          ctx.addIssue({
            code: "custom",
            path: ["reviews", index, "product"],
            message: "Dieses Produkt ist schon in der Liste",
          });
        }
        productIdsSeen.add(product.id);
        return;
      }

      const nameKey = product.name.toLowerCase();
      if (productNamesSeen.has(nameKey)) {
        ctx.addIssue({
          code: "custom",
          path: ["reviews", index, "product", "name"],
          message: "Dieses Produkt ist schon in der Liste",
        });
      }
      productNamesSeen.add(nameKey);
    });
  });
export type VisitCreate = z.infer<typeof schemaCreateVisit>;

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
