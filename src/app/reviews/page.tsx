import { ReviewsList } from "@/components/reviews-list";
import { SkeletonList } from "@/components/skeletons";
import { queries } from "@/data/queries";
import { Suspense } from "react";

export default async function PageReviews() {
  const reviews = await queries.reviews();

  return (
    <div className="pt-8 md:pt-12">
      <Suspense fallback={<SkeletonList />}>
        <ReviewsList reviews={reviews} />
      </Suspense>
    </div>
  );
}
