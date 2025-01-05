import { api } from "@/data/api";
import type { Ranking } from "@/data/mock-data";
import type { FiltersRankings } from "@/lib/schemas";
import Image from "next/image";
import { Fragment } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

export async function RankingsList({
  filters: filtersExternal,
}: {
  filters: Promise<FiltersRankings>;
}) {
  const filters = await filtersExternal;
  const rankings = await api.getRankings(filters);

  return (
    <Table className="border-separate border-spacing-y-2">
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-16">
            <span className="sr-only">Image</span>
          </TableHead>
          <TableHead>Restaurant</TableHead>
          <TableHead>Rating</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Note</TableHead>
          <TableHead className="text-nowrap">Reviewed at</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rankings.map((ranking) => (
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
          />
        ))}
      </TableBody>
    </Table>
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
}: {
  rating: Ranking["rating"];
  productName: Ranking["productName"];
  productCategory: Ranking["productCategory"];
  productNote: Ranking["productNote"];
  lastReviewedAt: Ranking["lastReviewedAt"];
  restaurantName: Ranking["restaurantName"];
  numOfReviews: Ranking["numOfReviews"];
  reviews: Ranking["reviews"];
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
      <TableRow className="cursor-pointer bg-white">
        <TableCell className="p-4">
          <div className="min-w-16 p-0">
            <Image
              alt="Product image"
              className="aspect-square rounded-md object-cover"
              height="56"
              src="/image-placeholder.svg"
              width="56"
            />
          </div>
        </TableCell>
        <TableCell className="font-medium text-primary">
          <span className="line-clamp-2 w-full max-w-96">{restaurantName}</span>
        </TableCell>
        <TableCell>
          <div className="flex">
            <span className="text-fg">{rating}</span>
            <span className="ml-1">
              <StarsForRating rating={rating} size="small" />
            </span>
          </div>
        </TableCell>
        <TableCell className="font-medium">{productName}</TableCell>
        <TableCell className="font-medium">{productCategory}</TableCell>
        <TableCell className="font-medium">{productNote}</TableCell>
        <TableCell>
          <DateTime format="YYYY-MM-DD" date={lastReviewedAt} />
        </TableCell>
      </TableRow>
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
              <div className="line-clamp-1 flex-1" title={productNote}>
                {productNote + productNote + productNote}
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

          <div className="mt-6 grid h-60 w-full grid-cols-[min-content_min-content_min-content] gap-x-4 overflow-y-scroll">
            {reviews.map((review) => (
              <Fragment key={review.id}>
                <p>{review.rating}</p>

                <div className="flex items-center justify-start">
                  <StarsForRating size="small" rating={review.rating} />
                </div>

                <p className="pl-6 text-left">
                  <DateTime date={review.reviewedAt} format="YYYY-MM-DD" />
                </p>
              </Fragment>
            ))}
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
