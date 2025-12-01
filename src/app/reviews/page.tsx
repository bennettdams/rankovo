import { ReviewsList } from "@/components/reviews-list";
import { SkeletonList } from "@/components/skeletons";
import { queries } from "@/data/queries";
import { t } from "@/lib/i18n";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: `Rankovo | ${t.reviews}`,
};

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
