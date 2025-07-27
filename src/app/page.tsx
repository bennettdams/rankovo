import { Box } from "@/components/box";
import { IconRankovo } from "@/components/icons";
import { NumberFormatted } from "@/components/number-formatted";
import { RankingPositionMarker } from "@/components/ranking-position-marker";
import { RankingFilters } from "@/components/rankings-filters";
import { RankingsFiltersSkeleton } from "@/components/rankings-filters.client";
import { RankingsList } from "@/components/rankings-list";
import { SkeletonList } from "@/components/skeletons";
import { StarsForRating } from "@/components/stars-for-rating";
import { queries, type RankingsTop3CategorizedQuery } from "@/data/queries";
import { type Category, cities, ratingHighest } from "@/data/static";
import { schemaCategory, schemaRating, schemaUsername } from "@/db/db-schema";
import {
  schemaSearchParamMultiple,
  schemaSearchParamSingle,
} from "@/lib/schemas";
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

export default async function PageHome({
  searchParams,
}: {
  searchParams: Promise<unknown>;
}) {
  const filters = searchParams.then((params) =>
    schemaParamsRankings.parse(params),
  );
  const criticsPromise = queries.critics();
  const rankingsTop3CategorizedPromise = queries.rankingsTop3Categorized();

  return (
    <div className="md:pt-12">
      <HeroSection />

      <div className="mt-10">
        <h2 className="mb-5 text-center text-4xl">Top products by category</h2>
        <TopByCategories
          rankingsTop3CategorizedPromise={rankingsTop3CategorizedPromise}
        />
      </div>

      <div className="mt-6 flex flex-col-reverse gap-x-4 gap-y-10 px-4 md:mt-20 md:flex-row md:px-0">
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

        <h1 className="text-4xl font-extrabold tracking-tight text-fg md:text-5xl lg:text-6xl">
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
  rankingsTop3CategorizedPromise,
}: {
  rankingsTop3CategorizedPromise: Promise<RankingsTop3CategorizedQuery>;
}) {
  const rankingsCategorized = await rankingsTop3CategorizedPromise;

  return (
    <div className="flex gap-x-4 overflow-x-auto px-4 sm:px-6 md:grid md:grid-cols-3 md:gap-x-8 md:overflow-x-visible md:px-0 lg:px-8">
      <div className="min-w-[280px] flex-shrink-0 md:min-w-0">
        <TopByCategoryCard
          category="burger"
          rankings={rankingsCategorized.burger}
        />
      </div>
      <div className="min-w-[280px] flex-shrink-0 md:min-w-0">
        <TopByCategoryCard
          category="kebab"
          rankings={rankingsCategorized.kebab}
        />
      </div>
      <div className="min-w-[280px] flex-shrink-0 md:min-w-0">
        <TopByCategoryCard
          category="pizza"
          rankings={rankingsCategorized.pizza}
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
  rankings: RankingsTop3CategorizedQuery[CategoryForTop];
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

      <div className="grid grid-cols-[min-content,1fr] grid-rows-3 place-items-center gap-y-4 py-4">
        {/* RANKING ONE */}
        <div className="mx-2 md:mx-3">
          <RankingPositionMarker
            position={1}
            labelOverwrite={
              !rankingOne ? (
                ""
              ) : (
                <NumberFormatted
                  className="text-xl"
                  num={rankingOne.ratingAvg}
                  min={2}
                  max={2}
                />
              )
            }
          />
        </div>
        <p className="line-clamp-2 place-self-start self-center font-bold">
          {rankingOne?.name ?? "-"}
        </p>

        {/* RANKING TWO */}
        <div className="mx-2 md:mx-3">
          <RankingPositionMarker
            position={2}
            labelOverwrite={
              !rankingTwo ? (
                ""
              ) : (
                <NumberFormatted
                  className="text-xl"
                  num={rankingTwo.ratingAvg}
                  min={2}
                  max={2}
                />
              )
            }
          />
        </div>
        <p className="line-clamp-2 place-self-start self-center">
          {rankingTwo?.name ?? "-"}
        </p>

        {/* RANKING THREE */}
        <div className="mx-2 md:mx-3">
          <RankingPositionMarker
            position={3}
            labelOverwrite={
              !rankingThree ? (
                ""
              ) : (
                <NumberFormatted
                  className="text-xl"
                  num={rankingThree.ratingAvg}
                  min={2}
                  max={2}
                />
              )
            }
          />
        </div>
        <p className="line-clamp-2 place-self-start self-center">
          {rankingThree?.name ?? "-"}
        </p>
      </div>
    </Box>
  );
}
