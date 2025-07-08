"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  TooltipContent as TooltipContentShadCN,
  TooltipProvider as TooltipProviderShadCN,
  Tooltip as TooltipShadCN,
  TooltipTrigger as TooltipTriggerShadCN,
} from "./ui/tooltip";

/**
 * Custom tooltip with dedicated event handling. This allows opening the tooltip when clicked on mobile.
 * Based on: https://github.com/shadcn-ui/ui/issues/86#issuecomment-2241817826
 */
export function Tooltip({
  content,
  children,
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <TooltipProviderShadCN delayDuration={0}>
      <TooltipShadCN open={open}>
        <TooltipTriggerShadCN asChild>
          <div
            className={cn("cursor-pointer", className)}
            onClick={() => setOpen((prevOpen) => !prevOpen)}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onTouchStart={() => setOpen((prevOpen) => !prevOpen)}
            onKeyDown={(e) => {
              e.preventDefault();
              if (e.key === "Enter") setOpen((prevOpen) => !prevOpen);
            }}
          >
            {children}
          </div>
        </TooltipTriggerShadCN>
        <TooltipContentShadCN className={!content ? "hidden" : undefined}>
          <span className="inline-block">{content}</span>
        </TooltipContentShadCN>
      </TooltipShadCN>
    </TooltipProviderShadCN>
  );
}
