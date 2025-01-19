import type { CriticQuery } from "@/data/queries";
import type { FiltersRankings } from "@/lib/schemas";
import { RankingsFiltersClient } from "./rankings-filters.client";

export async function RankingFilters({
  filters: filtersPromise,
  critics: criticsPromise,
}: {
  filters: Promise<FiltersRankings>;
  critics: Promise<CriticQuery[]>;
}) {
  const filters = await filtersPromise;
  const critics = await criticsPromise;
  return <RankingsFiltersClient filters={filters} critics={critics} />;
}
