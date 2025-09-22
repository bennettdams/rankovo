import { queries, type ReviewQuery } from "@/data/queries";
import { Box } from "./box";
import { DateTime } from "./date-time";
import { InfoMessage } from "./info-message";
import { NumberFormatted } from "./number-formatted";
import { ReviewSourceIcon } from "./review-source-icon";
import { ReviewWithDrawerClient } from "./reviews-list.client";
import { StarsForRating } from "./stars-for-rating";

export function ReviewsList({ reviews }: { reviews: ReviewQuery[] }) {
  return (
    <div className="grid gap-2 overflow-x-scroll">
      {reviews.length === 0 ? (
        <InfoMessage>No reviews found</InfoMessage>
      ) : (
        reviews.map((review) => (
          <ReviewWithDrawer key={review.id} productId={review.productId}>
            <Box
              className="hover:bg-gray-50 col-span-12 grid h-16 cursor-pointer grid-cols-subgrid items-center p-0 transition-colors"
              variant="sm"
            >
              <div>{review.productName}</div>
              <NumberFormatted num={review.rating} min={2} max={2} />
              <StarsForRating rating={review.rating} />
              <div title="You can create multiple reviews for the same product, but only the newest one will be used for the average rating calculation.">
                {review.isCurrent ? "Newest" : "Outdated"}
              </div>
              <div>{review.username}</div>
              <div>{review.note}</div>
              <div>{review.placeName}</div>
              <div>{review.city}</div>
              <div>
                {review.urlSource && (
                  <ReviewSourceIcon href={review.urlSource} />
                )}
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
            </Box>
          </ReviewWithDrawer>
        ))
      )}
    </div>
  );
}

export async function ReviewWithDrawer({
  productId,
  children,
}: {
  productId: number;
  children: React.ReactNode;
}) {
  const ranking = await queries.rankingForProductId(productId);

  return (
    <ReviewWithDrawerClient ranking={ranking}>
      {children}
    </ReviewWithDrawerClient>
  );
}
