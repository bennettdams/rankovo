"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { stringifySearchParams } from "./url-state";
import { isKeyOfObj } from "./utils";

export function useSearchParamsHelper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  function updateSearchParams(
    paramsNew: Record<string, unknown>,
    shouldServerUpdate: boolean,
  ) {
    const queryString = stringifySearchParams(paramsNew);

    const pathWithQuery = queryString ? `${pathname}?${queryString}` : pathname;

    if (shouldServerUpdate) {
      router.replace(pathWithQuery, {
        scroll: false,
      });
    } else {
      window.history.replaceState(null, "", pathWithQuery);
    }
  }

  return { searchParams, updateSearchParams };
}

export function prepareFiltersForUpdate<
  TFilters extends Record<string, unknown>,
>(
  filtersUpdatedPartial: NoInfer<Partial<TFilters>>,
  filtersExisting: TFilters,
): TFilters | false {
  // a bit of overhead, but this way we save a network request (as updating search params also reloads the RSC page)
  const hasChanged = Object.keys(filtersUpdatedPartial).some((key) => {
    if (isKeyOfObj(filtersExisting, key)) {
      return filtersExisting[key] !== filtersUpdatedPartial[key];
    }
  });

  if (hasChanged) {
    return { ...filtersExisting, ...filtersUpdatedPartial };
  } else {
    return false;
  }
}
