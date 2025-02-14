import { cn } from "@/lib/utils";

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
        "flex h-32 w-64 min-w-52 cursor-pointer flex-col justify-between rounded-md p-2 transition-colors active:bg-primary active:text-primary-fg",
        isSelected
          ? "bg-primary text-primary-fg"
          : "bg-secondary text-secondary-fg hover:bg-tertiary hover:text-tertiary-fg",
      )}
    >
      {children}
    </div>
  );
}
