import type { PlaceUpdateDb, ProductUpdateDb } from "@/db/db-schema";
import type { FormConfig, FormState } from "@/lib/form-utils";
import { routes } from "@/lib/navigation";
import { schemaPageSearchParam } from "@/lib/pagination";
import { schemaSearchParamSingle } from "@/lib/schemas";
import { hrefWithSearchParams } from "@/lib/url-state";
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
  return hrefWithSearchParams(routes.admin, params);
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
