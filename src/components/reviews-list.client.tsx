"use client";

import type { RankingWithReviewsQuery } from "@/data/queries";
import { RankingDrawer } from "./ranking-drawer";

export function ReviewWithDrawerClient({
  ranking,
  children,
}: {
  ranking: RankingWithReviewsQuery;
  children: React.ReactNode;
}) {
  return (
    <RankingDrawer
      ratingAvg={ranking.ratingAvg}
      productName={ranking.productName}
      productCategory={ranking.productCategory}
      productNote={ranking.productNote}
      lastReviewedAt={ranking.lastReviewedAt}
      placeName={ranking.placeName}
      city={ranking.city}
      numOfReviews={ranking.numOfReviews}
      reviews={ranking.reviews}
    >
      {children}
    </RankingDrawer>
  );
}
