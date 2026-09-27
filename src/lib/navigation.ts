import { searchParamKeysReviewCreate } from "@/app/review/create/page.shared";

function reviewCreateWith(params: Record<string, string>) {
  return `/review/create?${new URLSearchParams(params).toString()}`;
}

function reviewCreateAtPlaceWith(
  placeId: number,
  params?: Record<string, string>,
) {
  const query = params ? new URLSearchParams(params).toString() : "";
  return `/review/create/${placeId}${query ? `?${query}` : ""}`;
}

export const routes = {
  home: "/",
  admin: "/admin",
  rankings: "/",
  reviews: "/reviews",
  reviewCreate: "/review/create",
  reviewCreateSearch: (q: string) =>
    q
      ? reviewCreateWith({ [searchParamKeysReviewCreate.q]: q })
      : "/review/create",
  reviewCreateAtPlace: (placeId: number) => reviewCreateAtPlaceWith(placeId),
  reviewCreateNewPlace: (placeName: string) =>
    `/review/create/new?${new URLSearchParams({
      [searchParamKeysReviewCreate.placeName]: placeName,
    }).toString()}`,
  reviewCreateProduct: ({
    placeId,
    productId,
  }: {
    placeId: number;
    productId: number;
  }) =>
    reviewCreateAtPlaceWith(placeId, {
      [searchParamKeysReviewCreate.productIdPreselected]: String(productId),
    }),
  user: (userId: string) => `/user/${userId}`,
  aboutUs: "/about-us",
  champions: "/champions",
  devLogin: "/dev/login",
} as const;
