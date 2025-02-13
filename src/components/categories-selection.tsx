import { categories, type Category } from "@/data/static";
import { cn } from "@/lib/utils";
import { FilterButton, filterButtonStyles } from "./filter-button";

export function CategoriesSelection({
  onClick,
  categoriesActive,
}: {
  onClick: (category: Category) => void;
  categoriesActive: Category[] | null;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <FilterButton
          key={category}
          isActive={
            categoriesActive === null
              ? true
              : categoriesActive.includes(category)
          }
          onMouseDown={() => onClick(category)}
        >
          <span className="capitalize">{category}</span>
        </FilterButton>
      ))}
    </div>
  );
}

export function CategoriesSelectionFormField({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <label key={category}>
          <input
            type="radio"
            name={name}
            value={category}
            defaultChecked={defaultValue === category}
            className="peer hidden"
          />
          <div
            className={cn(
              filterButtonStyles.default,
              filterButtonStyles.activeViaPeer,
            )}
          >
            <span className="capitalize">{category}</span>
          </div>
        </label>
      ))}
    </div>
  );
}
