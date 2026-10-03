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
        className="group/ranking-row relative cursor-pointer p-4 transition-transform hover:-translate-y-0.5 md:p-5"
      >
        <div className="grid items-center gap-x-3 gap-y-3 lg:grid-cols-[auto_auto_minmax(150px,1.2fr)_auto_minmax(150px,0.9fr)_minmax(100px,0.75fr)] lg:gap-x-4">
          <div className="row-start-1 shrink-0">
            <RankingPositionMarker position={position} size="lg" />
          </div>

          <div className="row-start-1 shrink-0">
            <CategoryIcon category={productCategory} size="lg" />
          </div>

          <p
            className="col-start-3 row-start-1 min-w-0 line-clamp-2 font-medium leading-tight"
            title={productName}
          >
            {productName}
          </p>

          <div className="col-start-3 row-start-2 flex items-center gap-2 lg:col-start-4 lg:row-start-1">
            <NumberFormatted
              className="text-3xl font-semibold text-secondary"
              num={ratingAvg}
              min={1}
              max={2}
            />
            <StarsForRating rating={ratingAvg} size="small" />
            <span className="shrink-0 text-sm text-tertiary">
              ({numOfReviews})
            </span>
          </div>

          <div className="col-start-3 row-start-3 min-w-0 text-sm lg:col-start-5 lg:row-start-1">
            <span className="font-medium text-secondary transition-colors group-hover/ranking-row:text-primary">
              {placeName}
            </span>
          </div>

          <div className="col-start-3 row-start-4 min-w-0 text-sm lg:col-start-6 lg:row-start-1">
            <span className="block truncate" title={citiesLabel ?? undefined}>
              {citiesLabel ?? "—"}
            </span>
          </div>
        </div>
      </Box>
    </RankingDrawer>
  );
}
