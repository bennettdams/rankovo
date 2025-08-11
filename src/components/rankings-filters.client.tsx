"use client";

import type { FiltersRankings } from "@/app/page";
import { CriticQuery } from "@/data/queries";
import { ratingHighest, ratingLowest } from "@/data/static";
import { routes } from "@/lib/navigation";
import {
  prepareFiltersForUpdate,
  useSearchParamsHelper,
} from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { FilterX } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
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
              <FilterX /> <span>Clear</span>
            </Button>
          )}
        </div>
        <h2 className="w-full text-center text-2xl text-secondary">Filters</h2>
        <div className="flex items-center pl-2">
          {isPending && (
            <LoadingSpinner className="flex size-5 items-center fill-tertiary" />
          )}
        </div>
      </div>

      <FilterRow label="Categories">
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

      <FilterRow label="Critics">
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
                  "flex h-12 select-none flex-row items-center rounded-full py-1 pr-1 duration-200 hover:bg-tertiary hover:text-tertiary-fg active:scale-110 active:bg-tertiary active:text-tertiary-fg active:transition-transform",
                  isActive ? "bg-secondary text-secondary-fg" : "bg-gray",
                )}
                onMouseDown={() =>
                  changeFilters({
                    critics: updateArray(filters.critics, critic.name),
                  })
                }
              >
                <div className="w-12 p-0">
                  <Image
                    alt="Critic image"
                    className="rounded-full object-cover"
                    height="48"
                    src="/image-placeholder.svg"
                    width="48"
                  />
                </div>

                <span className="pl-1.5 pr-2.5">{critic.name}</span>
              </div>
            );
          })}
        </div>
      </FilterRow>

      <FilterRow label="Cities">
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

      <FilterRow label="Rating">
        <div className="flex flex-col items-center justify-start">
          <span className="text-3xl">
            {ratingMinUncommited || ratingMaxUncommited
              ? `${ratingMinToShow} - ${ratingMaxToShow}`
              : "All"}
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
        <div className="border-gray-400 mx-4 flex-1 border-t border-gray"></div>
      </div>

      {children}
    </div>
  );
}
