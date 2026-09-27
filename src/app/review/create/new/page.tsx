import { ReviewCreateSkeleton } from "@/components/skeletons";
import { getUserAuth } from "@/lib/auth-server";
import { schemaSearchParamSingle } from "@/lib/schemas";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { searchParamKeysReviewCreate } from "../page.shared";
import { VisitFormForNewPlace } from "../visit-form.client";

const schemaSearchParams = z.object({
  [searchParamKeysReviewCreate.placeName]: schemaSearchParamSingle(
    z.string().min(1),
    "string",
  ),
});

export default async function ReviewCreateNewPlacePage({
  searchParams,
}: {
  searchParams: Promise<unknown>;
}) {
  return (
    <Suspense fallback={<ReviewCreateSkeleton />}>
      <ReviewCreateNewPlaceScreen searchParams={searchParams} />
    </Suspense>
  );
}

async function ReviewCreateNewPlaceScreen({
  searchParams,
}: {
  searchParams: Promise<unknown>;
}) {
  const params = schemaSearchParams.parse(await searchParams);
  const placeName = params[searchParamKeysReviewCreate.placeName]?.trim();
  if (!placeName) notFound();
  const userAuth = await getUserAuth();

  return (
    <VisitFormForNewPlace
      placeName={placeName}
      products={[]}
      userReviews={[]}
      productIdPreselected={null}
      userRole={userAuth?.role ?? null}
    />
  );
}
