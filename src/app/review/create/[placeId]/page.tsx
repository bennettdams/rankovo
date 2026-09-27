import { ReviewCreateSkeleton } from "@/components/skeletons";
import { queries } from "@/data/queries";
import { schemaPlaceId, schemaProductId } from "@/db/db-schema";
import { getUserAuth } from "@/lib/auth-server";
import { schemaSearchParamSingle } from "@/lib/schemas";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { searchParamKeysReviewCreate } from "../page.shared";
import { VisitFormForExistingPlace } from "../visit-form.client";

const schemaSearchParams = z.object({
  [searchParamKeysReviewCreate.productIdPreselected]: schemaSearchParamSingle(
    schemaProductId,
    "number",
  ),
});

export default async function ReviewCreateAtPlacePage({
  params,
  searchParams,
}: {
  params: Promise<{ placeId: string }>;
  searchParams: Promise<unknown>;
}) {
  return (
    <Suspense fallback={<ReviewCreateSkeleton />}>
      <ReviewCreateAtPlaceScreen params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ReviewCreateAtPlaceScreen({
  params,
  searchParams,
}: {
  params: Promise<{ placeId: string }>;
  searchParams: Promise<unknown>;
}) {
  const { placeId: placeIdParam } = await params;
  const placeIdResult = schemaPlaceId.safeParse(Number(placeIdParam));
  if (!placeIdResult.success) notFound();

  const searchParamsParsed = schemaSearchParams.parse(await searchParams);
  const productIdPreselected =
    searchParamsParsed[searchParamKeysReviewCreate.productIdPreselected];
  const userAuth = await getUserAuth();

  const [place, userReviews] = await Promise.all([
    queries.placeWithProducts(placeIdResult.data),
    userAuth ? queries.userReviewsAtPlace(userAuth.id, placeIdResult.data) : [],
  ]);

  if (!place) notFound();

  return (
    <VisitFormForExistingPlace
      place={{
        kind: "existing",
        id: place.id,
        name: place.name,
        cities: place.cities,
      }}
      products={place.products}
      userReviews={userReviews}
      productIdPreselected={productIdPreselected}
      userRole={userAuth?.role ?? null}
    />
  );
}
