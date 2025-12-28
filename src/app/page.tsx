import { Box } from "@/components/box";
import { IconRankovo } from "@/components/icons";
import { RankingsFilters } from "@/components/rankings-filters";
import { RankingsFiltersSkeleton } from "@/components/rankings-filters.client";
import { RankingsList } from "@/components/rankings-list";
import {
  RankingSearch,
  RankingsSearchShell,
} from "@/components/rankings-search";
import { SectionHeader } from "@/components/section-header";
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
    <div className="px-4 md:px-0 md:pt-12">
      <HeroSection />

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
