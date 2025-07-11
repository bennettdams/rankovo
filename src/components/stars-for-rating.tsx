"use client";

import { cn } from "@/lib/utils";
import { Star, StarHalf } from "lucide-react";

const halfStarLowerBound = 0.25;
const halfStarUpperBound = 0.75;
const fullStarLowerBound = 1;

const starSizes = {
  small: "h-4 w-4",
  medium: "h-6 w-6",
  large: "h-8 w-8",
};
type StarSize = keyof typeof starSizes;

const starStyles = "fill-gray text-gray drop-shadow-sm";

const hoverableStyles =
  "active:scale-125 active:transition-transform peer peer-hover:fill-secondary hover:fill-secondary peer-hover:text-secondary hover:text-secondary";

function StarForRating({
  rating,
  position,
  size = "medium",
  onMouseDown,
}: {
  rating: number;
  position: 1 | 2 | 3 | 4 | 5;
  size?: StarSize;
  onMouseDown?: () => void;
}) {
  const lowerBoundCalculated =
    fullStarLowerBound * position + halfStarLowerBound - 1;
  const upperBoundCalculated =
    fullStarLowerBound * position + halfStarUpperBound - 1;
  const isHalfStarActive =
    rating >= lowerBoundCalculated && rating <= upperBoundCalculated;

  const isFullStarActive =
    !isHalfStarActive &&
    rating >= fullStarLowerBound * position - halfStarUpperBound;

  const starSize = starSizes[size];

  return (
    <>
      <Star
        onMouseDown={onMouseDown}
        className={cn(
          starStyles,
          starSize,
          "relative z-0",
          isFullStarActive && "fill-primary text-primary",
          !!onMouseDown && hoverableStyles,
        )}
      >
        {(isHalfStarActive ||
          // Exception: Show half star for first position if the rating is really low
          (position === 1 && rating < halfStarLowerBound)) && (
          <StarHalf
            onMouseDown={onMouseDown}
            className={cn(
              starStyles,
              starSize,
              "absolute inset-0 z-10 fill-primary text-primary",
              // hide for hover as half stars are not clickable
              !!onMouseDown &&
                "group-hover/stars:fill-transparent group-hover/stars:text-transparent",
            )}
          />
        )}
      </Star>
    </>
  );
}

export function StarsForRating({
  rating,
  size,
  onMouseDown,
}: {
  rating: number;
  size?: StarSize;
  onMouseDown?: (ratingClicked: number) => void;
}) {
  // Scale rating from 0-10 to 0-5 for display
  const scaledRating = rating / 2;

  function handleClick(starPosition: number) {
    // When clicked, return the full 0-10 scale rating (starPosition * 2)
    return !onMouseDown ? undefined : () => onMouseDown(starPosition * 2);
  }

  return (
    <div
      // reverse order for CSS peer selectors (hover) to work from left to right
      className="group/stars flex flex-row-reverse justify-center space-x-0.5"
      title={`Rating: ${rating}`}
    >
      <StarForRating
        onMouseDown={handleClick(5)}
        position={5}
        rating={scaledRating}
        size={size}
      />
      <StarForRating
        onMouseDown={handleClick(4)}
        position={4}
        rating={scaledRating}
        size={size}
      />
      <StarForRating
        onMouseDown={handleClick(3)}
        position={3}
        rating={scaledRating}
        size={size}
      />
      <StarForRating
        onMouseDown={handleClick(2)}
        position={2}
        rating={scaledRating}
        size={size}
      />
      <StarForRating
        onMouseDown={handleClick(1)}
        position={1}
        rating={scaledRating}
        size={size}
      />
    </div>
  );
}
