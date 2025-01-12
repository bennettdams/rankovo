"use client";

import { actionUpdateReview } from "@/data/actions";
import { ratingHighest, ratingLowest } from "@/data/static";
import type { Review } from "@/db/db-schema";
import { createRandomNumberBetween } from "@/lib/utils";
import type { ReactNode } from "react";

export function ReviewListItem({
  review,
  children,
}: {
  review: Review;
  children: ReactNode;
}) {
  return (
    <div
      className="col-span-12 grid h-16 cursor-pointer grid-cols-subgrid items-center"
      onClick={() =>
        actionUpdateReview({
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
