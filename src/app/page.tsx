import { Box } from "@/components/box";
import { IconRankovo } from "@/components/icons";
import { NumberFormatted } from "@/components/number-formatted";
import { ProductDescriptionRow } from "@/components/product-description-row";
import { RankingDrawer } from "@/components/ranking-drawer";
import { RankingPositionMarker } from "@/components/ranking-position-marker";
import { RankingsFilters } from "@/components/rankings-filters";
import { RankingsFiltersSkeleton } from "@/components/rankings-filters.client";
import { RankingsList } from "@/components/rankings-list";
import {
  RankingSearch,
  RankingsSearchShell,
} from "@/components/rankings-search";
import { SkeletonList } from "@/components/skeletons";
import { StarsForRating } from "@/components/stars-for-rating";
import {
  queries,
  type QueryRankingWithReviews,
  type RankingWithReviewsQuery,
} from "@/data/queries";
import { cities, ratingHighest, type Category } from "@/data/static";
import { schemaCategory, schemaRating, schemaUsername } from "@/db/db-schema";
import { t } from "@/lib/i18n";
import {
  schemaSearchParamMultiple,
  schemaSearchParamSingle,
} from "@/lib/schemas";
import { MapPin, Medal, Search, Trophy } from "lucide-react";
import Image from "next/image";
import { Suspense } from "react";
import { z } from "zod";
import { HeaderQuestion } from "./header-question.client";
import { RankingsSectionClient } from "./rankings-section.client";

const schemaParamsRankings = z.object({
  categories: schemaSearchParamMultiple(schemaCategory),
  cities: schemaSearchParamMultiple(z.enum(cities)),
  critics: schemaSearchParamMultiple(schemaUsername),
  "rating-min": schemaSearchParamSingle(schemaRating, "number"),
  "rating-max": schemaSearchParamSingle(schemaRating, "number"),
  q: schemaSearchParamSingle(z.string().min(1), "string"),
});

export type FiltersRankings = z.output<typeof schemaParamsRankings>;

const defaultFilters: FiltersRankings = {
  categories: null,
  cities: null,
  critics: null,
  "rating-min": null,
  "rating-max": null,
  q: null,
};

export default async function PageHome({
  searchParams,
}: {
  searchParams: Promise<unknown>;
}) {
  const filters = searchParams.then((params) =>
    schemaParamsRankings.parse(params),
  );
  const criticsPromise = queries.critics();
  const rankingsBurgersPromise = queries.rankingsWithReviews({
    ...defaultFilters,
    categories: ["burger"],
  });
  const rankingsDoenersPromise = queries.rankingsWithReviews({
    ...defaultFilters,
    categories: ["doener"],
  });
  const rankingsPizzasPromise = queries.rankingsWithReviews({
    ...defaultFilters,
    categories: ["pizza"],
  });

  return (
    <div className="px-4 md:px-0 md:pt-12">
      <HeroSection />

      <SectionHeader>Die Champions</SectionHeader>

      <TopByCategories
        rankingsBurgersPromise={rankingsBurgersPromise}
        rankingsDoenersPromise={rankingsDoenersPromise}
        rankingsPizzasPromise={rankingsPizzasPromise}
      />

      <SectionHeader>Filter nach deinem Geschmack</SectionHeader>

      <Suspense fallback={<RankingsSearchShell />}>
        <RankingSearch filters={filters} />
      </Suspense>

      <RankingsSectionClient
        filtersSlot={
          <Suspense fallback={<RankingsFiltersSkeleton />}>
            <RankingsFilters filters={filters} critics={criticsPromise} />
          </Suspense>
        }
        listSlot={
          <Suspense fallback={<SkeletonList />}>
            <RankingsList filters={filters} />
          </Suspense>
        }
      />

      <AboutSection />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="flex w-full flex-col gap-y-6 overflow-hidden rounded-3xl pb-8 pt-12 md:pb-16 md:pt-20">
      <div className="flex flex-col items-center space-y-6 px-4 text-center md:px-6">
        <IconRankovo className="h-16 w-16" />

        <h1 className="animate-appear text-5xl font-extrabold tracking-tight text-fg md:text-6xl lg:text-7xl">
          <span className="block bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">
            Rankovo
          </span>
        </h1>

        <div className="mx-auto w-min rounded-full bg-white/50 px-4 py-2 shadow-sm backdrop-blur-sm">
          <StarsForRating rating={ratingHighest} />
        </div>

        <p className="mx-auto max-w-[600px] text-xl font-medium text-fg md:text-2xl">
          <span className="block md:inline">Keine Überraschungen.</span>
          <span className="block md:ml-2 md:inline">
            Nur das <span className="italic text-primary">Allerbeste</span>.
          </span>
        </p>
      </div>

      <div className="mx-auto w-80">
        <HeaderQuestion />
      </div>
    </section>
  );
}

