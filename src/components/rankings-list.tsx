import { queries, type Ranking } from "@/data/queries";
import type { FiltersRankings } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { DateTime } from "./date-time";
import { StarsForRating } from "./stars-for-rating";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export async function RankingsList({
  filters: filtersExternal,
}: {
  filters: Promise<FiltersRankings>;
}) {
  const filters = await filtersExternal;
  const rankings = await queries.rankings(filters);

  return (
    <div className="grid gap-2 overflow-x-scroll">
      {rankings.length === 0 ? (
        <p>No rankings for your filters.</p>
      ) : (
        rankings.map((ranking, index) => (
          <RankingsTableRow
            key={ranking.id}
            restaurantName={ranking.restaurantName}
            rating={ranking.rating}
            productName={ranking.productName}
            productCategory={ranking.productCategory}
            productNote={ranking.productNote}
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
  restaurantName,
  numOfReviews,
  reviews,
  position,
}: {
  rating: Ranking["rating"];
  productName: Ranking["productName"];
  productCategory: Ranking["productCategory"];
  productNote: Ranking["productNote"];
  lastReviewedAt: Ranking["lastReviewedAt"];
  restaurantName: Ranking["restaurantName"];
  numOfReviews: Ranking["numOfReviews"];
  reviews: Ranking["reviews"];
  position: number;
}) {
  return (
    <RankingDialog
      restaurantName={restaurantName}
      rating={rating}
      productName={productName}
      productCategory={productCategory}
      productNote={productNote}
      lastReviewedAt={lastReviewedAt}
      numOfReviews={numOfReviews}
      reviews={reviews}
    >
      <div className="col-span-12 grid h-16 cursor-pointer grid-cols-subgrid items-center rounded-md bg-white hover:bg-secondary hover:text-secondary-fg">
        <div className="w-16 p-0">
          <Image
            alt="Product image"
            className="aspect-square rounded-md object-cover"
            height="64"
            src="/image-placeholder.svg"
            width="64"
          />
        </div>
        <div
          className={cn(
            "grid size-10 h-full place-items-center",
            position === 1 && "bg-[#FFD966] text-4xl text-white",
            position === 2 && "bg-[#B7CADB] text-2xl text-white",
            position === 3 && "bg-[#c27d6e] text-2xl text-white",
          )}
        >
          <p>{position}</p>
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
          <span className="w-full text-nowrap">{restaurantName}</span>
        </div>
        <div className="font-medium">{productCategory}</div>
        <div className="min-w-32" title={productNote ?? undefined}>
          <p className="line-clamp-2 font-medium">{productNote}</p>
        </div>
        {/* Last cell should have some padding to give breathing room when scrolling horizontally */}
        <div className="pr-10">
          <DateTime format="YYYY-MM-DD" date={lastReviewedAt} />
        </div>
      </div>
    </RankingDialog>
  );
}

function RankingDialog({
  rating,
  productName,
  productCategory,
  productNote,
  lastReviewedAt,
  restaurantName,
  numOfReviews,
  reviews,
  children,
}: {
  rating: Ranking["rating"];
  productName: Ranking["productName"];
  productCategory: Ranking["productCategory"];
  productNote: Ranking["productNote"];
  lastReviewedAt: Ranking["lastReviewedAt"];
  restaurantName: Ranking["restaurantName"];
  numOfReviews: Ranking["numOfReviews"];
  reviews: Ranking["reviews"];
  children: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-full md:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {restaurantName} - {productName}
          </DialogTitle>
          <DialogDescription>{productCategory}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 space-x-2">
          <div className="grid grid-cols-6">
            <div className="col-span-2 col-start-1 flex flex-col justify-center">
              <div
                className="line-clamp-1 flex-1"
                title={productNote ?? undefined}
              >
                {!productNote ? null : productNote}
              </div>

              <div className="flex-1">
                Last reviewed at:{" "}
                <DateTime date={lastReviewedAt} format="YYYY-MM-DD" />
              </div>
            </div>

            <div className="col-span-2 col-start-3">
              <p className="text-center text-3xl">{rating}</p>
              <StarsForRating rating={rating} />
            </div>

            <div className="col-span-2 col-start-5 flex items-center justify-start">
              <span className="font-bold">{numOfReviews}</span>
              <span className="ml-1.5">reviews</span>
            </div>
          </div>

          <div className="mt-6 w-full">
            <p className="font-bold">Reviews</p>

            <div className="grid h-60 auto-rows-min gap-x-4 overflow-y-scroll">
              {reviews.map((review) => (
                <div
                  className="col-span-12 grid h-6 grid-cols-subgrid items-center"
                  key={review.id}
                >
                  <p>{review.rating}</p>

                  <div className="flex items-center justify-start">
                    <StarsForRating size="small" rating={review.rating} />
                  </div>

                  <p className="pl-6 text-left">
                    <DateTime date={review.reviewedAt} format="YYYY-MM-DD" />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="default">
            Edit
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
