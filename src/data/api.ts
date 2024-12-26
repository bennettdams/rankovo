import type { FiltersRankings } from "@/lib/schemas";
import { createMockRankings } from "./mock-data";

async function getRankings(filters: FiltersRankings) {
  await new Promise((r) => setTimeout(r, 1000));

  return createMockRankings(filters);
}

export const api = { getRankings };
