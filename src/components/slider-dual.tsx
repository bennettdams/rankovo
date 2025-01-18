// REFERENCE: https://github.com/shadcn-ui/ui/issues/871#issuecomment-1625673445
"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

import { cn } from "@/lib/utils";

type SliderDualProps = Omit<
  React.ComponentProps<typeof SliderPrimitive.Root>,
  "onValueChange" | "onValueCommit"
> & {
  onValueChange: (value: [number, number]) => void;
  onValueCommit: (value: [number, number]) => void;
};

const SliderDual = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderDualProps
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className,
    )}
    {...props}
    onValueChange={(value) => {
      if (value[0] === undefined || value[1] === undefined)
        throw new Error(` Invalid value ${value[0] + ""} or ${value[1] + ""}`);
      props.onValueChange([value[0], value[1]]);
    }}
    onValueCommit={(value) => {
      if (value[0] === undefined || value[1] === undefined)
        throw new Error(` Invalid value ${value[0] + ""} or ${value[1] + ""}`);
      props.onValueCommit([value[0], value[1]]);
    }}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="focus-visible:ring-ring block h-5 w-5 rounded-full bg-primary shadow-md ring-offset-tertiary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50" />
    <SliderPrimitive.Thumb className="focus-visible:ring-ring block h-5 w-5 rounded-full bg-primary shadow-md ring-offset-tertiary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
));
SliderDual.displayName = SliderPrimitive.Root.displayName;

export { SliderDual };
