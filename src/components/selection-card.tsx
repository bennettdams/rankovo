import { cn } from "@/lib/utils";

/**
 * Keeping the height in sync to avoid layout shifts for an empty list without cards.
 */
const heightStyles = "h-32";

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
        "flex w-64 min-w-52 cursor-pointer flex-col justify-between rounded-md p-2 transition-colors active:bg-primary active:text-primary-fg",
        heightStyles,
        isSelected
          ? "bg-primary text-primary-fg"
          : "bg-secondary text-secondary-fg hover:bg-tertiary hover:text-tertiary-fg",
      )}
    >
      {children}
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
