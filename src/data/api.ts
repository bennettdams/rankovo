import type { FiltersRankings } from "@/lib/schemas";
import { unstable_cacheTag as cacheTag } from "next/cache";
import { createMockRankings } from "./mock-data";

async function getRankings(filters: FiltersRankings) {
  "use cache";
  cacheTag("rankings");
  console.debug("🟦 API rankings");

  await new Promise((r) => setTimeout(r, 1000));

  return createMockRankings(filters);
}

export const api = { getRankings };
