"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

import { cn } from "@/lib/utils";

// Base slider component that can handle both single and dual modes
const SliderBase = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentProps<typeof SliderPrimitive.Root> & {
    thumbCount?: 1 | 2;
  }
>(({ className, thumbCount = 1, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="focus-visible:ring-ring block h-5 w-5 rounded-full bg-primary shadow-md ring-offset-tertiary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50" />
    {thumbCount === 2 && (
      <SliderPrimitive.Thumb className="focus-visible:ring-ring block h-5 w-5 rounded-full bg-primary shadow-md ring-offset-tertiary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50" />
    )}
  </SliderPrimitive.Root>
));
SliderBase.displayName = "SliderBase";

// Single value slider
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentProps<typeof SliderPrimitive.Root>
>(({ ...props }, ref) => <SliderBase ref={ref} thumbCount={1} {...props} />);
Slider.displayName = SliderPrimitive.Root.displayName;

// Dual value slider with type-safe callbacks
type SliderDualProps = Omit<
  React.ComponentProps<typeof SliderPrimitive.Root>,
  "onValueChange" | "onValueCommit"
> & {
  onValueChange?: (value: [number, number]) => void;
  onValueCommit?: (value: [number, number]) => void;
};

const SliderDual = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderDualProps
>(({ onValueChange, onValueCommit, ...props }, ref) => (
  <SliderBase
    ref={ref}
    thumbCount={2}
    {...props}
    onValueChange={
      onValueChange
        ? (value) => {
            if (value[0] === undefined || value[1] === undefined)
              throw new Error(
                `Invalid value ${value[0] + ""} or ${value[1] + ""}`,
              );
            onValueChange([value[0], value[1]]);
          }
        : undefined
    }
    onValueCommit={
      onValueCommit
        ? (value) => {
            if (value[0] === undefined || value[1] === undefined)
              throw new Error(
                `Invalid value ${value[0] + ""} or ${value[1] + ""}`,
              );
            onValueCommit([value[0], value[1]]);
          }
        : undefined
    }
  />
));
SliderDual.displayName = "SliderDual";

export { Slider, SliderDual };
