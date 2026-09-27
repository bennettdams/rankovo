import type { VisitCreate } from "@/lib/schemas";

type ReviewWithId = {
  id: VisitCreate["reviews"][number]["id"];
};

type VisitIssue = {
  path: readonly PropertyKey[];
  message: string;
};

export function visitErrorsByReviewId(
  issues: readonly VisitIssue[],
  reviews: readonly ReviewWithId[],
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of issues) {
    const [root, reviewIndex, ...fieldPath] = issue.path;
    const reviewId =
      root === "reviews" && typeof reviewIndex === "number"
        ? reviews[reviewIndex]?.id
        : undefined;
    const path = reviewId ? [reviewId, ...fieldPath] : issue.path;
    const key = path.map(String).join(".");
    errors[key] ??= issue.message;
  }

  return errors;
}
