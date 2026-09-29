"use client";

import type { FiltersRankings } from "@/app/page";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import type { CriticQuery } from "@/data/queries";
import { ratingHighest, ratingLowest } from "@/data/static";
import { cn } from "@/lib/utils";
import { SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Box } from "./box";
import { CategoriesSelection } from "./categories-selection";
import { CitiesSelection } from "./cities-selection";
import { FilterButton } from "./filter-button";
import { LoadingSpinner } from "./loading-spinner";
import { useRankingFilters } from "./ranking-filters-context";
import { SliderDual } from "./slider";
import { StarsForRating } from "./stars-for-rating";
import { Button } from "./ui/button";

/**
 * Temporary slider values while the user is dragging.
 * `sourceFilters` anchors the draft to the committed filter object that
 * existed when the drag started; a sibling filter change replaces that object.
 */
type RatingRangeDraft = {
  min: number;
  max: number;
  sourceFilters: FiltersRankings;
};

function updateArray<T extends string>(arr: T[] | null, entry: T) {
  if (arr === null) {
    return [entry];
  } else {
    if (arr.includes(entry)) {
      const filtered = arr.filter((entryInArr) => entryInArr !== entry);
      // always use null instead of empty array to adhere to search params schema
      return filtered.length === 0 ? null : filtered;
    } else {
      return [...arr, entry];
    }
  }
}

export function RankingsFiltersSkeleton() {
  return <RankingsFiltersClientInternal critics={[]} />;
}

/** Filter UI with search params integration */
export function RankingsFiltersClient({ critics }: { critics: CriticQuery[] }) {
  return <RankingsFiltersClientInternal critics={critics} />;
}

