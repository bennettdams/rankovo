import type { FiltersRankings } from "@/app/page";
import { RankingsSearchClient } from "./rankings-search.client";

export async function RankingSearch({
  filters: filtersPromise,
}: {
  filters: Promise<FiltersRankings>;
}) {
  const filters = await filtersPromise;

  return <RankingsSearchClient searchQuery={filters.q} />;
}
