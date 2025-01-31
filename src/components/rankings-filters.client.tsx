"use client";

import type { FiltersRankings } from "@/app/page";
import { CriticQuery } from "@/data/queries";
import { categories, cities, ratingHighest, ratingLowest } from "@/data/static";
import {
  prepareFiltersForUpdate,
  stringifySearchParams,
} from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { FilterX } from "lucide-react";
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
    const filtersNew = prepareFiltersForUpdate(filtersUpdatedPartial, filters);
    if (filtersNew) {
      startTransition(() => {
        setOptimisticFilters(filtersNew);
        updateSearchParams(filtersNew);
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
        ratingMin: null,
        ratingMax: null,
      });

      router.push("/", { scroll: false });
    });
  }

  const hasFilters = Object.values(filters).some((x) => x !== null);

  return (
    <div className="flex flex-col gap-y-10">
      <div className="relative">
        <h2 className="text-center text-2xl text-secondary">Filters</h2>
        {hasFilters && (
          <Button
            onMouseDown={() => clearFilters()}
            variant="outline"
            size="sm"
            className="absolute left-0 top-0 flex items-center"
          >
            <FilterX /> <span>Clear</span>
          </Button>
        )}
      </div>

      <FilterRow label="Categories">
        <div className="col-start-2 row-start-2 flex flex-wrap gap-2">
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

      <FilterRow label="Critics">
        <div className="col-start-2 row-start-2 flex flex-wrap gap-2">
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
      </FilterRow>
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
        "select-none rounded-full px-3 py-1 duration-200 hover:bg-tertiary hover:text-tertiary-fg active:scale-110 active:bg-tertiary active:text-tertiary-fg active:transition-transform",
        isActive ? "bg-secondary text-secondary-fg" : "bg-gray",
      )}
      onMouseDown={onMouseDown}
    >
      {children}
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
