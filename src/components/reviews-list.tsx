import { queries, type ReviewQuery } from "@/data/queries";
import { Box } from "./box";
import { DateTime } from "./date-time";
import { InfoMessage } from "./info-message";
import { NumberFormatted } from "./number-formatted";
import { RankingDrawer } from "./ranking-drawer";
import { ReviewSourceIcon } from "./review-source-icon";
import { EditReviewButtonWithSheet } from "./reviews-list.client";
import { StarsForRating } from "./stars-for-rating";

export function ReviewsList({ reviews }: { reviews: ReviewQuery[] }) {
  if (reviews.length === 0) {
    return (
      <div className="mt-4">
        <InfoMessage>No reviews found</InfoMessage>
      </div>
    );
  }

  return (
    <div className="grid gap-2 overflow-x-scroll">
      {reviews.map((review) => (
        <ReviewWithDrawer key={review.id} productId={review.productId}>
          <Box
            className="col-span-12 grid h-16 cursor-pointer grid-cols-subgrid items-center whitespace-nowrap p-0 transition-colors hover:bg-secondary hover:text-secondary-fg"
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
              {review.urlSource && <ReviewSourceIcon href={review.urlSource} />}
            </div>

            {/* fixed width because the date will only be evaluated on the client */}
            <div className="w-52">
              Reviewed at{" "}
              {/* TODO remove null check when all reviews have a date */}
              {!review.reviewedAt ? (
                "-"
              ) : (
                <DateTime date={review.reviewedAt} format="YYYY-MM-DD" />
              )}
            </div>

            {/* fixed width because the date will only be evaluated on the client */}
            <div className="w-52">
              Updated{" "}
              {!review.updatedAt ? (
                "-"
              ) : (
                <DateTime date={review.updatedAt} format="YYYY-MM-DD" />
              )}
            </div>

            <EditReviewButtonWithSheet
              productId={review.productId}
              productName={review.productName}
              placeName={review.placeName}
              city={review.city}
              rating={review.rating}
              note={review.note}
              urlSource={review.urlSource}
            />
          </Box>
        </ReviewWithDrawer>
      ))}
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
    <RankingDrawer
      ratingAvg={ranking.ratingAvg}
      productName={ranking.productName}
      productCategory={ranking.productCategory}
      productNote={ranking.productNote}
      lastReviewedAt={ranking.lastReviewedAt}
      placeName={ranking.placeName}
      city={ranking.city}
      numOfReviews={ranking.numOfReviews}
      reviews={ranking.reviews}
    >
      {children}
    </RankingDrawer>
  );
}
