import type { FiltersRankings } from "@/app/page";
import { queries, type RankingWithReviewsQuery } from "@/data/queries";
import { selectRemainingRankings } from "@/lib/business-utils";
import { formatCitiesLabel } from "@/lib/cities";
import { routes } from "@/lib/navigation";
import {
  MapPin,
  RotateCcw,
  SearchX,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import Link from "next/link";
import { Box } from "./box";
import { CategoryIcon } from "./category-icon";
import { DateTime } from "./date-time";
import { NumberFormatted } from "./number-formatted";
import { RankingDrawer } from "./ranking-drawer.client";
import { RankingFilterSummary } from "./ranking-filter-summary.client";
import { RankingPositionMarker } from "./ranking-position-marker";
import { RankingTopPicks } from "./ranking-top-picks";
import { StarsForRating } from "./stars-for-rating";
import { Button } from "./ui/button";

export async function RankingsList({
  filters: filtersExternal,
}: {
  filters: Promise<FiltersRankings>;
}) {
  const filters = await filtersExternal;
  const { rankings, queriedAt } = await queries.rankingsWithReviews(filters);
  const remainingRankings = selectRemainingRankings(rankings);

  return (
    <div>
      <RankingFilterSummary />

      <RankingTopPicks rankings={rankings} />

      {rankings.length === 0 ? (
        <RankingsEmptyState query={filters.q} />
      ) : remainingRankings.length === 0 ? null : (
        <>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-xs font-bold tracking-[0.16em] text-secondary uppercase">
              Weitere Ergebnisse
            </h2>
            <span className="text-xs text-dark-gray">Nach Popularität</span>
          </div>

          <div className="flex flex-col gap-2">
            {remainingRankings.map((ranking, index) => (
              <RankingsTableRow
                key={ranking.productId}
                placeId={ranking.placeId}
                productId={ranking.productId}
                placeName={ranking.placeName}
                ratingAvg={ranking.ratingAvg}
                productName={ranking.productName}
                productCategory={ranking.productCategory}
                productNote={ranking.productNote}
                cities={ranking.cities}
                lastReviewedAt={ranking.lastReviewedAt}
                numOfReviews={ranking.numOfReviews}
                reviews={ranking.reviews}
                position={index + 4}
              />
            ))}
          </div>
        </>
      )}

      <p className="mt-1 text-right text-sm text-dark-gray">
        <span>Letztes Update: </span>
        <DateTime date={queriedAt} format="YYYY-MM-DD hh:mm" />
      </p>
    </div>
  );
}

function RankingsEmptyState({ query }: { query: string | null }) {
  const title = query
    ? `Keine Treffer für „${query}“`
    : "Diese Auswahl ist zu knapp";

  return (
    <section
      aria-labelledby="empty-ranking-title"
      className="relative isolate my-6 overflow-hidden rounded-3xl border border-white/70 bg-white/55 p-6 shadow-lg ring-1 ring-primary/10 md:p-10"
    >
      <div className="pointer-events-none absolute -top-16 -right-10 -z-10 size-44 rounded-full bg-primary/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 -z-10 size-48 rounded-full bg-secondary/10 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary shadow-inner ring-1 ring-primary/20">
            <SearchX className="size-8" strokeWidth={1.7} />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold tracking-[0.16em] text-tertiary uppercase">
              Keine Treffer
            </p>
            <h2
              className="text-2xl tracking-tight text-secondary md:text-3xl"
              id="empty-ranking-title"
            >
              {title}
            </h2>
            <p className="mt-3 max-w-xl leading-relaxed text-dark-gray">
              Keine Bewertungen für deine Filter. Lockere eine Bedingung, dann
              schauen wir noch einmal nach.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <EmptyStateHint
            icon={<SlidersHorizontal />}
            label="Weniger Filter"
            text="Entferne eine Kategorie oder den Mindestwert."
          />
          <EmptyStateHint
            icon={<MapPin />}
            label="Andere Stadt"
            text="Vielleicht gibt es den Treffer nebenan."
          />
          <EmptyStateHint
            icon={<Star />}
            label="Bewertung öffnen"
            text="Lass auch kleinere Ergebnisse zu."
          />
        </div>

        <Button asChild className="mt-8">
          <Link href={routes.rankings} scroll={false}>
            <RotateCcw />
            Filter zurücksetzen
          </Link>
        </Button>
      </div>
    </section>
  );
}

function EmptyStateHint({
  icon,
  label,
  text,
}: {
  icon: React.ReactNode;
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl bg-bg/70 p-4 ring-1 ring-gray/60">
      <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-secondary/10 text-secondary [&_svg]:size-4">
        {icon}
      </div>
      <p className="font-semibold text-fg">{label}</p>
      <p className="mt-1 text-sm leading-snug text-dark-gray">{text}</p>
    </div>
  );
}

function RankingsTableRow({
  placeId,
  productId,
  ratingAvg,
  productName,
  productCategory,
  productNote,
  lastReviewedAt,
  placeName,
  cities,
  numOfReviews,
  reviews,
  position,
}: {
  placeId: RankingWithReviewsQuery["placeId"];
  productId: RankingWithReviewsQuery["productId"];
  ratingAvg: RankingWithReviewsQuery["ratingAvg"];
  productName: RankingWithReviewsQuery["productName"];
  productCategory: RankingWithReviewsQuery["productCategory"];
  productNote: RankingWithReviewsQuery["productNote"];
  lastReviewedAt: RankingWithReviewsQuery["lastReviewedAt"];
  placeName: RankingWithReviewsQuery["placeName"];
  cities: RankingWithReviewsQuery["cities"];
  numOfReviews: RankingWithReviewsQuery["numOfReviews"];
  reviews: RankingWithReviewsQuery["reviews"];
  position: number;
}) {
  const citiesLabel = formatCitiesLabel(cities);

  return (
    <RankingDrawer
      placeId={placeId}
      productId={productId}
      placeName={placeName}
      ratingAvg={ratingAvg}
      productName={productName}
      productCategory={productCategory}
      productNote={productNote}
      cities={cities}
      lastReviewedAt={lastReviewedAt}
      numOfReviews={numOfReviews}
      reviews={reviews}
    >
      <Box
        variant="lg"
        className="group/ranking-row relative cursor-pointer p-4 transition-transform hover:-translate-y-0.5"
      >
        {/* Mobile: Multi-line card layout */}
        <div className="flex flex-col gap-3 lg:hidden">
          {/* Row 1: Position + Icon + Product Name */}
          <div className="flex items-center gap-2">
            <RankingPositionMarker position={position} />
            <p
              className="line-clamp-2 flex-1 leading-tight font-medium"
              title={productName}
            >
              {productName}
            </p>
            <div className="shrink-0">
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
            <span className="font-medium text-secondary transition-colors group-hover/ranking-row:text-primary">
              {placeName}
            </span>
            {citiesLabel && (
              <>
                <span className="text-tertiary">•</span>
                <span>{citiesLabel}</span>
              </>
            )}
          </div>
        </div>

        {/* Desktop: Horizontal row layout */}
        <div className="hidden items-center gap-4 lg:flex">
          {/* Position */}
          <div className="shrink-0">
            <RankingPositionMarker position={position} />
          </div>

          {/* Icon */}
          <div className="shrink-0">
            <CategoryIcon category={productCategory} />
          </div>

          {/* Product Name */}
          <div className="min-w-0 flex-1 basis-40" title={productName}>
            <p className="line-clamp-2 font-medium text-ellipsis">
              {productName}
            </p>
          </div>

          {/* Rating Number */}
          <div className="basis-10">
            <NumberFormatted
              className="text-2xl"
              num={ratingAvg}
              min={1}
              max={2}
            />
          </div>

          {/* Stars + Review Count */}
          <div className="flex shrink-0 items-center gap-1.5">
            <StarsForRating rating={ratingAvg} size="small" />
            <span className="text-sm text-tertiary">({numOfReviews})</span>
          </div>

          {/* Place Name */}
          <div className="min-w-0 shrink-0 basis-36">
            <span className="line-clamp-2 text-secondary transition-colors group-hover/ranking-row:text-primary">
              {placeName}
            </span>
          </div>

          {/* City */}
          <div className="min-w-0 shrink-0 basis-36">
            <span className="block truncate" title={citiesLabel ?? undefined}>
              {citiesLabel}
            </span>
          </div>
        </div>
      </Box>
    </RankingDrawer>
  );
}
