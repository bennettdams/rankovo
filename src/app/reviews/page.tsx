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
          <div>{review.id}</div>
          <div>{review.rating}</div>
          <div>{review.username}</div>
          <div>created {review.createdAt.toISOString()}</div>
          <div>reviewed {review.reviewedAt.toISOString()}</div>
          <div>updated {review.updatedAt?.toISOString()}</div>
          <div>{review.note}</div>
        </ReviewListItem>
      ))}
    </div>
  );
}
