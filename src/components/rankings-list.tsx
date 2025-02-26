import type { FiltersRankings } from "@/app/page";
import { queries, type Ranking } from "@/data/queries";
import { formatDateTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { CategoryBadge } from "./category-badge";
import { DateTime } from "./date-time";
import { InfoMessage } from "./info-message";
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

export async function RankingsList({
  filters: filtersExternal,
}: {
  filters: Promise<FiltersRankings>;
}) {
  const filters = await filtersExternal;
  const rankings = await queries.rankings(filters);

  return (
    <div className="grid gap-x-3 gap-y-2 overflow-x-scroll">
      {rankings.length === 0 ? (
        <InfoMessage>No rankings for your filters.</InfoMessage>
      ) : (
        rankings.map((ranking, index) => (
          <RankingsTableRow
            key={ranking.id}
            placeName={ranking.placeName}
            rating={ranking.rating}
            productName={ranking.productName}
            productCategory={ranking.productCategory}
            productNote={ranking.productNote}
            city={ranking.city}
            lastReviewedAt={ranking.lastReviewedAt}
            numOfReviews={ranking.numOfReviews}
            reviews={ranking.reviews}
            position={index + 1}
          />
        ))
      )}
    </div>
  );
}

function RankingsTableRow({
  rating,
  productName,
  productCategory,
  productNote,
  lastReviewedAt,
  placeName,
  city,
  numOfReviews,
  reviews,
  position,
}: {
  rating: Ranking["rating"];
  productName: Ranking["productName"];
  productCategory: Ranking["productCategory"];
  productNote: Ranking["productNote"];
  lastReviewedAt: Ranking["lastReviewedAt"];
  placeName: Ranking["placeName"];
  city: Ranking["city"];
  numOfReviews: Ranking["numOfReviews"];
  reviews: Ranking["reviews"];
  position: number;
}) {
  return (
    <RankingDrawer
      placeName={placeName}
      rating={rating}
      productName={productName}
      productCategory={productCategory}
      productNote={productNote}
      city={city}
      lastReviewedAt={lastReviewedAt}
      numOfReviews={numOfReviews}
      reviews={reviews}
    >
      <div className="group/ranking-row col-span-12 grid h-16 cursor-pointer grid-cols-subgrid items-center rounded-md bg-white hover:bg-secondary hover:text-secondary-fg">
        <div
          className={cn(
            "ml-3 grid size-12 place-items-center rounded-full border-2 border-gray text-xl group-hover/ranking-row:text-secondary-fg",
            position === 1 && "border-none bg-[#FFD966] text-4xl text-white",
            position === 2 && "border-none bg-[#B7CADB] text-2xl text-white",
            position === 3 && "border-none bg-[#c27d6e] text-2xl text-white",
          )}
        >
          <p>{position}</p>
        </div>
        <div className="w-12 p-0">
          <Image
            alt="Product image"
            className="aspect-square rounded-md object-cover"
            height="48"
            src="/image-placeholder.svg"
            width="48"
          />
        </div>
        <div className="min-w-32" title={productName}>
          <p className="line-clamp-2 font-medium">{productName}</p>
        </div>
        <div>
          <span className="text-right">{rating}</span>
        </div>
        <div>
          <StarsForRating rating={rating} size="small" />
        </div>
        <div>
          <span className="w-full text-nowrap text-secondary">{placeName}</span>
        </div>
        <div>
          <span className="w-full text-nowrap">{city}</span>
        </div>
        <div className="font-medium">
          <CategoryBadge category={productCategory} />
        </div>
        <div className="min-w-32" title={productNote ?? undefined}>
          <p className="line-clamp-2 font-medium">{productNote}</p>
        </div>
        {/* Last cell should have some padding to give breathing room when scrolling horizontally */}
        <div className="pr-10">
          <DateTime format="YYYY-MM-DD" date={lastReviewedAt} />
        </div>
      </div>
    </RankingDrawer>
  );
}

function RankingDrawer({
  rating,
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
  rating: Ranking["rating"];
  productName: Ranking["productName"];
  productCategory: Ranking["productCategory"];
  productNote: Ranking["productNote"];
  lastReviewedAt: Ranking["lastReviewedAt"];
  placeName: Ranking["placeName"];
  city: Ranking["city"];
  numOfReviews: Ranking["numOfReviews"];
  reviews: Ranking["reviews"];
  children: React.ReactNode;
}) {
  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="mx-auto flex h-[80vh] w-full flex-col md:max-w-5xl">
        <DrawerHeader>
          <DrawerTitle className="font-normal">
            <div className="flex">
              <div className="grow text-left">
                <p className="line-clamp-1 text-2xl md:text-3xl">
                  {productName}
                </p>

                <div className="mt-4">
                  <span className="text-xl text-secondary">{placeName}</span>

                  {city && (
                    <>
                      <span className="ml-2 text-secondary">|</span>
                      <span className="ml-2 text-secondary">{city}</span>
                    </>
                  )}
                </div>

                <div className="mt-4 flex flex-col items-start gap-2 md:flex-row md:items-center">
                  <CategoryBadge category={productCategory} />
                  <div
                    className="line-clamp-1 flex-1"
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
                <p className="text-center text-3xl md:text-5xl">{rating}</p>
                <div className="block md:hidden">
                  <StarsForRating size="medium" rating={rating} />
                </div>
                <div className="hidden md:block">
                  <StarsForRating size="large" rating={rating} />
                </div>

                <div>
                  <span className="font-bold">{numOfReviews}</span>
                  <span className="ml-1.5">reviews</span>
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
            <ReviewsList reviews={reviews} />
          </TabsContent>

          <TabsContent value="tab-map" className="flex-1">
            <ProductMap placeName={placeName} city={city} />
          </TabsContent>
        </Tabs>

        <div className="mt-6 hidden min-h-0 flex-1 flex-col md:flex">
          <div className="mb-3 min-h-0 flex-1 pb-3">
            <ReviewsList reviews={reviews} />
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

function ReviewsList({ reviews }: { reviews: Ranking["reviews"] }) {
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

            <p className="whitespace-nowrap">{review.username}</p>

            <p className="pl-6 text-left">
              <DateTime date={review.reviewedAt} format="YYYY-MM-DD" />
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
  placeName: Ranking["placeName"];
  city: Ranking["city"];
}) {
  return (
    <div className="grid h-full">
      {!!placeName && !!city && (
        <MapWithPlace placeName={placeName} city={city} />
      )}
    </div>
  );
}
