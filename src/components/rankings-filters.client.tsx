"use client";

import { categories, ratingHighest, ratingLowest } from "@/data/static";
import { type FiltersRankings } from "@/lib/schemas";
import { stringifySearchParams } from "@/lib/url-state";
import { cn, isKeyOfObj } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { use, useOptimistic, useState, useTransition } from "react";
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

// TODO Separate RSC instead of `use` here?
export function RankingsFilters({
  filters: filtersFromSearchParams,
}: {
  filters: Promise<FiltersRankings>;
}) {
  const filters = use(filtersFromSearchParams);

  return <FiltersRankingsInternal filters={filters} />;
}

function FiltersRankingsInternal({
  filters: filtersExternal,
}: {
  filters: FiltersRankings;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
        ratingMin: null,
        ratingMax: null,
      });
      router.push("/", { scroll: false });
    });
  }

  return (
    <div className="text-center">
      <h2 className="text-2xl text-secondary">Filters</h2>

      <pre>{JSON.stringify(filters, null, 0)}</pre>

      <pre>pending: {isPending + ""}</pre>

      <div>
        <Button onClick={() => clearFilters()}>Clear all</Button>
      </div>

      <div className="grid grid-cols-2 gap-y-4">
        <div className="col-start-1 row-start-1 text-2xl">Rating</div>
        <div className="col-start-1 row-start-2 flex flex-col items-center justify-start">
          <span className="text-3xl">
            {ratingMinUncommited || ratingMaxUncommited
              ? `${ratingMinToShow} - ${ratingMaxToShow}`
              : "All"}
          </span>

          <div>
            <StarsForRating
              rating={ratingMaxUncommited ?? ratingHighest}
              onClick={(ratingClicked) => {
                setRatingMinUncommited(ratingClicked);
                setRatingMaxUncommited(ratingHighest);
                changeFilters({
                  ratingMin: ratingClicked,
                  ratingMax: ratingHighest,
                });
              }}
            />
          </div>

          <div className="w-3/4">
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

        <div className="col-start-2 row-start-1 text-2xl">Category</div>
        <div className="col-start-2 row-start-2 flex flex-wrap gap-2">
          {categories.map((category) => (
            <FilterRow
              key={category}
              isActive={
                filters.categories === null
                  ? true
                  : filters.categories.includes(category)
              }
              onClick={() =>
                changeFilters({
                  categories: updateArray(filters.categories, category),
                })
              }
            >
              <span className="capitalize">{category}</span>
            </FilterRow>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterRow({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded p-3 hover:bg-primary hover:text-primary-fg active:scale-105 active:bg-tertiary active:text-tertiary-fg active:transition-transform",
        isActive ? "bg-secondary text-secondary-fg" : "bg-gray",
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
