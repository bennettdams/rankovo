import type { FiltersRankings } from "@/app/page";
import { minCharsSearch } from "@/data/static";
import { SearchIcon, XIcon } from "lucide-react";
import { FieldError } from "./form";
import { LoadingSpinner } from "./loading-spinner";
import { RankingsSearchClient } from "./rankings-search.client";
import { Input } from "./ui/input";

export async function RankingSearch({
  filters: filtersPromise,
}: {
  filters: Promise<FiltersRankings>;
}) {
  const filters = await filtersPromise;

  return <RankingsSearchClient searchQuery={filters.q} />;
}

// Interactive version - all handlers required
interface RankingsSearchInteractiveProps {
  mode: "interactive";
  searchQuery: string | null;
  onSearchChange: (value: string) => void;
  onResetSearch: () => void;
  isLoading?: boolean;
}

// Static version - no handlers needed
interface RankingsSearchStaticProps {
  mode: "static";
}

type RankingsSearchBaseProps =
  | RankingsSearchInteractiveProps
  | RankingsSearchStaticProps;

export function RankingsSearchBase(props: RankingsSearchBaseProps) {
  // Compute all configuration based on mode
  const config =
    props.mode === "static"
      ? {
          searchQuery: null,
          isLoading: false,
          disabled: true,
          handleChange: undefined,
          handleKeyDown: undefined,
          handleReset: undefined,
        }
      : {
          searchQuery: props.searchQuery,
          isLoading: props.isLoading ?? false,
          disabled: false,
          handleChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            props.onSearchChange(e.target.value);
          },
          handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Escape") props.onResetSearch();
          },
          handleReset: props.onResetSearch,
        };

  return (
    <div className="mx-auto w-full md:w-2/3">
      <div className="relative">
        <Input
          name="filter-search"
          type="text"
          className="h-14 rounded-xl border-none bg-white text-center text-lg leading-none shadow-sm placeholder:text-center focus:placeholder:text-white focus-visible:ring-primary md:text-2xl md:placeholder:text-2xl"
          placeholder='z.B. "Döner in Hamburg"'
          value={config.searchQuery ?? ""}
          onChange={config.handleChange}
          onKeyDown={config.handleKeyDown}
          disabled={config.disabled}
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 transform">
          {config.isLoading ? (
            <LoadingSpinner className="size-7" />
          ) : config.searchQuery ? (
            <XIcon
              className="size-8 cursor-pointer stroke-primary"
              onClick={config.handleReset}
            />
          ) : (
            <SearchIcon className="size-8 stroke-primary" />
          )}
        </div>
      </div>

      {!!config.searchQuery && config.searchQuery.length < minCharsSearch ? (
        <FieldError
          className="mt-1.5"
          errorMsg={`Mindestens ${minCharsSearch} Zeichen`}
        />
      ) : (
        <p className="mt-1.5">
          Suche nach Produktname, Restaurantname oder Kategorie
        </p>
      )}
    </div>
  );
}

export function RankingsSearchShell() {
  return <RankingsSearchBase mode="static" />;
}
