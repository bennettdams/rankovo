"use client";

import { categories } from "@/data/static";
import { type RankingsFilters } from "@/lib/schemas";
import { stringifySearchParams } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { use, useOptimistic, useTransition } from "react";
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
export function FiltersRankings({
  filters: filtersFromSearchParams,
}: {
  filters: Promise<RankingsFilters>;
}) {
  const filters = use(filtersFromSearchParams);

  return <FiltersRankingsInternal filters={filters} />;
}

export function FiltersRankingsInternal({
  filters: filtersExternal,
}: {
  filters: RankingsFilters;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [filters, setOptimisticFilters] = useOptimistic(filtersExternal);

  function updateSearchParams(newFilters: RankingsFilters) {
    const queryString = stringifySearchParams(newFilters);
    router.push(queryString ? `/?${queryString}` : "/", { scroll: false });
  }

  function changeFilters<TFilterKey extends keyof RankingsFilters>(
    filterKey: TFilterKey,
    value: RankingsFilters[TFilterKey],
  ) {
    startTransition(() => {
      const newFilters = { ...filters, [filterKey]: value };
      setOptimisticFilters(newFilters);
      updateSearchParams(newFilters);
    });
  }

  function clearFilters() {
    startTransition(() => {
      setOptimisticFilters({
        categories: null,
        rating: null,
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
        <Button onClick={() => changeFilters("rating", 2)}>Rating 2</Button>
      </div>

      <div>
        <Button onClick={() => clearFilters()}>Clear all</Button>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <FilterRow
            key={category}
            isActive={
              filters.categories === null
                ? true
                : filters.categories.includes(category)
            }
            onClick={() =>
              changeFilters(
                "categories",
                updateArray(filters.categories, category),
              )
            }
          >
            <span className="capitalize">{category}</span>
          </FilterRow>
        ))}
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
        "rounded p-4 hover:bg-primary hover:text-primary-fg active:bg-tertiary active:text-tertiary-fg",
        isActive ? "bg-secondary text-secondary-fg" : "bg-gray",
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
