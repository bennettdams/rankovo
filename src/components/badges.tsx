import type { Category } from "@/data/static";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { CategoryIcon } from "./category-icon";

const categoryBadgeSizes = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
} as const;

const filterBadgeStyles = {
  active:
    "inline-flex items-center gap-1.5 rounded-full border border-primary/50 bg-primary/10 px-3 py-1.5 text-sm font-medium text-fg transition-colors hover:bg-primary/20",
  clear:
    "inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary/20 px-3 py-1.5 text-sm font-semibold text-fg transition-colors hover:bg-primary/30",
} as const;

type FilterBadgeVariant = keyof typeof filterBadgeStyles;

export function CategoryBadge({
  category,
  size = "md",
}: {
  category: Category;
  size?: keyof typeof categoryBadgeSizes;
}) {
  return (
    <div
      className={cn(
        "inline-flex flex-row items-center rounded-full bg-gray font-medium text-nowrap text-fg capitalize",
        categoryBadgeSizes[size],
      )}
    >
      <CategoryIcon category={category} size="sm" />
      <span className="pl-1">{t[category]}</span>
    </div>
  );
}

export function FilterBadge({
  children,
  icon,
  onClick,
  onRemove,
  removeLabel,
  variant = "active",
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
  variant?: FilterBadgeVariant;
}) {
  if (variant === "clear") {
    return (
      <button
        className={filterBadgeStyles[variant]}
        onClick={onClick}
        type="button"
      >
        {icon}
        {children}
      </button>
    );
  }

  return (
    <span className={filterBadgeStyles[variant]}>
      {children}
      <button
        aria-label={removeLabel}
        className="grid size-5 place-items-center rounded-full transition-colors hover:bg-primary/20"
        onClick={onRemove}
        type="button"
      >
        <X className="size-3.5" />
      </button>
    </span>
  );
}
