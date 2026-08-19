import type { PlaceUpdateDb, ProductUpdateDb } from "@/db/db-schema";
import type { FormConfig, FormState } from "@/lib/form-utils";
import { routes } from "@/lib/navigation";
import { schemaPageSearchParam } from "@/lib/pagination";
import { schemaSearchParamSingle } from "@/lib/schemas";
import { stringifySearchParams } from "@/lib/url-state";
import { redirect } from "next/navigation";
import { z } from "zod";

const adminTabs = ["products", "places"] as const;

export const schemaParamsAdmin = z.object({
  tab: schemaSearchParamSingle(z.enum(adminTabs), "string"),
  page: schemaPageSearchParam,
  productId: schemaSearchParamSingle(z.number().int().positive(), "number"),
  placeId: schemaSearchParamSingle(z.number().int().positive(), "number"),
  "product-search": schemaSearchParamSingle(
    z.string().min(1).max(255),
    "string",
  ),
  "place-search": schemaSearchParamSingle(z.string().min(1).max(255), "string"),
});

export type SearchParamsAdmin = z.output<typeof schemaParamsAdmin>;

export const searchParamKeysAdmin = {
  tab: "tab",
  page: "page",
  productId: "productId",
  placeId: "placeId",
  "product-search": "product-search",
  "place-search": "place-search",
} as const satisfies Record<keyof SearchParamsAdmin, string>;

export function emptyAdminParams(
  overrides: Partial<SearchParamsAdmin> = {},
): SearchParamsAdmin {
  return {
    tab: null,
    page: null,
    productId: null,
    placeId: null,
    "product-search": null,
    "place-search": null,
    ...overrides,
  };
}

export function adminHref(params: SearchParamsAdmin): string {
  const queryString = stringifySearchParams(params);
  return queryString ? `${routes.admin}?${queryString}` : routes.admin;
}

function flattenSearchParams(searchParams: unknown): Record<string, unknown> {
  if (searchParams === null || typeof searchParams !== "object") {
    return {};
  }

  const flattened: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(
    searchParams as Record<string, unknown>,
  )) {
    flattened[key] = Array.isArray(value) ? value[0] : value;
  }
  return flattened;
}

export function parseSearchParamsAdmin(
  searchParams: unknown,
): SearchParamsAdmin {
  const parsed = schemaParamsAdmin.safeParse(flattenSearchParams(searchParams));
  if (!parsed.success) {
    redirect(routes.admin);
  }
  return parsed.data;
}

export const formConfigUpdateProduct = {
  name: "string",
  note: "string",
  category: "string",
  placeId: "number",
} satisfies FormConfig<ProductUpdateDb>;

export const formKeysUpdateProduct = {
  name: "name",
  note: "note",
  category: "category",
  placeId: "placeId",
} as const satisfies Record<keyof typeof formConfigUpdateProduct, string>;

export type FormStateUpdateProduct = FormState<typeof formConfigUpdateProduct>;

export const formConfigUpdatePlace = {
  name: "string",
  cities: "stringArray",
} satisfies FormConfig<PlaceUpdateDb>;

export const formKeysUpdatePlace = {
  name: "name",
  cities: "cities",
} as const satisfies Record<keyof typeof formConfigUpdatePlace, string>;

export type FormStateUpdatePlace = FormState<typeof formConfigUpdatePlace>;
