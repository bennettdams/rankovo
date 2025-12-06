import { cn } from "@/lib/utils";

const boxStyles = {
  sm: "rounded-md p-3 shadow-md hover:shadow-lg",
  md: "rounded-md p-6 shadow-lg hover:shadow-xl",
  lg: "rounded-lg p-8 shadow-lg hover:shadow-xl",
  xl: "rounded-3xl p-8 shadow-lg hover:shadow-xl",
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
        "bg-white/60 shadow-black/10 backdrop-blur-sm transition-shadow",
        boxStyles[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
