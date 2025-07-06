import type { ReviewQuery } from "@/data/queries";
import { DateTime } from "./date-time";
import { InfoMessage } from "./info-message";
import { NumberFormatted } from "./number-formatted";
import { ReviewSourceIcon } from "./review-source-icon";
import { StarsForRating } from "./stars-for-rating";

export function ReviewsList({ reviews }: { reviews: ReviewQuery[] }) {
  return (
    <div className="grid gap-2 overflow-x-scroll">
      {reviews.length === 0 ? (
        <InfoMessage>No reviews found</InfoMessage>
      ) : (
        reviews.map((review) => (
          <div
            key={review.id}
            className="col-span-12 grid h-16 cursor-pointer grid-cols-subgrid items-center rounded-md bg-white hover:bg-secondary hover:text-secondary-fg"
          >
            <div>{review.productName}</div>
            <NumberFormatted num={review.rating} min={2} max={2} />
            <StarsForRating rating={review.rating} />
            <div>Current: {review.isCurrent + ""}</div>
            <div>{review.username}</div>
            <div>{review.note}</div>
            <div>{review.placeName}</div>
            <div>{review.city}</div>
            <div>
              {review.urlSource && <ReviewSourceIcon href={review.urlSource} />}
            </div>
            <div>
              Reviewed at{" "}
              {/* TODO remove null check when all reviews have a date */}
              {!review.reviewedAt ? (
                "-"
              ) : (
                <DateTime date={review.reviewedAt} format="YYYY-MM-DD" />
              )}
            </div>
            <div>
              Updated{" "}
              {!review.updatedAt ? (
                "-"
              ) : (
                <DateTime date={review.updatedAt} format="YYYY-MM-DD" />
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
