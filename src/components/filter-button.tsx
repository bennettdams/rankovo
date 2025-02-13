import { cn } from "@/lib/utils";

export const filterButtonStyles = {
  default:
    "bg-gray select-none rounded-full px-3 py-1 duration-200 hover:bg-tertiary hover:text-tertiary-fg active:scale-110 active:bg-tertiary active:text-tertiary-fg active:transition-transform",
  active: "bg-secondary text-secondary-fg",
  activeViaPeer: "peer-checked:bg-secondary peer-checked:text-secondary-fg",
};

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
        filterButtonStyles.default,
        isActive && filterButtonStyles.active,
      )}
      onMouseDown={onMouseDown}
    >
      {children}
    </div>
  );
}
