"use client";

import type { FiltersRankings } from "@/app/page";
import {
  prepareFiltersForUpdate,
  useSearchParamsHelper,
} from "@/lib/url-state.client";
import { createContext, useContext, useOptimistic, useTransition } from "react";

type RankingFiltersContextValue = {
  filters: FiltersRankings;
  isPending: boolean;
  changeFilters: (filtersUpdatedPartial: Partial<FiltersRankings>) => void;
  clearFilters: () => void;
};

const RankingFiltersContext = createContext<RankingFiltersContextValue | null>(
  null,
);

export function RankingFiltersProvider({
  initialFilters,
  children,
}: {
  initialFilters: FiltersRankings;
  children: React.ReactNode;
}) {
  const { updateSearchParams } = useSearchParamsHelper();
  const [filters, setOptimisticFilters] = useOptimistic(initialFilters);
  const [isPending, startTransition] = useTransition();

  function changeFilters(filtersUpdatedPartial: Partial<FiltersRankings>) {
    const filtersNew = prepareFiltersForUpdate(filtersUpdatedPartial, filters);
    if (!filtersNew) return;

    startTransition(() => {
      setOptimisticFilters(filtersNew);
      updateSearchParams(filtersNew, true);
    });
  }

  function clearFilters() {
    changeFilters({
      categories: null,
      cities: null,
      critics: null,
      "rating-min": null,
      "rating-max": null,
      "reviews-min": null,
      q: null,
    });
  }

  return (
    <RankingFiltersContext.Provider
      value={{ changeFilters, clearFilters, filters, isPending }}
    >
      {children}
    </RankingFiltersContext.Provider>
  );
}

export function useRankingFilters() {
  const context = useContext(RankingFiltersContext);

  if (!context) {
    throw new Error(
      "useRankingFilters must be used within RankingFiltersProvider",
    );
  }

  return context;
}
