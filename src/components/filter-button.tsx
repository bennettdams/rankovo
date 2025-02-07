import { cn } from "@/lib/utils";

export function FilterButton({
  isActive,
  onMouseDown,
  children,
}: {
  isActive: boolean;
  onMouseDown: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "select-none rounded-full px-3 py-1 duration-200 hover:bg-tertiary hover:text-tertiary-fg active:scale-110 active:bg-tertiary active:text-tertiary-fg active:transition-transform",
        isActive ? "bg-secondary text-secondary-fg" : "bg-gray",
      )}
      onMouseDown={onMouseDown}
    >
      {children}
    </div>
  );
}
