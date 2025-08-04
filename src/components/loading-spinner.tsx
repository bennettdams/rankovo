import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

/**
 * SVG loading spinner based on mySartorius
 */
export const LoadingSpinner = (props: ComponentPropsWithoutRef<"svg">) => (
  <svg
    className={cn("animate-spin fill-secondary", props.className)}
    viewBox="0 0 24 24"
  >
    <path
      d="M15.1066 23.594C14.1157 23.8588 13.0744 24 12 24C5.37258 24 0 18.6274 0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12C24 13.0744 23.8588 14.1157 23.594 15.1066L21.8549 14.6406C22.08 13.7984 22.2 12.9132 22.2 12C22.2 6.3667 17.6333 1.8 12 1.8C6.3667 1.8 1.8 6.3667 1.8 12C1.8 17.6333 6.3667 22.2 12 22.2C12.9132 22.2 13.7984 22.08 14.6406 21.8549L15.1066 23.594Z"
      stroke="none"
    />
  </svg>
);
