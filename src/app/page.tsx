import { IconRankovo } from "@/components/icons";
import { MapWithPlace } from "@/components/map-with-place";
import { RankingFilters } from "@/components/rankings-filters";
import { RankingsFiltersSkeleton } from "@/components/rankings-filters.client";
import { RankingsList } from "@/components/rankings-list";
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
          <Suspense
            fallback={
              <div className="flex flex-col gap-y-6">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    className="mx-auto flex flex-row items-center"
                    key={index}
                  >
                    <div className="size-12 animate-pulse rounded-full bg-white/80" />
                    <div className="ml-10 h-12 w-72 animate-pulse rounded-lg bg-white/80" />
                  </div>
                ))}
              </div>
            }
          >
            <RankingsList filters={filters} />
          </Suspense>
        </div>
      </div>

      <div className="mt-10 grid h-[30rem]">
        <MapWithPlace placeName="Five Guys" city="Hamburg" />
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
