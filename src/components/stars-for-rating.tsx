"use client";
import { cn } from "@/lib/utils";
import { Star, StarHalf } from "lucide-react";

const halfStarLowerBound = 0.25;
const halfStarUpperBound = 0.75;
const fullStarLowerBound = 1;

const starStyles = "fill-gray text-gray";

const hoverableStyles =
  "active:scale-125 active:transition-transform peer peer-hover:fill-secondary hover:fill-secondary peer-hover:text-secondary hover:text-secondary";

function StarForRating({
  rating,
  position,
  size,
  onClick,
}: {
  rating: number;
  position: 1 | 2 | 3 | 4 | 5;
  size?: "small" | "medium";
  onClick?: () => void;
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

  const starSize = size === "small" ? "h-4 w-4" : "h-6 w-6";

  return (
    <>
      <Star
        onClick={onClick}
        className={cn(
          starStyles,
          starSize,
          "relative z-0",
          isFullStarActive && "fill-primary text-primary",
          !!onClick && hoverableStyles,
        )}
      >
        {(isHalfStarActive ||
          // Exception: Show half star for first position if the rating is really low
          (position === 1 && rating < halfStarLowerBound)) && (
          <StarHalf
            onClick={onClick}
            className={cn(
              starStyles,
              starSize,
              "absolute inset-0 z-10 fill-primary text-primary",
              // hide for hover as half stars are not clickable
              !!onClick &&
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
  onClick,
}: {
  rating: number;
  size?: "small" | "medium";
  onClick?: (ratingClicked: number) => void;
}) {
  function handleClick(rating: number) {
    return !onClick ? undefined : () => onClick(rating);
  }

  return (
    <div
      // reverse order for CSS peer selectors (hover) to work from left to right
      className="group/stars flex flex-row-reverse justify-center space-x-0.5"
      title={`Rating: ${rating}`}
    >
      <StarForRating
        onClick={handleClick(5)}
        position={5}
        rating={rating}
        size={size}
      />
      <StarForRating
        onClick={handleClick(4)}
        position={4}
        rating={rating}
        size={size}
      />
      <StarForRating
        onClick={handleClick(3)}
        position={3}
        rating={rating}
        size={size}
      />
      <StarForRating
        onClick={handleClick(2)}
        position={2}
        rating={rating}
        size={size}
      />
      <StarForRating
        onClick={handleClick(1)}
        position={1}
        rating={rating}
        size={size}
      />
    </div>
  );
}
