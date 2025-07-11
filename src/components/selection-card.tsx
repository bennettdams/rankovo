import { cn } from "@/lib/utils";

/**
 * Keeping the height in sync to avoid layout shifts for an empty list without cards.
 */
const heightStyles = "min-h-44";

export function SelectionCard({
  isSelected,
  onClick,
  children,
}: {
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative cursor-pointer overflow-hidden rounded-xl border-[3px] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        heightStyles,
        isSelected
          ? "ring-primary/20 border-primary bg-primary text-primary-fg shadow-lg ring-2"
          : "hover:border-primary/30 hover:bg-primary/5 border-light-gray bg-white text-fg",
      )}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute right-3 top-3">
          <div className="flex size-6 items-center justify-center rounded-full bg-white/60 backdrop-blur-sm">
            <svg
              className="size-4 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}

      <div className="flex h-full flex-col justify-between">{children}</div>
    </div>
  );
}

export function SelectionCardList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(className, heightStyles)}>{children}</div>;
}
