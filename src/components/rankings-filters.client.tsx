"use client";

import type { FiltersRankings } from "@/app/page";
import { CriticQuery } from "@/data/queries";
import { minCharsSearch, ratingHighest, ratingLowest } from "@/data/static";
import { routes } from "@/lib/navigation";
import {
  prepareFiltersForUpdate,
  useSearchParamsHelper,
} from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { FilterX } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { startTransition, useOptimistic, useState } from "react";
import { CategoriesSelection } from "./categories-selection";
import { CitiesSelection } from "./cities-selection";
import { FieldError } from "./form";
import { SliderDual } from "./slider";
import { StarsForRating } from "./stars-for-rating";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

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
        productName: null,
        placeName: null,
        ratingMin: null,
        ratingMax: null,
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

  const [filters, setOptimisticFilters] = useOptimistic(filtersExternal);
  const [ratingMinUncommited, setRatingMinUncommited] = useState(
    filtersExternal.ratingMin,
  );
  const [ratingMaxUncommited, setRatingMaxUncommited] = useState(
    filtersExternal.ratingMax,
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
        ratingMin: null,
        ratingMax: null,
        productName: null,
        placeName: null,
      });

      router.push(routes.rankings, { scroll: false });
    });
  }

  const hasFilters = Object.values(filters).some(
    (filterEntry) => !!filterEntry,
  );

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
        <div className="col-start-2 row-start-2">
          <CategoriesSelection
            onClick={(category) =>
              changeFilters({
                categories: updateArray(filters.categories, category),
              })
            }
            categoriesActive={filters.categories}
          />
        </div>
      </FilterRow>

      <FilterRow label="Product name">
        <Input
          name="filter-product-name"
          type="text"
          placeholder="e.g. Cheeseburger"
          value={filters.productName ?? ""}
          onChange={(e) => changeFilters({ productName: e.target.value })}
        />
        <FieldError
          errorMsg={
            !!filters.productName && filters.productName.length < minCharsSearch
              ? `At least ${minCharsSearch} characters`
              : undefined
          }
        />
      </FilterRow>

      <FilterRow label="Place name">
        <Input
          name="filter-place-name"
          type="text"
          placeholder="e.g. Five Guys"
          value={filters.placeName ?? ""}
          onChange={(e) => changeFilters({ placeName: e.target.value })}
        />
        <FieldError
          errorMsg={
            !!filters.placeName && filters.placeName.length < minCharsSearch
              ? `At least ${minCharsSearch} characters`
              : undefined
          }
        />
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
