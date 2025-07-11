import { cn } from "@/lib/utils";

export function InfoMessage({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-secondary px-4 py-3 text-center text-secondary",
        className,
      )}
    >
      {children}
    </div>
  );
}
