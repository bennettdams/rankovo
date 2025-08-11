import { categoriesActive, type Category } from "@/data/static";
import { CategoryIcon } from "./category-icon";
import { FilterButton } from "./filter-button";

export function CategoriesSelection({
  onClick,
  categoriesSelected,
}: {
  onClick: (category: Category) => void;
  categoriesSelected: Category[] | null;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {categoriesActive.map((category) => (
        <FilterButton
          key={category}
          isActive={
            categoriesSelected === null
              ? true
              : categoriesSelected.includes(category)
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
