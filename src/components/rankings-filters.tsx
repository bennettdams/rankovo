import type { CriticQuery } from "@/data/queries";
import { RankingsFiltersClient } from "./rankings-filters.client";

/** Server component that awaits filter data */
export async function RankingsFilters({
  critics: criticsPromise,
}: {
  critics: Promise<CriticQuery[]>;
}) {
  const critics = await criticsPromise;

  return <RankingsFiltersClient critics={critics} />;
}
