import { IconRankovo } from "@/components/icons";
import { MapWithPlace } from "@/components/map-with-place";
import { RankingsFilters } from "@/components/rankings-filters.client";
import { RankingsList } from "@/components/rankings-list";
import { StarsForRating } from "@/components/stars-for-rating";
import { schemaFiltersRankings } from "@/lib/schemas";
import { Suspense } from "react";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<unknown>;
}) {
  const filters = searchParams.then((params) =>
    schemaFiltersRankings.parse(params),
  );

  return (
    <div className="pt-8 md:pt-12">
      <HeroSection />

      <Suspense fallback={<div>Loading filters...</div>}>
        <RankingsFilters filters={filters} />
      </Suspense>

      {/* keep gap-x in sync with the other elements (map & rankings list) */}
      <div className="mt-10 grid min-h-full grid-cols-2 gap-x-10">
        <div className="col-span-2 md:col-span-1">
          <MapWithPlace />
        </div>

        <div className="col-span-2 md:col-span-1">
          <Suspense fallback={<div>Loading rankings...</div>}>
            <RankingsList filters={filters} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="w-full pb-12 md:pb-24">
      <div className="container px-4 md:px-6">
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
