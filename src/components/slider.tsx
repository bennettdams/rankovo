"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

import { cn } from "@/lib/utils";

export function sliderThumbLabels(
  ariaLabel: string | undefined,
  thumbAriaLabels: readonly [string, string] | undefined,
): [string | undefined, string | undefined] {
  // Radix renders each thumb as its own role="slider" control. A range
  // therefore needs two names; a single label is reused when they are
  // semantically interchangeable.
  return [thumbAriaLabels?.[0] ?? ariaLabel, thumbAriaLabels?.[1] ?? ariaLabel];
}

// Base slider component that can handle both single and dual modes
const SliderBase = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentProps<typeof SliderPrimitive.Root> & {
    thumbCount?: 1 | 2;
    thumbAriaLabels?: readonly [string, string];
  }
>(
  (
    {
      className,
      thumbCount = 1,
      // The root is not the interactive slider control, so apply its label
      // to the thumb(s) below instead of leaving the actual controls unnamed.
      "aria-label": ariaLabel,
      thumbAriaLabels,
      ...props
    },
    ref,
  ) => {
    const [firstThumbLabel, secondThumbLabel] = sliderThumbLabels(
      ariaLabel,
      thumbAriaLabels,
    );

    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none items-center select-none",
          className,
        )}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        {/* Radix gives the thumb role="slider", so the label has to live there. */}
        <SliderPrimitive.Thumb
          aria-label={firstThumbLabel}
          className="block h-5 w-5 rounded-full bg-primary shadow-md ring-offset-tertiary transition-colors focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-1 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        />
        {thumbCount === 2 && (
          <SliderPrimitive.Thumb
            aria-label={secondThumbLabel}
            className="block h-5 w-5 rounded-full bg-primary shadow-md ring-offset-tertiary transition-colors focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-1 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
          />
        )}
      </SliderPrimitive.Root>
    );
  },
);
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
  // Range sliders expose two independent keyboard controls and can give each
  // thumb a more useful name than the shared root label.
  thumbAriaLabels?: readonly [string, string];
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
