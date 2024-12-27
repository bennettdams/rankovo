import type { FiltersRankings } from "@/lib/schemas";
import { unstable_cacheTag as cacheTag } from "next/cache";
import { rankings } from "./mock-data";

async function getRankings(filters: FiltersRankings) {
  "use cache";
  cacheTag("rankings");
  console.debug("🟦 API rankings");

  await new Promise((r) => setTimeout(r, 1000));

  const ratingsFiltered = rankings.filter((ranking) => {
    if (
      !!filters.categories &&
      !filters.categories.includes(ranking.category)
    ) {
      return false;
    }
    if (!!filters.ratingMin && ranking.rating < filters.ratingMin) {
      return false;
    }
    if (!!filters.ratingMax && ranking.rating > filters.ratingMax) {
      return false;
    }

    return true;
  });

  return ratingsFiltered;
}

export const api = { getRankings };
