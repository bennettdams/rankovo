"use client";

import { actionUpdateReview } from "@/data/actions";
import type { ReviewQuery } from "@/data/queries";
import { ratingHighest, ratingLowest } from "@/data/static";
import { createRandomNumberBetween } from "@/lib/utils";
import type { ReactNode } from "react";

export function ReviewListItem({
  review,
  children,
}: {
  review: ReviewQuery;
  children: ReactNode;
}) {
  return (
    <div
      className="col-span-12 grid h-16 cursor-pointer grid-cols-subgrid items-center rounded-md bg-white hover:bg-secondary hover:text-secondary-fg"
      onClick={() =>
        actionUpdateReview(review.id, {
          ...review,
          rating: createRandomNumberBetween({
            min: ratingLowest,
            max: ratingHighest,
            decimalPlaces: 1,
          }),
        })
      }
    >
      {children}
    </div>
  );
}
