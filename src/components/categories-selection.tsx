import { categories, type Category } from "@/data/static";
import { CategoryIcon } from "./category-icon";
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
          <CategoryIcon category={category} size="sm" />
          <span className="ml-1 capitalize">{category}</span>
        </FilterButton>
      ))}
    </div>
  );
}
