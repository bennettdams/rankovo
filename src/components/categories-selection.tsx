import { categories, type Category } from "@/data/static";
import { FilterButton } from "./filter-button";

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