function RankingsFiltersClientInternal({
  critics,
}: {
  critics: CriticQuery[];
}) {
  const { changeFilters, filters, isPending } = useRankingFilters();
  const [ratingRangeDraft, setRatingRangeDraft] =
    useState<RatingRangeDraft | null>(null);
  const currentRatingDraft =
    ratingRangeDraft?.sourceFilters === filters ? ratingRangeDraft : null;
  const ratingMinUncommited =
    currentRatingDraft?.min ?? filters["rating-min"];
  const ratingMaxUncommited =
    currentRatingDraft?.max ?? filters["rating-max"];
  const reviewsMinUncommited = filters["reviews-min"];

  const ratingMinToShow = ratingMinUncommited ?? ratingLowest;
  const ratingMaxToShow = ratingMaxUncommited ?? ratingHighest;

  return (
    <Box variant="lg" className="flex flex-col gap-y-6 p-5 md:gap-y-8 md:p-6">
      <div className="flex items-center gap-2">
        <h2 className="min-w-0 flex-1 text-center text-2xl text-secondary">
          Filter
        </h2>
        <div className="flex w-5 shrink-0 items-center">
          {isPending && <LoadingSpinner className="size-5 fill-tertiary" />}
        </div>
      </div>

      <FilterRow label="Kategorien">
        <div className="col-start-2 row-start-2">
          <CategoriesSelection
            onClick={(category) =>
              changeFilters({
                categories: updateArray(filters.categories, category),
              })
            }
            categoriesSelected={filters.categories}
          />
        </div>
      </FilterRow>

      <FilterRow label="Städte">
        <div className="col-start-2 row-start-2">
          <CitiesSelection
            citiesActive={filters.cities}
            onClick={(city) =>
              changeFilters({
                cities: updateArray(filters.cities, city),
              })
            }
          />
        </div>
      </FilterRow>

      <FilterRow label="Bewertung">
        <div className="flex flex-col items-center justify-start">
          <span className="text-3xl">
            {ratingMinUncommited || ratingMaxUncommited
              ? `${ratingMinToShow} - ${ratingMaxToShow}`
              : "Alle"}
          </span>

          <div className="mt-2">
            <StarsForRating
              rating={ratingMaxUncommited ?? ratingHighest}
              onClick={(ratingClicked) => {
                setRatingRangeDraft(null);
                changeFilters({
                  "rating-min": ratingClicked,
                  "rating-max": ratingHighest,
                });
              }}
            />
          </div>

          <div className="mt-4 w-2/4">
            <SliderDual
              min={ratingLowest}
              max={ratingHighest}
              aria-label="Bewertungsbereich"
              thumbAriaLabels={["Mindestbewertung", "Höchstbewertung"]}
              value={[ratingMinToShow, ratingMaxToShow]}
              step={0.1}
              minStepsBetweenThumbs={0.1}
              onValueChange={(range) => {
                setRatingRangeDraft({
                  min: range[0],
                  max: range[1],
                  sourceFilters: filters,
                });
              }}
              onValueCommit={([min, max]) => {
                setRatingRangeDraft(null);
                changeFilters({
                  "rating-min": min,
                  "rating-max": max,
                });
              }}
            />
          </div>
        </div>
      </FilterRow>

      <FilterRow label="Kritiker">
        <div className="col-start-2 row-start-2 flex flex-wrap gap-2">
          {critics.map((critic) => {
            const isActive =
              filters.critics === null
                ? true
                : filters.critics.includes(critic.name);
            return (
              <button
                aria-pressed={isActive}
                className={cn(
                  "flex h-10 flex-row items-center rounded-full py-1 pr-1 duration-200 select-none hover:bg-tertiary hover:text-tertiary-fg active:scale-110 active:bg-tertiary active:text-tertiary-fg active:transition-transform",
                  isActive ? "bg-secondary text-secondary-fg" : "bg-gray",
                )}
                key={critic.id}
                onClick={() =>
                  changeFilters({
                    critics: updateArray(filters.critics, critic.name),
                  })
                }
                type="button"
              >
                <div className="w-10 p-0">
                  <Image
                    alt="Kritikerbild"
                    className="rounded-full object-cover"
                    height="40"
                    src="/image-placeholder.svg"
                    width="40"
                  />
                </div>

                <span className="pr-2.5 pl-1.5">{critic.name}</span>
              </button>
            );
          })}
        </div>
      </FilterRow>

      <FilterRow label="Mindestanzahl Bewertungen">
        <div className="flex flex-col items-center justify-start">
          <span className="text-3xl">
            {reviewsMinUncommited ? `≥ ${reviewsMinUncommited}` : "Alle"}
          </span>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {[null, 2, 5, 10, 20].map((value) => {
              const isActive = reviewsMinUncommited === value;
              return (
                <FilterButton
                  key={value ?? "all"}
                  isActive={isActive}
                  onClick={() => changeFilters({ "reviews-min": value })}
                >
                  {value === null ? "Alle" : `≥ ${value}`}
                </FilterButton>
              );
            })}
          </div>
        </div>
      </FilterRow>
    </Box>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center">
        <h3 className="text-xl font-medium">{label}</h3>
        <div className="mx-4 flex-1 border-t border-gray"></div>
      </div>

      {children}
    </div>
  );
}

export function RankingsFiltersMobile({
  sectionRef,
  filtersSlot,
}: {
  sectionRef: React.RefObject<HTMLDivElement | null>;
  filtersSlot: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsVisible(entry.isIntersecting);
        }
      },
      { threshold: 0 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [sectionRef]);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          className={cn(
            "fixed right-6 bottom-6 z-40 h-14 gap-2 rounded-full px-5 shadow-lg transition-all duration-300 md:hidden",
            isVisible
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0",
          )}
          size="lg"
        >
          <SlidersHorizontal />
          <p className="text-2xl">Filter</p>
        </Button>
      </DrawerTrigger>

      <DrawerContent className="h-[80vh] px-0">
        <DrawerHeader>
          <DrawerTitle className="sr-only">Filter</DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-8">{filtersSlot}</div>
      </DrawerContent>
    </Drawer>
  );
}
