import { cn } from "@/lib/utils";

const boxStyles = {
  sm: "rounded-md p-3 shadow-md",
  md: "rounded-md p-6 shadow-lg",
  lg: "rounded-lg p-8 shadow-lg",
} as const;

export function Box({
  children,
  variant = "md",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof boxStyles;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border border-white/30 bg-bg shadow-black/5",
        boxStyles[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
