"use client";
import { cn } from "@/lib/utils";
import { Star, StarHalf } from "lucide-react";

const halfStarLowerBound = 0.25;
const halfStarUpperBound = 0.75;
const fullStarLowerBound = 1;

const starStyles = "h-6 w-6 fill-gray text-gray";

const hoverableStyles =
  "active:scale-125 active:transition-transform peer peer-hover:fill-secondary hover:fill-secondary peer-hover:text-secondary hover:text-secondary";

function StarForRating({
  rating,
  position,
  onClick,
}: {
  rating: number;
  position: 1 | 2 | 3 | 4 | 5;
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

  return (
    <>
      <Star
        onClick={onClick}
        className={cn(
          starStyles,
          !!onClick && hoverableStyles,
          "relative z-0",
          isFullStarActive && "fill-primary text-primary",
        )}
      >
        {(isHalfStarActive ||
          // Exception: Show half star for first position if the rating is really low
          (position === 1 && rating < halfStarLowerBound)) && (
          <StarHalf
            className={cn(
              starStyles,
              !!onClick && hoverableStyles,
              "absolute inset-0 z-10 fill-primary text-primary",
            )}
          />
        )}
      </Star>
    </>
  );
}

export function StarsForRating({
  rating,
  onClick,
}: {
  rating: number;
  onClick?: (ratingClicked: number) => void;
}) {
  function handleClick(rating: number) {
    return !onClick ? undefined : () => onClick(rating);
  }

  return (
    <div
      // reverse order for CSS peer selectors (hover) to work from left to right
      className="flex flex-row-reverse justify-center space-x-0.5"
      title={`Rating: ${rating}`}
    >
      <StarForRating onClick={handleClick(5)} position={5} rating={rating} />
      <StarForRating onClick={handleClick(4)} position={4} rating={rating} />
      <StarForRating onClick={handleClick(3)} position={3} rating={rating} />
      <StarForRating onClick={handleClick(2)} position={2} rating={rating} />
      <StarForRating onClick={handleClick(1)} position={1} rating={rating} />
    </div>
  );
}
