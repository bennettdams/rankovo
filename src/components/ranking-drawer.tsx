import type { RankingWithReviewsQuery } from "@/data/queries";
import { formatDateTime } from "@/lib/date-utils";
import { routes } from "@/lib/navigation";
import Link from "next/link";
import { CategoryBadge } from "./category-badge";
import { DateTime } from "./date-time";
import { MapWithPlace } from "./map-with-place";
import { NumberFormatted } from "./number-formatted";
import { ReviewSourceIcon } from "./review-source-icon";
import { StarsForRating } from "./stars-for-rating";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function RankingDrawer({
  ratingAvg,
  productName,
  productCategory,
  productNote,
  lastReviewedAt,
  placeName,
  city,
  numOfReviews,
  reviews,
  children,
}: {
  ratingAvg: RankingWithReviewsQuery["ratingAvg"];
  productName: RankingWithReviewsQuery["productName"];
  productCategory: RankingWithReviewsQuery["productCategory"];
  productNote: RankingWithReviewsQuery["productNote"];
  lastReviewedAt: RankingWithReviewsQuery["lastReviewedAt"];
  placeName: RankingWithReviewsQuery["placeName"];
  city: RankingWithReviewsQuery["city"];
  numOfReviews: RankingWithReviewsQuery["numOfReviews"];
  reviews: RankingWithReviewsQuery["reviews"];
  children: React.ReactNode;
}) {
  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="mx-auto flex h-[80vh] w-full flex-col md:max-w-5xl">
        <DrawerHeader>
          <DrawerTitle className="font-normal">
            <p className="line-clamp-2 text-left text-2xl md:text-3xl">
              {productName}
            </p>

            <div className="mt-4 flex">
              <div className="flex grow flex-col gap-y-3 text-left">
                <div className="line-clamp-2">
                  <span className="text-xl text-secondary">{placeName}</span>

                  {city && (
                    <>
                      <span className="ml-2 text-secondary">|</span>
                      <span className="ml-2 text-secondary">{city}</span>
                    </>
                  )}
                </div>

                <div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
                  <CategoryBadge category={productCategory} />
                  <div
                    className="line-clamp-2 flex-1"
                    title={productNote ?? undefined}
                  >
                    {!productNote ? null : productNote}
                  </div>
                </div>
              </div>

              <div
                title={`Last reviewed at ${formatDateTime(lastReviewedAt, "YYYY-MM-DD hh:mm")}`}
                className="flex flex-col items-center gap-y-2 text-center md:pr-10"
              >
                <p className="text-center text-3xl md:text-5xl">
                  <NumberFormatted num={ratingAvg} min={1} max={2} />
                </p>
                <div className="block md:hidden">
                  <StarsForRating size="medium" rating={ratingAvg} />
                </div>
                <div className="hidden md:block">
                  <StarsForRating size="large" rating={ratingAvg} />
                </div>

                <div>
                  <span className="font-bold">{numOfReviews}</span>
                  <span className="ml-1.5">
                    {numOfReviews === 1 ? "review" : "reviews"}
                  </span>
                </div>
              </div>
            </div>
          </DrawerTitle>
        </DrawerHeader>

        <Tabs
          defaultValue="tab-reviews"
          className="mt-6 flex min-h-0 flex-1 flex-col md:hidden"
        >
          <TabsList className="w-min">
            <TabsTrigger value="tab-reviews">Reviews</TabsTrigger>
            <TabsTrigger value="tab-map">Map</TabsTrigger>
          </TabsList>

          <TabsContent value="tab-reviews" className="flex-1 overflow-y-auto">
            <LastReviewsList reviews={reviews} />
          </TabsContent>

          <TabsContent value="tab-map" className="flex-1">
            <ProductMap placeName={placeName} city={city} />
          </TabsContent>
        </Tabs>

        <div className="mt-6 hidden min-h-0 flex-1 flex-col md:flex">
          <div className="mb-3 min-h-0 flex-1 pb-3">
            <LastReviewsList reviews={reviews} />
          </div>
          <div className="mt-3 flex-1 pt-3">
            <ProductMap placeName={placeName} city={city} />
          </div>
        </div>

        <DrawerFooter className="flex items-end">
          <DrawerClose asChild>
            <Button variant="secondary">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function LastReviewsList({
  reviews,
}: {
  reviews: RankingWithReviewsQuery["reviews"];
}) {
  return (
    <>
      <p className="font-bold">Last 20 reviews</p>

      <div className="grid max-h-full auto-rows-min gap-x-4 overflow-y-scroll text-left">
        {reviews.map((review) => (
          <div
            className="col-span-12 grid h-6 grid-cols-subgrid items-center"
            key={review.id}
          >
            <NumberFormatted num={review.rating} min={2} max={2} />

            <div className="flex items-center justify-start">
              <StarsForRating size="small" rating={review.rating} />
            </div>

            <Link
              className="whitespace-nowrap hover:text-primary hover:underline"
              href={routes.user(review.authorId)}
            >
              {review.username}
            </Link>

            <p className="pl-6 text-left">
              {/* TODO remove null check when all reviews have a date */}
              {!review.reviewedAt ? (
                "-"
              ) : (
                <DateTime date={review.reviewedAt} format="YYYY-MM-DD" />
              )}
            </p>

            <p className="truncate pl-6" title={review.note ?? undefined}>
              {review.note}
            </p>

            {review.urlSource && <ReviewSourceIcon href={review.urlSource} />}
          </div>
        ))}
      </div>
    </>
  );
}

function ProductMap({
  placeName,
  city,
}: {
  placeName: RankingWithReviewsQuery["placeName"];
  city: RankingWithReviewsQuery["city"];
}) {
  return (
    <div className="grid h-full">
      {!!placeName && !!city && (
        <MapWithPlace placeName={placeName} city={city} />
      )}
    </div>
  );
}
