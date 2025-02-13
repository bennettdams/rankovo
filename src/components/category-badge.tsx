import { Category } from "@/data/static";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
};

export function CategoryBadge({
  category,
  size = "md",
}: {
  category: Category;
  size?: keyof typeof sizes;
}) {
  return (
    <span
      className={cn(
        "text-nowrap rounded-full bg-gray font-medium capitalize text-fg",
        sizes[size],
      )}
    >
      {category}
    </span>
  );
}
