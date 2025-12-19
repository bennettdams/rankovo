import type { FiltersRankings } from "@/app/page";
import { queries, type RankingWithReviewsQuery } from "@/data/queries";
import { Box } from "./box";
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
      <div className="flex flex-col gap-2">
        {rankings.length === 0 ? (
          <InfoMessage>Keine Bewertungen für deine Filter</InfoMessage>
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

      <p className="mt-1 text-right text-sm text-dark-gray">
        <span>Letztes Update: </span>
        <span>
          <DateTime date={queriedAt} format="YYYY-MM-DD hh:mm" />
        </span>
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
      <Box
        variant="lg"
        className="group/ranking-row cursor-pointer p-3 transition-colors hover:bg-secondary hover:text-secondary-fg lg:p-3"
      >
        {/* Mobile: Multi-line card layout */}
        <div className="flex flex-col gap-3 lg:hidden">
          {/* Row 1: Position + Icon + Product Name */}
          <div className="flex items-center gap-2">
            <RankingPositionMarker position={position} />
            <p
              className="line-clamp-2 flex-1 font-medium leading-tight"
              title={productName}
            >
              {productName}
            </p>
            <div className="flex-shrink-0">
              <CategoryIcon category={productCategory} />
            </div>
          </div>

          {/* Row 2: Rating + Stars + Reviews + Product Note */}
          <div className="flex items-center gap-2">
            <NumberFormatted
              className="font-semibold"
              num={ratingAvg}
              min={1}
              max={2}
            />
            <StarsForRating rating={ratingAvg} size="small" />
            <span className="text-sm text-tertiary">({numOfReviews})</span>
            {productNote && (
              <>
                <span className="text-tertiary">•</span>
                <span
                  className="flex-1 truncate text-sm text-tertiary"
                  title={productNote}
                >
                  {productNote}
                </span>
              </>
            )}
          </div>

          {/* Row 3: Place + City */}
          <div className="flex flex-wrap items-center gap-x-2 text-sm">
            <span className="font-medium text-secondary group-hover/ranking-row:text-secondary-fg">
              {placeName}
            </span>
            {city && (
              <>
                <span className="text-tertiary">•</span>
                <span>{city}</span>
              </>
            )}
          </div>
        </div>

        {/* Desktop: Horizontal row layout */}
        <div className="hidden items-center gap-4 lg:flex">
          {/* Position */}
          <div className="flex-shrink-0">
            <RankingPositionMarker position={position} />
          </div>

          {/* Icon */}
          <div className="flex-shrink-0">
            <CategoryIcon category={productCategory} />
          </div>

          {/* Product Name */}
          <div className="min-w-0 flex-1" title={productName}>
            <p className="truncate font-medium">{productName}</p>
          </div>

          {/* Rating Number */}
          <div className="w-10">
            <NumberFormatted
              className="font-semibold"
              num={ratingAvg}
              min={1}
              max={2}
            />
          </div>

          {/* Stars + Review Count */}
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <StarsForRating rating={ratingAvg} size="small" />
            <span className="text-sm text-tertiary">({numOfReviews})</span>
          </div>

          {/* Place Name */}
          <div className="min-w-0 flex-shrink-0" style={{ flexBasis: "140px" }}>
            <span className="truncate text-secondary group-hover/ranking-row:text-secondary-fg">
              {placeName}
            </span>
          </div>

          {/* City */}
          <div className="flex-shrink-0" style={{ flexBasis: "100px" }}>
            <span>{city}</span>
          </div>
        </div>
      </Box>
    </RankingDrawer>
  );
}
