"use client";

import type { FiltersRankings } from "@/app/page";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { CriticQuery } from "@/data/queries";
import { ratingHighest, ratingLowest } from "@/data/static";
import { routes } from "@/lib/navigation";
import {
  prepareFiltersForUpdate,
  useSearchParamsHelper,
} from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { FilterX, SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { CategoriesSelection } from "./categories-selection";
import { CitiesSelection } from "./cities-selection";
import { LoadingSpinner } from "./loading-spinner";
import { SliderDual } from "./slider";
import { StarsForRating } from "./stars-for-rating";
import { Button } from "./ui/button";

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
  return (
    <RankingsFiltersClientInternal
      filters={{
        categories: null,
        cities: null,
        critics: null,
        "rating-min": null,
        "rating-max": null,
        q: null,
      }}
      critics={[]}
      updateSearchParams={() => {}}
    />
  );
}

/** Filter UI with search params integration */
export function RankingsFiltersClient({
  filters,
  critics,
}: {
  filters: FiltersRankings;
  critics: CriticQuery[];
}) {
  const { updateSearchParams } = useSearchParamsHelper();

  return (
    <RankingsFiltersClientInternal
      filters={filters}
      critics={critics}
      updateSearchParams={updateSearchParams}
    />
  );
}

function RankingsFiltersClientInternal({
  filters: filtersExternal,
  critics,
  updateSearchParams,
}: {
  filters: FiltersRankings;
  critics: CriticQuery[];
  updateSearchParams: (
    paramsNew: Record<string, unknown>,
    shouldServerUpdate: boolean,
  ) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [filters, setOptimisticFilters] = useOptimistic(filtersExternal);
  const [ratingMinUncommited, setRatingMinUncommited] = useState(
    filtersExternal["rating-min"],
  );
  const [ratingMaxUncommited, setRatingMaxUncommited] = useState(
    filtersExternal["rating-max"],
  );
  const ratingMinToShow = ratingMinUncommited ?? ratingLowest;
  const ratingMaxToShow = ratingMaxUncommited ?? ratingHighest;

  function changeFilters(filtersUpdatedPartial: Partial<FiltersRankings>) {
    const filtersNew = prepareFiltersForUpdate(filtersUpdatedPartial, filters);
    if (filtersNew) {
      startTransition(() => {
        setOptimisticFilters(filtersNew);
        updateSearchParams(filtersNew, true);
      });
    }
  }

  function clearFilters() {
    setRatingMinUncommited(null);
    setRatingMaxUncommited(null);

    startTransition(() => {
      setOptimisticFilters({
        categories: null,
        cities: null,
        critics: null,
        "rating-min": null,
        "rating-max": null,
        q: null,
      });

      router.push(routes.rankings, { scroll: false });
    });
  }

  const hasFilters = Object.values(filters).some(
    (filterEntry) => !!filterEntry,
  );

  return (
    <div className="flex flex-col gap-y-10">
      <div className="grid grid-cols-[minmax(0,1fr),auto,minmax(0,1fr)]">
        <div>
          {hasFilters && (
            <Button
              onMouseDown={() => clearFilters()}
              variant="outline"
              size="sm"
            >
              <FilterX /> <span>Löschen</span>
            </Button>
          )}
        </div>
        <h2 className="w-full text-center text-2xl text-secondary">Filter</h2>
        <div className="flex items-center pl-2">
          {isPending && (
            <LoadingSpinner className="flex size-5 items-center fill-tertiary" />
          )}
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

      <FilterRow label="Kritiker">
        <div className="col-start-2 row-start-2 flex flex-wrap gap-2">
          {critics.map((critic) => {
            const isActive =
              filters.critics === null
                ? true
                : filters.critics.includes(critic.name);
            return (
              <div
                key={critic.id}
                className={cn(
                  "flex h-10 select-none flex-row items-center rounded-full py-1 pr-1 duration-200 hover:bg-tertiary hover:text-tertiary-fg active:scale-110 active:bg-tertiary active:text-tertiary-fg active:transition-transform",
                  isActive ? "bg-secondary text-secondary-fg" : "bg-gray",
                )}
                onMouseDown={() =>
                  changeFilters({
                    critics: updateArray(filters.critics, critic.name),
                  })
                }
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

                <span className="pl-1.5 pr-2.5">{critic.name}</span>
              </div>
            );
          })}
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
              onMouseDown={(ratingClicked) => {
                setRatingMinUncommited(ratingClicked);
                setRatingMaxUncommited(ratingHighest);
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
              value={[ratingMinToShow, ratingMaxToShow]}
              step={0.1}
              minStepsBetweenThumbs={0.1}
              onValueChange={(range) => {
                setRatingMinUncommited(range[0]);
                setRatingMaxUncommited(range[1]);
              }}
              onValueCommit={(range) => {
                setRatingMinUncommited(range[0]);
                setRatingMaxUncommited(range[1]);
                changeFilters({
                  "rating-min": range[0],
                  "rating-max": range[1],
                });
              }}
            />
          </div>
        </div>
      </FilterRow>
    </div>
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
            "fixed bottom-6 right-6 z-40 h-14 gap-2 rounded-full px-5 shadow-lg transition-all duration-300 md:hidden",
            isVisible
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0",
          )}
          size="lg"
        >
          <SlidersHorizontal className="size-6" />
          <span className="text-lg">Filter</span>
        </Button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[85vh] px-0">
        <DrawerHeader>
          <DrawerTitle className="sr-only">Filter</DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-8">{filtersSlot}</div>
      </DrawerContent>
    </Drawer>
  );
}
