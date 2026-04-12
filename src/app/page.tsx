import { Box } from "@/components/box";
import { IconRankovo } from "@/components/icons";
import { RankingsFilters } from "@/components/rankings-filters";
import { RankingsFiltersSkeleton } from "@/components/rankings-filters.client";
import { RankingsList } from "@/components/rankings-list";
import {
  RankingSearch,
  RankingsSearchShell,
} from "@/components/rankings-search";
import { SkeletonList } from "@/components/skeletons";
import { StarsForRating } from "@/components/stars-for-rating";
import { queries } from "@/data/queries";
import { cities, ratingHighest } from "@/data/static";
import { schemaCategory, schemaRating, schemaUsername } from "@/db/db-schema";
import {
  schemaSearchParamMultiple,
  schemaSearchParamSingle,
} from "@/lib/schemas";
import { MapPin, Medal, Search, Trophy } from "lucide-react";
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
  "reviews-min": schemaSearchParamSingle(z.number().int().min(1), "number"),
  q: schemaSearchParamSingle(z.string().min(1), "string"),
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
    <div className="px-4 md:px-0 md:pt-8">
      <HeroSection
        searchSlot={
          <Suspense fallback={<RankingsSearchShell />}>
            <RankingSearch filters={filters} />
          </Suspense>
        }
      />

      <div className="mt-12 md:mt-20">
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
      </div>

      <AboutSection />
    </div>
  );
}

function HeroSection({ searchSlot }: { searchSlot: React.ReactNode }) {
  return (
    <section className="relative flex w-full flex-col items-center gap-y-8 overflow-hidden px-6 pt-12 md:gap-y-12 md:px-12 md:pt-16">
      <div className="relative z-10 flex flex-col items-center space-y-8 text-center">
        <div className="flex items-center justify-center gap-4">
          <IconRankovo className="h-12 w-12 md:h-16 md:w-16" />
          <div className="rounded-full bg-white/60 px-4 py-1.5 shadow-sm backdrop-blur-sm">
            <StarsForRating rating={ratingHighest} />
          </div>
        </div>

        <h1 className="max-w-4xl animate-appear text-5xl font-extrabold tracking-tight text-fg md:text-7xl lg:text-7xl">
          <span className="bg-gradient-to-br from-primary to-tertiary bg-clip-text text-transparent">
            Rankovo
          </span>
        </h1>

        <p className="mx-auto max-w-2xl text-xl font-medium leading-relaxed md:text-2xl">
          Keine Überraschungen. Nur das{" "}
          <span className="italic text-primary">Allerbeste</span>.
        </p>
      </div>

      <div className="mx-auto w-full max-w-sm">
        <HeaderQuestion />
      </div>

      <div className="w-full max-w-md pt-4 md:max-w-lg">{searchSlot}</div>
    </section>
  );
}

function AboutSection() {
  return (
    <Box
      variant="xl"
      className="mx-auto mt-32 w-full max-w-7xl px-6 py-20 md:px-12"
    >
      <div className="mb-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-secondary md:text-5xl">
          Was ist Rankovo?
        </h2>
        <p className="mt-6 text-xl">Dein Kompass für den guten Geschmack.</p>
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
    </Box>
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
      className="group flex flex-col items-center p-8 text-center transition-transform hover:-translate-y-1"
    >
      <div className="mb-6 p-4 transition-transform group-hover:scale-110">
        {icon}
      </div>
      <h3 className="mb-3 text-lg font-bold text-fg">{title}</h3>
      <p className="leading-relaxed">{description}</p>
    </Box>
  );
}
