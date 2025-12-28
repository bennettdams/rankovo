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
        "rounded-lg border-l-4 border-secondary bg-bg px-4 py-3 text-center text-secondary shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