async function TopByCategories({
  rankingsBurgersPromise,
  rankingsDoenersPromise,
  rankingsPizzasPromise,
}: {
  rankingsBurgersPromise: QueryRankingWithReviews;
  rankingsDoenersPromise: QueryRankingWithReviews;
  rankingsPizzasPromise: QueryRankingWithReviews;
}) {
  const [rankingsBurgers, rankingsDoeners, rankingsPizzas] = await Promise.all([
    rankingsBurgersPromise,
    rankingsDoenersPromise,
    rankingsPizzasPromise,
  ]);

  return (
    <div className="flex gap-x-4 overflow-x-auto md:grid md:grid-cols-3 md:gap-x-8 md:overflow-x-visible">
      <div className="min-w-[300px] flex-shrink-0 md:min-w-0">
        <TopByCategoryCard
          category="burger"
          rankings={rankingsBurgers.rankings}
        />
      </div>
      <div className="min-w-[300px] flex-shrink-0 md:min-w-0">
        <TopByCategoryCard
          category="doener"
          rankings={rankingsDoeners.rankings}
        />
      </div>
      <div className="min-w-[300px] flex-shrink-0 md:min-w-0">
        <TopByCategoryCard
          category="pizza"
          rankings={rankingsPizzas.rankings}
        />
      </div>
    </div>
  );
}

const categoriesForTop = {
  burger: "/category-card-burger.png",
  pizza: "/category-card-pizza.png",
  doener: "/category-card-doener.png",
} as const satisfies Partial<Record<Category, string>>;
type CategoryForTop = keyof typeof categoriesForTop;

function TopByCategoryCard({
  category,
  rankings,
}: {
  category: CategoryForTop;
  rankings: RankingWithReviewsQuery[];
}) {
  const rankingOne = rankings[0];
  const rankingTwo = rankings[1];
  const rankingThree = rankings[2];
  const rankingFour = rankings[3];
  const rankingFive = rankings[4];

  return (
    <Box variant="xl" className="group overflow-hidden p-0">
      <div className="relative h-48 overflow-hidden">
        <Image
          src={categoriesForTop[category]}
          alt="Kategoriebild"
          width={300}
          height={200}
          priority
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <h3 className="absolute bottom-4 left-4 text-3xl font-extrabold capitalize tracking-tight text-white drop-shadow-md">
          {t[category]}
        </h3>
      </div>

      <div className="grid grid-cols-[min-content,1fr] grid-rows-3 place-items-center gap-y-2">
        {/* RANKING ONE */}
        {!rankingOne ? (
          <RankingCardRow position={1} ranking={null} />
        ) : (
          <RankingDrawer
            placeName={rankingOne.placeName}
            ratingAvg={rankingOne.ratingAvg}
            productName={rankingOne.productName}
            productCategory={rankingOne.productCategory}
            productNote={rankingOne.productNote}
            city={rankingOne.city}
            lastReviewedAt={rankingOne.lastReviewedAt}
            numOfReviews={rankingOne.numOfReviews}
            reviews={rankingOne.reviews}
          >
            <RankingCardRow position={1} ranking={rankingOne} />
          </RankingDrawer>
        )}

        {/* RANKING TWO */}
        {!rankingTwo ? (
          <RankingCardRow position={2} ranking={null} />
        ) : (
          <RankingDrawer
            placeName={rankingTwo.placeName}
            ratingAvg={rankingTwo.ratingAvg}
            productName={rankingTwo.productName}
            productCategory={rankingTwo.productCategory}
            productNote={rankingTwo.productNote}
            city={rankingTwo.city}
            lastReviewedAt={rankingTwo.lastReviewedAt}
            numOfReviews={rankingTwo.numOfReviews}
            reviews={rankingTwo.reviews}
          >
            <RankingCardRow position={2} ranking={rankingTwo} />
          </RankingDrawer>
        )}

        {/* RANKING THREE */}
        {!rankingThree ? (
          <RankingCardRow position={3} ranking={null} />
        ) : (
          <RankingDrawer
            placeName={rankingThree.placeName}
            ratingAvg={rankingThree.ratingAvg}
            productName={rankingThree.productName}
            productCategory={rankingThree.productCategory}
            productNote={rankingThree.productNote}
            city={rankingThree.city}
            lastReviewedAt={rankingThree.lastReviewedAt}
            numOfReviews={rankingThree.numOfReviews}
            reviews={rankingThree.reviews}
          >
            <RankingCardRow position={3} ranking={rankingThree} />
          </RankingDrawer>
        )}

        {/* RANKING FOUR */}
        {!rankingFour ? (
          <RankingCardRow position={4} ranking={null} />
        ) : (
          <RankingDrawer
            placeName={rankingFour.placeName}
            ratingAvg={rankingFour.ratingAvg}
            productName={rankingFour.productName}
            productCategory={rankingFour.productCategory}
            productNote={rankingFour.productNote}
            city={rankingFour.city}
            lastReviewedAt={rankingFour.lastReviewedAt}
            numOfReviews={rankingFour.numOfReviews}
            reviews={rankingFour.reviews}
          >
            <RankingCardRow position={4} ranking={rankingFour} />
          </RankingDrawer>
        )}

        {/* RANKING FIVE */}
        {!rankingFive ? (
          <RankingCardRow position={5} ranking={null} />
        ) : (
          <RankingDrawer
            placeName={rankingFive.placeName}
            ratingAvg={rankingFive.ratingAvg}
            productName={rankingFive.productName}
            productCategory={rankingFive.productCategory}
            productNote={rankingFive.productNote}
            city={rankingFive.city}
            lastReviewedAt={rankingFive.lastReviewedAt}
            numOfReviews={rankingFive.numOfReviews}
            reviews={rankingFive.reviews}
          >
            <RankingCardRow position={5} ranking={rankingFive} />
          </RankingDrawer>
        )}
      </div>
    </Box>
  );
}

