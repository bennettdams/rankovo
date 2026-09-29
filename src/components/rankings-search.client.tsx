"use client";

import { useRankingFilters } from "./ranking-filters-context";
import { RankingsSearchBase } from "./rankings-search";

export function RankingsSearchClient() {
  const { changeFilters, filters, isPending } = useRankingFilters();

  function resetSearchFilter() {
    changeFilters({ q: null });
  }

  return (
    <RankingsSearchBase
      mode="interactive"
      searchQuery={filters.q}
      onSearchChange={(value) => changeFilters({ q: value })}
      onResetSearch={resetSearchFilter}
      isLoading={isPending}
    />
  );
}
