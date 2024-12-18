import { cn } from "@/lib/utils";
import { Star, StarHalf } from "lucide-react";

const halfStarLowerBound = 0.25;
const halfStarUpperBound = 0.75;
const fullStarLowerBound = 1;

const starStyles = "h-4 w-4 fill-current text-gray";

function StarForRating({
  rating,
  position,
}: {
  rating: number;
  position: 1 | 2 | 3 | 4 | 5;
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
        className={cn(
          starStyles,
          "relative z-0",
          isFullStarActive && "text-primary",
        )}
      >
        {(isHalfStarActive ||
          // Exception: Show half star for first position if the rating is really low
          (position === 1 && rating < halfStarLowerBound)) && (
          <StarHalf
            className={cn(starStyles, "absolute inset-0 z-10 text-primary")}
          />
        )}
      </Star>
    </>
  );
}

export function StarsForRating({ rating }: { rating: number }) {
  return (
    <div
      className="flex justify-center space-x-0.5"
      title={`Rating: ${rating}`}
    >
      <StarForRating position={1} rating={rating} />
      <StarForRating position={2} rating={rating} />
      <StarForRating position={3} rating={rating} />
      <StarForRating position={4} rating={rating} />
      <StarForRating position={5} rating={rating} />
    </div>
  );
}
