import { StarsForRating } from "./stars-for-rating";

export function RatingWithStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center">
      <span className="text-fg">{rating}</span>
      <span className="ml-1">
        <StarsForRating rating={rating} />
      </span>
    </div>
  );
}
