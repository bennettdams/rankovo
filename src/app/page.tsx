import { Box } from "@/components/box";
import { IconRankovo } from "@/components/icons";
import { NumberFormatted } from "@/components/number-formatted";
import { RankingDrawer } from "@/components/ranking-drawer";
import { RankingPositionMarker } from "@/components/ranking-position-marker";
import { RankingFilters } from "@/components/rankings-filters";
import { RankingsFiltersSkeleton } from "@/components/rankings-filters.client";
import { RankingsList } from "@/components/rankings-list";
import { SkeletonList } from "@/components/skeletons";
import { StarsForRating } from "@/components/stars-for-rating";
import {
  queries,
  type QueryRankingWithReviews,
  type RankingWithReviewsQuery,
} from "@/data/queries";
import { cities, ratingHighest, type Category } from "@/data/static";
import { schemaCategory, schemaRating, schemaUsername } from "@/db/db-schema";
import {
  schemaSearchParamMultiple,
  schemaSearchParamSingle,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Suspense } from "react";
import { z } from "zod";
import { HeaderQuestion } from "./header-question.client";

const schemaParamsRankings = z.object({
  categories: schemaSearchParamMultiple(schemaCategory),
  cities: schemaSearchParamMultiple(z.enum(cities)),
  critics: schemaSearchParamMultiple(schemaUsername),
  ratingMin: schemaSearchParamSingle(schemaRating, "number"),
  ratingMax: schemaSearchParamSingle(schemaRating, "number"),
  productName: schemaSearchParamSingle(z.string().min(1), "string"),
  placeName: schemaSearchParamSingle(z.string().min(1), "string"),
});

export type FiltersRankings = z.output<typeof schemaParamsRankings>;

const defaultFilters: FiltersRankings = {
  categories: null,
  cities: null,
  critics: null,
  ratingMin: null,
  ratingMax: null,
  productName: null,
  placeName: null,
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
  const rankingsKebabsPromise = queries.rankingsWithReviews({
    ...defaultFilters,
    categories: ["kebab"],
  });
  const rankingsPizzasPromise = queries.rankingsWithReviews({
    ...defaultFilters,
    categories: ["pizza"],
  });

  return (
    <div className="md:pt-12">
      <HeroSection />

      <SectionHeader>Top products by category</SectionHeader>

      <TopByCategories
        rankingsBurgersPromise={rankingsBurgersPromise}
        rankingsKebabsPromise={rankingsKebabsPromise}
        rankingsPizzasPromise={rankingsPizzasPromise}
      />

      <SectionHeader>All rankings</SectionHeader>

      <div className="flex flex-col-reverse gap-x-4 gap-y-10 px-4 md:flex-row md:px-0">
        <div className="basis-full md:basis-1/3">
          <Suspense fallback={<RankingsFiltersSkeleton />}>
            <RankingFilters filters={filters} critics={criticsPromise} />
          </Suspense>
        </div>

        <div className="basis-full overflow-y-hidden md:basis-2/3">
          <Suspense fallback={<SkeletonList />}>
            <RankingsList filters={filters} />
          </Suspense>
        </div>
      </div>

      <div className="mx-auto mt-14 w-full max-w-5xl px-8">
        <h2 className="mb-10 text-center text-5xl text-secondary">
          What is Rankovo?
        </h2>
        <p className="mt-2 text-lg">
          Rankovo helps you find the best products in your area.
        </p>
        <p className="mt-2 text-lg">
          We collect and analyze reviews from various sources to provide you
          with the most accurate and up-to-date rankings.
        </p>
        <p className="mt-2 text-lg">
          Rankings are calculated based on real user reviews and expert
          opinions. Everyone can create a review!
        </p>
        <p className="mt-2 text-lg">
          Filter rankings by categories, cities, critics, and ratings to find
          exactly what you&apos;re looking for. Whether this is the best
          cheeseburger in town or the new kebab place, Rankovo has it all.
        </p>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="w-full pb-4 md:pb-8">
      <div className="flex flex-col items-center space-y-4 px-4 text-center md:px-6">
        <IconRankovo className="h-12 w-12" />

        <h1 className="animate-appear text-4xl font-extrabold tracking-tight text-fg md:text-5xl lg:text-6xl">
          <span className="block text-primary">Rankovo</span>
        </h1>

        <p className="mx-auto line-clamp-2 max-w-[600px] text-xl text-fg md:text-2xl">
          <span className="block md:inline">No surprises.</span>
          <span className="block md:ml-2 md:inline">Just the best.</span>
        </p>

        <StarsForRating rating={ratingHighest} />
      </div>

      <div className="mt-16">
        <HeaderQuestion />
      </div>
    </section>
  );
}

async function TopByCategories({
  rankingsBurgersPromise,
  rankingsKebabsPromise,
  rankingsPizzasPromise,
}: {
  rankingsBurgersPromise: QueryRankingWithReviews;
  rankingsKebabsPromise: QueryRankingWithReviews;
  rankingsPizzasPromise: QueryRankingWithReviews;
}) {
  const [rankingsBurgers, rankingsKebabs, rankingsPizzas] = await Promise.all([
    rankingsBurgersPromise,
    rankingsKebabsPromise,
    rankingsPizzasPromise,
  ]);

  return (
    <div className="flex gap-x-4 overflow-x-auto px-4 sm:px-6 md:grid md:grid-cols-3 md:gap-x-8 md:overflow-x-visible md:px-0 lg:px-8">
      <div className="min-w-[280px] flex-shrink-0 md:min-w-0">
        <TopByCategoryCard
          category="burger"
          rankings={rankingsBurgers.rankings}
        />
      </div>
      <div className="min-w-[280px] flex-shrink-0 md:min-w-0">
        <TopByCategoryCard
          category="kebab"
          rankings={rankingsKebabs.rankings}
        />
      </div>
      <div className="min-w-[280px] flex-shrink-0 md:min-w-0">
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
  kebab: "/category-card-kebab.png",
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

  return (
    <Box variant="xl" className="overflow-hidden p-0">
      <div className="relative h-48 overflow-hidden">
        <Image
          src={categoriesForTop[category]}
          alt="Category image"
          width={300}
          height={200}
          priority
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <h3 className="absolute bottom-4 left-4 text-2xl font-bold capitalize text-white">
          {category}
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
      </div>
    </Box>
  );
}

function RankingCardRow({
  position,
  ranking,
}: {
  position: 1 | 2 | 3;
  ranking: RankingWithReviewsQuery | null;
}) {
  return (
    <div className="col-span-2 grid cursor-pointer grid-cols-subgrid py-2 hover:bg-secondary hover:text-secondary-fg">
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
      <p
        className={cn(
          "line-clamp-2 place-self-start self-center",
          position === 1 && "font-bold",
        )}
      >
        {ranking?.productName ?? "-"}
      </p>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-appear flex flex-col items-center pb-6 pt-16">
      <div className="flex items-center gap-2">
        <h2 className="text-center text-4xl font-extrabold tracking-tight text-primary">
          {children}
        </h2>
      </div>
      <span className="mt-2 block h-1 w-52 rounded-full bg-gradient-to-r from-primary to-secondary opacity-80" />
    </div>
  );
}
