"use client";

import type { FiltersRankings } from "@/app/page";
import { formatCitiesLabel } from "@/lib/cities";
import { t } from "@/lib/i18n";
import { FilterX } from "lucide-react";
import { FilterBadge } from "./badges";
import { useRankingFilters } from "./ranking-filters-context";

type RankingFilterChip = {
  key: keyof FiltersRankings;
  label: string;
};

function formatNaturalList(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return items.join(" & ");

  return `${items.slice(0, -1).join(", ")} & ${items.at(-1)}`;
}

export function getRankingFilterSummaryHeader(filters: FiltersRankings) {
  const queryLabel =
    filters.q ??
    (filters.categories
      ? formatNaturalList(filters.categories.map((category) => t[category]))
      : "Alle Produkte");
  const cityLabel = filters.cities
    ? (formatCitiesLabel(filters.cities) ?? "Alle Städte")
    : "Alle Städte";

  return `${queryLabel} · ${cityLabel}`;
}

export function getRankingFilterChips(
  filters: FiltersRankings,
): RankingFilterChip[] {
  const chips: RankingFilterChip[] = [];

  if (filters.q) {
    chips.push({ key: "q", label: filters.q });
  }

  if (filters.categories) {
    chips.push({
      key: "categories",
      label: filters.categories.map((category) => t[category]).join(", "),
    });
  }

  if (filters.cities) {
    chips.push({
      key: "cities",
      label: filters.cities.join(", "),
    });
  }

  if (filters.critics) {
    chips.push({
      key: "critics",
      label: filters.critics.join(", "),
    });
  }

  if (filters["rating-min"] !== null || filters["rating-max"] !== null) {
    const min = filters["rating-min"] ?? 0;
    const max = filters["rating-max"] ?? 10;
    chips.push({
      key: "rating-min",
      label: `Bewertung ${min}–${max}`,
    });
  }

  if (filters["reviews-min"] !== null) {
    chips.push({
      key: "reviews-min",
      label: `mind. ${filters["reviews-min"]} Bewertungen`,
    });
  }

  return chips;
}

export function RankingFilterSummary() {
  const { changeFilters, clearFilters, filters } = useRankingFilters();
  const chips = getRankingFilterChips(filters);
  const hasFilters = chips.length > 0;

  function removeFilter(key: keyof FiltersRankings) {
    const filtersUpdatedPartial =
      key === "rating-min"
        ? { "rating-min": null, "rating-max": null }
        : { [key]: null };
    changeFilters(filtersUpdatedPartial);
  }

  return (
    <div className="mb-8 border-b border-gray/70 pb-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-1 text-xs font-bold tracking-[0.16em] text-tertiary uppercase">
            Deine aktuelle Auswahl
          </p>
          <h2 className="text-3xl tracking-tight text-secondary md:text-4xl">
            {getRankingFilterSummaryHeader(filters)}
          </h2>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {chips.length === 0 ? (
          <span className="text-sm text-dark-gray">Keine Filter aktiv</span>
        ) : (
          <>
            {hasFilters && (
              <FilterBadge
                icon={<FilterX className="size-4" />}
                onClick={clearFilters}
                variant="clear"
              >
                Löschen
              </FilterBadge>
            )}
            {chips.map((chip) => (
              <FilterBadge
                key={`${chip.key}-${chip.label}`}
                onRemove={() => removeFilter(chip.key)}
                removeLabel={`${chip.label} Filter entfernen`}
              >
                {chip.label}
              </FilterBadge>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
