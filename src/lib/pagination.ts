import { z } from "zod";
import { schemaSearchParamSingle } from "./schemas";

declare const pageBrand: unique symbol;
declare const pageOffsetBrand: unique symbol;
declare const pageCountBrand: unique symbol;

/** 1-based page used in URLs and UI. */
export type Page = number & { readonly [pageBrand]: typeof pageBrand };

/** 0-based SQL offset. */
export type PageOffset = number & {
  readonly [pageOffsetBrand]: typeof pageOffsetBrand;
};

/**
 * How many pages exist for a result set (`Math.ceil(total / pageSize)`).
 * Not a 1-based page index — use `lastPage` when you need the last `Page`
 * (e.g. clamping an out-of-range URL). Compare with `Page` for "has next"
 * (`page < pageCount`) and for "Page {page} of {pageCount}".
 */
export type PageCount = number & {
  readonly [pageCountBrand]: typeof pageCountBrand;
};

function toPage(value: number): Page {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`Invalid page: ${value}`);
  }

  return value as Page;
}

export const schemaPageSearchParam = schemaSearchParamSingle(
  z.number().int().positive(),
  "number",
).transform((page): Page | null => (page === null ? null : toPage(page)));

export type PageSearchParam = z.output<typeof schemaPageSearchParam>;

const firstPage = toPage(1);

export function pageFromSearchParam(page: PageSearchParam): Page {
  return page ?? firstPage;
}

/** 0-based SQL offset for a 1-based `Page` (`(page - 1) * pageSize`). */
export function pageOffset(page: Page, pageSize: number): PageOffset {
  if (pageSize < 1) {
    throw new Error(`Invalid pageSize: ${pageSize}`);
  }

  return ((page - 1) * pageSize) as PageOffset;
}

export function pageSearchParam(page: Page): PageSearchParam {
  return page > firstPage ? page : null;
}

export function totalPages(total: number, pageSize: number): PageCount {
  if (pageSize < 1) {
    throw new Error(`Invalid pageSize: ${pageSize}`);
  }

  return Math.max(1, Math.ceil(total / pageSize)) as PageCount;
}

/** Prev/next `Page` without `page ± 1` dropping the 1-based brand. */
export function shiftPage(page: Page, delta: 1 | -1): Page {
  return toPage(Math.max(1, page + delta));
}

export function lastPage(pageCount: PageCount): Page {
  return toPage(pageCount);
}
