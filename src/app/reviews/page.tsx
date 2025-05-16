import { DateTime } from "@/components/date-time";
import { NumberFormatted } from "@/components/number-formatted";
import { ReviewSourceIcon } from "@/components/review-source-icon";
import { StarsForRating } from "@/components/stars-for-rating";
import { queries } from "@/data/queries";
import { Suspense } from "react";
import { ReviewListItem } from "./review-list-item.client";

export default async function PageReviews() {
  return (
    <div className="pt-8 md:pt-12">
      <Suspense fallback={<div>Loading reviews...</div>}>
        <ReviewsList />
      </Suspense>
    </div>
  );
}

async function ReviewsList() {
  const reviews = await queries.reviews();

  return (
    <div className="grid gap-2 overflow-x-scroll">
      {reviews.map((review) => (
        <ReviewListItem key={review.id} review={review}>
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
        </ReviewListItem>
      ))}
    </div>
  );
}
