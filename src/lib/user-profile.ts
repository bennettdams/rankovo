export type UserReviewStatsInput = {
  rating: number;
  productCategory: string;
  placeName: string;
  reviewedAt: Date | null;
};

export type UserReviewStats = {
  count: number;
  averageRating: number | null;
  ratingLowest: number | null;
  ratingHighest: number | null;
  categoryCount: number;
  placeCount: number;
  latestReviewedAt: Date | null;
};

export function getUserReviewStats(
  reviews: readonly UserReviewStatsInput[],
): UserReviewStats {
  if (reviews.length === 0) {
    return {
      count: 0,
      averageRating: null,
      ratingLowest: null,
      ratingHighest: null,
      categoryCount: 0,
      placeCount: 0,
      latestReviewedAt: null,
    };
  }

  const ratings = reviews.map((review) => review.rating);
  const latestReviewedAt = reviews.reduce<Date | null>((latest, review) => {
    if (!review.reviewedAt) return latest;
    if (!latest || review.reviewedAt > latest) return review.reviewedAt;
    return latest;
  }, null);

  return {
    count: reviews.length,
    averageRating: Number(
      (
        ratings.reduce((sum, rating) => sum + rating, 0) / reviews.length
      ).toFixed(1),
    ),
    ratingLowest: Math.min(...ratings),
    ratingHighest: Math.max(...ratings),
    categoryCount: new Set(reviews.map((review) => review.productCategory))
      .size,
    placeCount: new Set(reviews.map((review) => review.placeName)).size,
    latestReviewedAt,
  };
}
