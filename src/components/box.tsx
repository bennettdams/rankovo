import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

const baseStyles =
  "bg-white/40 shadow-xs ring-1 ring-white/60 backdrop-blur-xs transition-shadow";

export const boxStyles = {
  sm: cn(baseStyles, "rounded-md p-3 shadow-md hover:shadow-lg"),
  md: cn(baseStyles, "rounded-md p-6 shadow-lg hover:shadow-xl"),
  lg: cn(baseStyles, "rounded-lg p-8 shadow-lg hover:shadow-xl"),
  xl: cn(baseStyles, "rounded-3xl p-8 shadow-lg hover:shadow-xl"),
} as const;

export function Box({
  children,
  variant = "md",
  className,
  ...props
}: ComponentPropsWithoutRef<"div"> & {
  variant?: keyof typeof boxStyles;
}) {
  return (
    <div {...props} className={cn(boxStyles[variant], className)}>
      {children}
    </div>
  );
}
