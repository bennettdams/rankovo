"use client";

import { FiltersRankings } from "@/app/page";
import { minCharsSearch } from "@/data/static";
import {
  prepareFiltersForUpdate,
  useSearchParamsHelper,
} from "@/lib/url-state";
import { SearchIcon, XIcon } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { FieldError } from "./form";
import { LoadingSpinner } from "./loading-spinner";
import { Input } from "./ui/input";

export function RankingsSearchClient({
  searchQuery,
}: {
  searchQuery: FiltersRankings["q"];
}) {
  const { updateSearchParams } = useSearchParamsHelper();
  const [filters, setOptimisticFilters] = useOptimistic({
    q: searchQuery,
  });
  const [isLoading, startTransition] = useTransition();

  function changeFilters(filtersUpdatedPartial: Partial<FiltersRankings>) {
    const filtersNew = prepareFiltersForUpdate(filtersUpdatedPartial, filters);
    if (filtersNew) {
      startTransition(() => {
        setOptimisticFilters(filtersNew);
        updateSearchParams(filtersNew, true);
      });
    }
  }

  function resetSearchFilter() {
    changeFilters({ q: null });
  }

  return (
    <div className="mx-auto w-full md:w-2/3">
      <div className="relative">
        <Input
          name="filter-search"
          type="text"
          className="h-14 rounded-xl border-none bg-white text-center text-lg leading-none shadow-sm placeholder:text-center focus:placeholder:text-white focus-visible:ring-primary md:text-2xl md:placeholder:text-2xl"
          placeholder='e.g. "Döner in Hamburg"'
          value={filters.q ?? ""}
          onChange={(e) => {
            changeFilters({ q: e.target.value });
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") resetSearchFilter();
          }}
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 transform">
          {isLoading ? (
            <LoadingSpinner className="size-7" />
          ) : filters.q ? (
            <XIcon
              className="size-8 cursor-pointer stroke-primary"
              onClick={() => resetSearchFilter()}
            />
          ) : (
            <SearchIcon className="size-8 stroke-primary" />
          )}
        </div>
      </div>

      {!!filters.q && filters.q.length < minCharsSearch ? (
        <FieldError
          className="mt-1.5"
          errorMsg={`At least ${minCharsSearch} characters`}
        />
      ) : (
        <p className="mt-1.5">
          Search by product name, restaurant name or category
        </p>
      )}
    </div>
  );
}
