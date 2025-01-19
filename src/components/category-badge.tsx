import { Category } from "@/data/static";

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span className="rounded-full bg-gray px-3 py-1 text-sm font-medium capitalize text-fg">
      {category}
    </span>
  );
}
