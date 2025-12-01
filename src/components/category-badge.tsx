import { Category } from "@/data/static";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./category-icon";

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
    <div
      className={cn(
        "inline-flex flex-row items-center text-nowrap rounded-full bg-gray font-medium capitalize text-fg",
        sizes[size],
      )}
    >
      <CategoryIcon category={category} size="sm" />
      <span className="pl-1">{t[category]}</span>
    </div>
  );
}
