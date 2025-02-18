import { usePathname, useRouter, useSearchParams } from "next/navigation";
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

function stringifySearchParams(obj: Record<string, unknown>): string {
  const urlParams = new URLSearchParams();

  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value === "string") {
      if (value.length > 0) urlParams.append(key, value);
    } else if (typeof value === "number") {
      urlParams.append(key, String(value));
    } else if (Array.isArray(value) && value.length > 0) {
      urlParams.append(key, value.join(","));
    } else if (value !== null) {
      // we allow passing null, but everything else should be considered an error
      throw new Error(`Search param: Unhandled value type: ${value}`);
    }
  });

  return urlParams.toString();
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
