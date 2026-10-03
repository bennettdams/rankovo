import { formatCitiesLabel } from "@/lib/cities";
import { selectTopPicks } from "@/lib/business-utils";
import type { RankingWithReviewsQuery } from "@/data/queries";
import { CategoryIcon } from "./category-icon";
import { RankingDrawer } from "./ranking-drawer.client";
import { RankingPositionMarker } from "./ranking-position-marker";
import { StarsForRating } from "./stars-for-rating";
import { NumberFormatted } from "./number-formatted";

export function RankingTopPicks({
  rankings,
}: {
  rankings: RankingWithReviewsQuery[];
}) {
  const topPicks = selectTopPicks(rankings);

  if (topPicks.length === 0) return null;

  return (
    <section aria-label="Top 3" className="mb-8">
      <div className="grid gap-3 lg:grid-cols-3">
        {topPicks.map((ranking, index) => (
          <RankingTopPick
            key={ranking.productId}
            position={index + 1}
            ranking={ranking}
          />
        ))}
      </div>
    </section>
  );
}

function RankingTopPick({
  position,
  ranking,
}: {
  position: number;
  ranking: RankingWithReviewsQuery;
}) {
  const citiesLabel = formatCitiesLabel(ranking.cities);
  const isFirst = position === 1;

  return (
    <RankingDrawer
      {...ranking}
      triggerAriaLabel={`Top-Pick ${position}: Details zu ${ranking.productName} bei ${ranking.placeName}`}
    >
      <div
        className={`relative min-h-48 cursor-pointer rounded-2xl p-5 transition-transform hover:-translate-y-0.5 ${
          isFirst
            ? "bg-secondary text-secondary-fg shadow-lg"
            : "bg-white/55 text-fg shadow-md ring-1 ring-white/70"
        }`}
      >
        <div className="mb-8 flex items-start justify-between gap-3">
          <RankingPositionMarker
            labelOverwrite={
              <span className="text-lg font-semibold">{position}</span>
            }
            position={position}
          />
          <CategoryIcon category={ranking.productCategory} />
        </div>

        <p className="line-clamp-2 text-lg leading-tight font-semibold">
          {ranking.productName}
        </p>
        <p
          className={`mt-1 truncate text-sm ${
            isFirst ? "text-secondary-fg/75" : "text-dark-gray"
          }`}
        >
          {ranking.placeName}
          {citiesLabel ? ` · ${citiesLabel}` : null}
        </p>

        <div className="mt-5 flex items-end justify-between gap-3">
          <div className="flex items-baseline gap-1.5">
            <NumberFormatted
              className={`text-4xl font-semibold ${
                isFirst ? "text-secondary-fg" : "text-secondary"
              }`}
              max={2}
              min={1}
              num={ranking.ratingAvg}
            />
            <StarsForRating rating={ranking.ratingAvg} size="small" />
          </div>
          <span
            className={`text-right text-xs ${
              isFirst ? "text-secondary-fg/75" : "text-dark-gray"
            }`}
          >
            {ranking.numOfReviews}{" "}
            {ranking.numOfReviews === 1 ? "Bewertung" : "Bewertungen"}
          </span>
        </div>
      </div>
    </RankingDrawer>
  );
}
