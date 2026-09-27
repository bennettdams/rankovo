"use client";

import { NumberFormatted } from "@/components/number-formatted";
import { Slider } from "@/components/slider";
import { ratingHighest, ratingLowest } from "@/data/static";
import { isRatingInRange } from "@/lib/business-utils";
import { cn } from "@/lib/utils";

const sizes = {
  large: { number: "h-20 text-6xl", placeholder: "text-2xl" },
  medium: { number: "h-14 text-5xl", placeholder: "text-xl" },
};

export function ratingAfterPointerDown(value: number | null): number {
  return value ?? ratingLowest;
}

export function RatingInput({
  value,
  onChange,
  size = "large",
  ariaLabel = "Bewertung von 0 bis 10",
}: {
  value: number | null;
  onChange: (rating: number) => void;
  size?: keyof typeof sizes;
  ariaLabel?: string;
}) {
  const hasRating = isRatingInRange(value);

  return (
    <div className="flex flex-col items-center gap-3">
      <p
        className={cn(
          "flex items-end justify-center font-semibold tabular-nums",
          sizes[size].number,
          !hasRating && ["text-dark-gray", sizes[size].placeholder],
        )}
      >
        {hasRating ? (
          <NumberFormatted num={value} min={1} max={1} />
        ) : (
          <span>—</span>
        )}
      </p>

      <div className="w-full max-w-md">
        <Slider
          min={ratingLowest}
          max={ratingHighest}
          step={0.1}
          value={hasRating ? [value] : [0]}
          onValueChange={(values) => {
            const ratingNew = values[0];
            if (ratingNew !== undefined) onChange(ratingNew);
          }}
          onPointerDown={() => onChange(ratingAfterPointerDown(value))}
          aria-label={ariaLabel}
        />
        <div className="mt-2 flex justify-between text-sm text-dark-gray">
          <span>0</span>
          <span>10</span>
        </div>
      </div>
    </div>
  );
}
