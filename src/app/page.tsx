import { IconRankovo } from "@/components/icons";
import { RankingFilters } from "@/components/rankings-filters";
import { RankingsFiltersSkeleton } from "@/components/rankings-filters.client";
import { RankingsList } from "@/components/rankings-list";
import { SkeletonList } from "@/components/skeletons";
import { StarsForRating } from "@/components/stars-for-rating";
import { queries } from "@/data/queries";
import { cities } from "@/data/static";
import { schemaCategory, schemaRating, schemaUsername } from "@/db/db-schema";
import {
  schemaSearchParamMultiple,
  schemaSearchParamSingle,
} from "@/lib/schemas";
import { Suspense } from "react";
import { z } from "zod";

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

  return (
    <div className="md:pt-12">
      <HeroSection />

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
    <section className="w-full pb-12 md:pb-24">
      <div className="px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <IconRankovo className="h-12 w-12" />

          <h1 className="text-4xl font-extrabold tracking-tight text-fg md:text-5xl lg:text-6xl">
            <span className="block text-primary">Rankovo</span>
          </h1>

          <p className="mx-auto line-clamp-2 max-w-[600px] text-xl text-fg md:text-2xl">
            <span className="block md:inline">No surprises.</span>
            <span className="block md:ml-2 md:inline">Just the best.</span>
          </p>

          <StarsForRating rating={5} />
        </div>
      </div>
    </section>
  );
}
