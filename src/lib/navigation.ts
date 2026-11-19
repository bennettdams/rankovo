import { searchParamKeysReviewCreate } from "@/app/review/create/page.shared";
import { hrefWithSearchParams } from "./url-state";

export const routes = {
  home: "/",
  admin: "/admin",
  rankings: "/",
  reviews: "/reviews",
  reviewCreate: "/review/create",
  reviewCreateSearch: (q: string) =>
    hrefWithSearchParams(routes.reviewCreate, {
      [searchParamKeysReviewCreate.q]: q,
    }),
  reviewCreateAtPlace: (placeId: number) => `/review/create/${placeId}`,
  reviewCreateNew: "/review/create/new",
  reviewCreateNewPlace: (placeName: string) =>
    hrefWithSearchParams(routes.reviewCreateNew, {
      [searchParamKeysReviewCreate.placeName]: placeName,
    }),
  reviewCreateProduct: ({
    placeId,
    productId,
  }: {
    placeId: number;
    productId: number;
  }) =>
    hrefWithSearchParams(routes.reviewCreateAtPlace(placeId), {
      [searchParamKeysReviewCreate.productIdPreselected]: productId,
    }),
  user: (userId: string) => `/user/${userId}`,
  aboutUs: "/about-us",
  champions: "/champions",
  devLogin: "/dev/login",
} as const;
