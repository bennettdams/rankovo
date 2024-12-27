"use server";

import { revalidateTag } from "next/cache";
import { type Ranking, rankings } from "./mock-data";

export async function actionUpdateRanking(rankingUpdated: Ranking) {
  console.debug("🟦 ACTION update ranking");

  await new Promise((r) => setTimeout(r, 1000));

  const index = rankings.findIndex(
    (ranking) => ranking.id === rankingUpdated.id,
  );
  if (index !== -1) {
    rankings[index] = rankingUpdated;
  }

  revalidateTag("rankings");
  return true;
}
