"use client";

import { FiltersRankings } from "@/app/page";
import {
  prepareFiltersForUpdate,
  useSearchParamsHelper,
} from "@/lib/url-state";
import { useOptimistic, useTransition } from "react";
import { RankingsSearchBase } from "./rankings-search";

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
    <RankingsSearchBase
      mode="interactive"
      searchQuery={filters.q}
      onSearchChange={(value) => changeFilters({ q: value })}
      onResetSearch={resetSearchFilter}
      isLoading={isLoading}
    />
  );
}
