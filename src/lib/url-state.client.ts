"use client";

import { usePathname, useRouter } from "next/navigation";
import { hrefWithSearchParams, type SearchParamValue } from "./url-state";
import { isKeyOfObj } from "./utils";

export function useSearchParamsHelper() {
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Replaces all search params of the current URL with `paramsNew`.
   * `shouldServerUpdate: false` only rewrites the URL without fetching a new RSC payload.
   */
  function setSearchParams(
    paramsNew: Record<string, SearchParamValue>,
    shouldServerUpdate: boolean,
  ) {
    const pathWithQuery = hrefWithSearchParams(pathname, paramsNew);

    if (shouldServerUpdate) {
      router.replace(pathWithQuery, {
        scroll: false,
      });
    } else {
      window.history.replaceState(null, "", pathWithQuery);
    }
  }

  return { setSearchParams };
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
