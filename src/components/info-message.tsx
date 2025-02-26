import { cn } from "@/lib/utils";

export function InfoMessage({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <span className={cn("italic", className)}>{children}</span>;
}
