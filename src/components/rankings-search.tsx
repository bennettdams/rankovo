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
    <div className="w-full">
      <div className="relative">
        <Input
          name="filter-search"
          type="text"
          className="h-14 rounded-2xl border-none bg-white/80 text-center text-lg leading-none shadow-lg ring-1 ring-black/5 backdrop-blur-sm transition-all placeholder:text-center focus:bg-white focus:placeholder:text-transparent focus-visible:ring-2 focus-visible:ring-primary md:h-16 md:text-xl md:placeholder:text-xl"
          placeholder='z.B. "Döner in Hamburg"'
          value={config.searchQuery ?? ""}
          onChange={config.handleChange}
          onKeyDown={config.handleKeyDown}
          disabled={config.disabled}
        />
        <div className="absolute left-5 top-1/2 -translate-y-1/2 transform text-primary">
          {config.isLoading ? (
            <LoadingSpinner className="size-6" />
          ) : config.searchQuery ? (
            <XIcon
              className="size-6 cursor-pointer transition-transform hover:scale-110 active:scale-95"
              onClick={config.handleReset}
            />
          ) : (
            <SearchIcon className="size-6" />
          )}
        </div>
      </div>

      <div className="mt-3 text-center text-sm font-medium">
        {!!config.searchQuery && config.searchQuery.length < minCharsSearch ? (
          <FieldError
            className="inline-block"
            errorMsg={`Mindestens ${minCharsSearch} Zeichen`}
          />
        ) : (
          <p>Suche nach Produktname, Restaurantname oder Kategorie</p>
        )}
      </div>
    </div>
  );
}

export function RankingsSearchShell() {
  return <RankingsSearchBase mode="static" />;
}
