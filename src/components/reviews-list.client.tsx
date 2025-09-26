"use client";

import { useState } from "react";
import { ProductDescriptionRow } from "./product-description-row";
import { ReviewForm } from "./review-form.client";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

export function EditReviewButtonWithSheet({
  productId,
  productName,
  placeName,
  city,
  rating,
  note,
  urlSource,
}: {
  productId: number;
  productName: string;
  placeName: string | null;
  city: string | null;
  rating: number;
  note: string | null;
  urlSource: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="sticky right-0 z-10 flex h-full items-center justify-end px-3 backdrop-blur"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            size="md"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            Edit
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="flex flex-col gap-6">
          <SheetHeader>
            <SheetTitle>Edit Review</SheetTitle>
            <SheetDescription>
              Update your review for{" "}
              <span className="font-semibold">{productName}</span>. This will
              create a new current review and keep the old one in history.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 overflow-y-auto pr-2">
            <ProductDescriptionRow
              productName={productName ?? null}
              placeName={placeName ?? null}
              city={city ?? null}
              showBold={true}
            />

            <ReviewForm
              productId={productId}
              initialValues={{
                rating,
                note,
                urlSource,
              }}
              onSuccess={() => setOpen(false)}
              showSuccessMessage={false}
              layout="stacked"
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