function RankingCardRow({
  position,
  ranking,
}: {
  position: 1 | 2 | 3 | 4 | 5;
  ranking: RankingWithReviewsQuery | null;
}) {
  return (
    <div className="group/ranking-card-row col-span-2 grid cursor-pointer grid-cols-subgrid py-2 hover:bg-secondary hover:text-secondary-fg">
      <div className="mx-2 md:mx-3">
        <RankingPositionMarker
          position={position}
          labelOverwrite={
            !ranking ? (
              ""
            ) : (
              <NumberFormatted
                className="text-xl"
                num={ranking.ratingAvg}
                min={2}
                max={2}
              />
            )
          }
        />
      </div>

      <ProductDescriptionRow
        productName={ranking?.productName ?? null}
        placeName={ranking?.placeName ?? null}
        city={ranking?.city ?? null}
        showBold={position === 1}
      />
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex animate-appear flex-col items-center pb-6 pt-16">
      <div className="flex items-center gap-2">
        <h2 className="text-center text-4xl font-extrabold tracking-tight text-primary">
          {children}
        </h2>
      </div>
      <span className="mt-2 block h-1 w-52 rounded-full bg-gradient-to-r from-primary to-secondary opacity-80" />
    </div>
  );
}

function AboutSection() {
  return (
    <div className="mx-auto mt-24 w-full max-w-6xl px-4 pb-20">
      <div className="mb-16 text-center">
        <h2 className="text-3xl font-bold text-secondary md:text-5xl">
          Was ist Rankovo?
        </h2>
        <p className="mt-4 text-xl text-fg">
          Dein Kompass für den guten Geschmack.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <FeatureCard
          icon={<Trophy className="h-8 w-8 text-primary" />}
          title="Die Besten der Besten"
          description="Finde die besten Gerichte in ihrer Kategorie. Keine Mittelmäßigkeit, nur Highlights."
        />
        <FeatureCard
          icon={<Search className="h-8 w-8 text-secondary" />}
          title="Transparente Analyse"
          description="Wir sammeln Bewertungen aus verschiedenen Quellen für ein objektives Ergebnis."
        />
        <FeatureCard
          icon={<Medal className="h-8 w-8 text-tertiary" />}
          title="Experten & Community"
          description="Ein Mix aus echten Nutzerbewertungen und geprüften Expertenmeinungen."
        />
        <FeatureCard
          icon={<MapPin className="h-8 w-8 text-error" />}
          title="Lokal & Relevant"
          description="Finde das beste Gericht direkt in deiner Nachbarschaft."
        />
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Box
      variant="xl"
      className="group flex flex-col items-center p-6 text-center transition-all hover:-translate-y-1"
    >
      <div className="mb-4 p-4 transition-transform group-hover:scale-110">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-bold text-fg">{title}</h3>
      <p className="text-fg">{description}</p>
    </Box>
  );
}
