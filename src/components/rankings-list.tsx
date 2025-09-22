import type { FiltersRankings } from "@/app/page";
import { queries, type RankingWithReviewsQuery } from "@/data/queries";
import { Box } from "./box";
import { CategoryBadge } from "./category-badge";
import { CategoryIcon } from "./category-icon";
import { DateTime } from "./date-time";
import { InfoMessage } from "./info-message";
import { NumberFormatted } from "./number-formatted";
import { RankingDrawer } from "./ranking-drawer";
import { RankingPositionMarker } from "./ranking-position-marker";
import { StarsForRating } from "./stars-for-rating";

export async function RankingsList({
  filters: filtersExternal,
}: {
  filters: Promise<FiltersRankings>;
}) {
  const filters = await filtersExternal;
  const { rankings, queriedAt } = await queries.rankingsWithReviews(filters);

  return (
    <div>
      <div className="grid grid-rows-10 gap-x-3 gap-y-2 overflow-x-scroll">
        {rankings.length === 0 ? (
          <InfoMessage>No rankings for your filters.</InfoMessage>
        ) : (
          rankings.map((ranking, index) => (
            <RankingsTableRow
              key={ranking.productId}
              placeName={ranking.placeName}
              ratingAvg={ranking.ratingAvg}
              productName={ranking.productName}
              productCategory={ranking.productCategory}
              productNote={ranking.productNote}
              city={ranking.city}
              lastReviewedAt={ranking.lastReviewedAt}
              numOfReviews={ranking.numOfReviews}
              reviews={ranking.reviews}
              position={index + 1}
            />
          ))
        )}
      </div>

      <p className="mt-1 text-right text-sm">
        Last update: <DateTime date={queriedAt} format="YYYY-MM-DD hh:mm" />
      </p>
    </div>
  );
}

function RankingsTableRow({
  ratingAvg,
  productName,
  productCategory,
  productNote,
  lastReviewedAt,
  placeName,
  city,
  numOfReviews,
  reviews,
  position,
}: {
  ratingAvg: RankingWithReviewsQuery["ratingAvg"];
  productName: RankingWithReviewsQuery["productName"];
  productCategory: RankingWithReviewsQuery["productCategory"];
  productNote: RankingWithReviewsQuery["productNote"];
  lastReviewedAt: RankingWithReviewsQuery["lastReviewedAt"];
  placeName: RankingWithReviewsQuery["placeName"];
  city: RankingWithReviewsQuery["city"];
  numOfReviews: RankingWithReviewsQuery["numOfReviews"];
  reviews: RankingWithReviewsQuery["reviews"];
  position: number;
}) {
  return (
    <RankingDrawer
      placeName={placeName}
      ratingAvg={ratingAvg}
      productName={productName}
      productCategory={productCategory}
      productNote={productNote}
      city={city}
      lastReviewedAt={lastReviewedAt}
      numOfReviews={numOfReviews}
      reviews={reviews}
    >
      <Box className="group/ranking-row col-span-12 grid h-16 cursor-pointer grid-cols-subgrid items-center rounded-md p-0 transition-colors hover:bg-secondary hover:text-secondary-fg">
        <div className="sticky left-0 z-10 bg-white transition-colors group-hover/ranking-row:bg-secondary group-hover/ranking-row:text-secondary-fg">
          <RankingPositionMarker position={position} />
        </div>
        <div className="w-12 p-0">
          <CategoryIcon category={productCategory} />
        </div>
        <div className="min-w-48" title={productName}>
          <p className="line-clamp-2 font-medium">{productName}</p>
        </div>
        <div>
          <NumberFormatted
            className="text-right"
            num={ratingAvg}
            min={1}
            max={2}
          />
        </div>
        <div className="flex flex-row items-center gap-x-1.5">
          <StarsForRating rating={ratingAvg} size="small" />
          <span className="text-sm text-tertiary">({numOfReviews})</span>
        </div>
        <div>
          <span className="w-full text-nowrap text-secondary group-hover/ranking-row:text-secondary-fg">
            {placeName}
          </span>
        </div>
        <div>
          <span className="w-full text-nowrap">{city}</span>
        </div>
        <div className="font-medium">
          <CategoryBadge category={productCategory} />
        </div>
        <div className="min-w-32" title={productNote ?? undefined}>
          <p className="line-clamp-2 font-medium">{productNote}</p>
        </div>
        {/* Last cell should have some padding to give breathing room when scrolling horizontally */}
        <div className="pr-10">
          {/* TODO remove null check when all reviews have a date */}
          {!lastReviewedAt ? (
            "-"
          ) : (
            <DateTime date={lastReviewedAt} format="YYYY-MM-DD" />
          )}
        </div>
      </Box>
    </RankingDrawer>
  );
}
