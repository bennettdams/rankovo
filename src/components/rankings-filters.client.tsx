"use client";

import { CriticQuery } from "@/data/queries";
import { categories, cities, ratingHighest, ratingLowest } from "@/data/static";
import { type FiltersRankings } from "@/lib/schemas";
import { stringifySearchParams } from "@/lib/url-state";
import { cn, isKeyOfObj } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { startTransition, useOptimistic, useState } from "react";
import { SliderDual } from "./slider-dual";
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

export function RankingsFiltersClient({
  filters: filtersExternal,
  critics,
}: {
  filters: FiltersRankings;
  critics: CriticQuery[];
}) {
  const router = useRouter();

  const [filters, setOptimisticFilters] = useOptimistic(filtersExternal);
  const [ratingMinUncommited, setRatingMinUncommited] = useState(
    filtersExternal.ratingMin,
  );
  const [ratingMaxUncommited, setRatingMaxUncommited] = useState(
    filtersExternal.ratingMax,
  );
  const ratingMinToShow = ratingMinUncommited ?? ratingLowest;
  const ratingMaxToShow = ratingMaxUncommited ?? ratingHighest;

  function updateSearchParams(newFilters: FiltersRankings) {
    const queryString = stringifySearchParams(newFilters);
    router.push(queryString ? `/?${queryString}` : "/", { scroll: false });
  }

  function changeFilters(filtersUpdatedPartial: Partial<FiltersRankings>) {
    // a bit of overhead, but this way we save a network request (as updating search params also reloads the RSC page)
    const hasChanged = Object.keys(filtersUpdatedPartial).some((key) => {
      if (isKeyOfObj(filters, key)) {
        return filters[key] !== filtersUpdatedPartial[key];
      }
    });

    if (hasChanged) {
      startTransition(() => {
        const filtersMerged = { ...filters, ...filtersUpdatedPartial };
        setOptimisticFilters(filtersMerged);
        updateSearchParams(filtersMerged);
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
        ratingMin: null,
        ratingMax: null,
      });

      router.push("/", { scroll: false });
    });
  }

  return (
    <div className="flex flex-col gap-y-10">
      <div>
        <h3>Rating</h3>

        <div className="mt-4 flex flex-col items-center justify-start">
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
                  ratingMin: ratingClicked,
                  ratingMax: ratingHighest,
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
                  ratingMin: range[0],
                  ratingMax: range[1],
                });
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <h3>Categories</h3>

        <div className="col-start-2 row-start-2 mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <FilterButton
              key={category}
              isActive={
                filters.categories === null
                  ? true
                  : filters.categories.includes(category)
              }
              onMouseDown={() =>
                changeFilters({
                  categories: updateArray(filters.categories, category),
                })
              }
            >
              <span className="capitalize">{category}</span>
            </FilterButton>
          ))}
        </div>
      </div>

      <div>
        <h3>Critics</h3>

        <div className="col-start-2 row-start-2 mt-4 flex flex-wrap gap-2">
          {critics.map((critic) => (
            <div
              className="flex h-12 flex-row items-center rounded-full bg-tertiary text-tertiary-fg"
              key={critic.id}
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
          ))}
        </div>
      </div>

      <div>
        <h3>City</h3>

        <div className="col-start-2 row-start-2 mt-4 flex flex-wrap gap-2">
          {cities.map((city) => (
            <FilterButton
              key={city}
              isActive={
                filters.cities === null ? true : filters.cities.includes(city)
              }
              onMouseDown={() =>
                changeFilters({
                  cities: updateArray(filters.cities, city),
                })
              }
            >
              <span className="capitalize">{city}</span>
            </FilterButton>
          ))}
        </div>
      </div>

      <div>
        <Button onMouseDown={() => clearFilters()}>Clear all</Button>
      </div>
    </div>
  );
}

function FilterButton({
  isActive,
  onMouseDown,
  children,
}: {
  isActive: boolean;
  onMouseDown: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "select-none rounded-full px-3 py-1 hover:bg-primary hover:text-primary-fg active:scale-105 active:bg-tertiary active:text-tertiary-fg active:transition-transform",
        isActive ? "bg-secondary text-secondary-fg" : "bg-gray",
      )}
      onMouseDown={onMouseDown}
    >
      {children}
    </div>
  );
}
