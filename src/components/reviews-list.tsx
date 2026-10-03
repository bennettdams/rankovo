import { queries, type ReviewQuery } from "@/data/queries";
import { formatCitiesLabel } from "@/lib/cities";
import { CategoryBadge } from "./badges";
import { Box } from "./box";
import { DateTime } from "./date-time";
import { InfoMessage } from "./info-message";
import { NumberFormatted } from "./number-formatted";
import { RankingDrawer } from "./ranking-drawer.client";
import { ReviewSourceIcon } from "./review-source-icon";
import { EditReviewButtonWithSheet } from "./reviews-list.client";
import { StarsForRating } from "./stars-for-rating";

export function ReviewsList({
  reviews,
  isOwnProfile,
}: {
  reviews: ReviewQuery[];
  isOwnProfile: boolean;
}) {
  if (reviews.length === 0) {
    return (
      <div className="mt-4">
        <InfoMessage>Keine Bewertungen gefunden</InfoMessage>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {reviews.map((review) => (
        <ReviewWithDrawer key={review.id} productId={review.productId}>
          <Box
            className="group/review-card w-full max-w-full min-w-0 cursor-pointer overflow-hidden p-4 transition-transform hover:-translate-y-0.5 md:p-5"
            variant="lg"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary text-2xl font-semibold text-primary-fg shadow-md">
                  <NumberFormatted num={review.rating} min={1} max={1} />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className="truncate text-lg font-semibold text-secondary"
                      title={review.productName}
                    >
                      {review.productName}
                    </p>
                    <span
                      className={
                        review.isCurrent
                          ? "rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-semibold text-secondary"
                          : "rounded-full bg-tertiary/15 px-2 py-0.5 text-xs font-semibold text-tertiary"
                      }
                      title={
                        review.isCurrent
                          ? undefined
                          : "Eine neuere Bewertung für dieses Produkt existiert."
                      }
                    >
                      {review.isCurrent ? "Aktuell" : "Ältere Version"}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-dark-gray">
                    {review.placeName}
                    {formatCitiesLabel(review.cities)
                      ? ` · ${formatCitiesLabel(review.cities)}`
                      : null}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <CategoryBadge
                      category={review.productCategory}
                      size="sm"
                    />
                    <StarsForRating rating={review.rating} size="small" />
                  </div>
                </div>
              </div>

              {isOwnProfile && (
                <div className="shrink-0 md:pt-1">
                  <EditReviewButtonWithSheet
                    productId={review.productId}
                    productName={review.productName}
                    placeName={review.placeName}
                    cities={review.cities}
                    rating={review.rating}
                    note={review.note}
                    urlSource={review.urlSource}
                  />
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-gray/70 pt-3 text-sm md:flex-row md:items-center md:justify-between">
              <p
                className="line-clamp-2 min-h-5 text-fg"
                title={review.note ?? undefined}
              >
                {review.note ? `“${review.note}”` : "Keine Notiz hinzugefügt"}
              </p>

              <div className="flex shrink-0 items-center gap-3 text-xs text-dark-gray">
                <span>
                  Bewertet am{" "}
                  {review.reviewedAt ? (
                    <DateTime date={review.reviewedAt} format="YYYY-MM-DD" />
                  ) : (
                    "-"
                  )}
                </span>
                {review.urlSource && (
                  <ReviewSourceIcon href={review.urlSource} />
                )}
              </div>
            </div>
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
      placeId={ranking.placeId}
      productId={productId}
      ratingAvg={ranking.ratingAvg}
      productName={ranking.productName}
      productCategory={ranking.productCategory}
      productNote={ranking.productNote}
      lastReviewedAt={ranking.lastReviewedAt}
      placeName={ranking.placeName}
      cities={ranking.cities}
      numOfReviews={ranking.numOfReviews}
      reviews={ranking.reviews}
    >
      {children}
    </RankingDrawer>
  );
}
