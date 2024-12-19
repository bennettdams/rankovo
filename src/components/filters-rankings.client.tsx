import { categories } from "@/data/static";
import { schemaCategory, schemaSearchParam } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { z } from "zod";

export const schemaFiltersRankings = z.object({
  categories: schemaSearchParam(schemaCategory),
});

export type FiltersRankings = z.output<typeof schemaFiltersRankings>;

export function FiltersRankings({ filters }: { filters: FiltersRankings }) {
  return (
    <div className="text-center">
      <h2 className="text-2xl text-secondary">Filters</h2>

      <pre>{JSON.stringify(filters, null, 2)}</pre>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <FilterRow
            key={category}
            isActive={
              filters.categories === null
                ? true
                : filters.categories.includes(category)
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
  children,
}: {
  isActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded p-4",
        isActive ? "bg-secondary text-secondary-fg" : "bg-gray",
      )}
    >
      {children}
    </div>
  );
}
