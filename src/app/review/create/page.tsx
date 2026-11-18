import { queries } from "@/data/queries";
import { shouldRunSearch } from "@/data/static";
import { ReviewCreateSkeleton } from "@/components/skeletons";
import { getUserAuth } from "@/lib/auth-server";
import { routes } from "@/lib/navigation";
import { schemaSearchParamSingle } from "@/lib/schemas";
import { parseSearchParamsOrRedirect } from "@/lib/url-state.server";
import { Suspense } from "react";
import { z } from "zod";
import { searchParamKeysReviewCreate } from "./page.shared";
import { PlaceSearchView } from "./place-search.client";

const keys = searchParamKeysReviewCreate;
const schemaSearchParams = z.object({
  [keys.q]: schemaSearchParamSingle(z.string().min(1), "string"),
});

export default function PageReviewCreate({
  searchParams,
}: {
  searchParams: Promise<unknown>;
}) {
  return (
    <Suspense fallback={<ReviewCreateSkeleton />}>
      <PlaceSearchScreen searchParams={searchParams} />
    </Suspense>
  );
}

async function PlaceSearchScreen({
  searchParams,
}: {
  searchParams: Promise<unknown>;
}) {
  const params = parseSearchParamsOrRedirect({
    schema: schemaSearchParams,
    searchParams: await searchParams,
    pathname: routes.reviewCreate,
  });
  const userAuth = await getUserAuth();
  const q = params.q;
  const [placesFound, placesRecent] = await Promise.all([
    shouldRunSearch(q) ? queries.searchPlacesByNameOrProduct(q) : [],
    userAuth ? queries.userRecentPlaces(userAuth.id) : [],
  ]);

  return (
    <PlaceSearchView
      queryInitial={q ?? null}
      placesFound={placesFound}
      placesRecent={placesRecent}
      isSignedIn={!!userAuth}
    />
  );
}
