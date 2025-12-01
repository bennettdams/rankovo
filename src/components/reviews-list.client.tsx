"use client";

import { useUserAuth } from "@/lib/auth-client";
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
  const userAuth = useUserAuth();

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
            Bearbeiten
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="flex flex-col gap-6">
          <SheetHeader>
            <SheetTitle>Bewertung bearbeiten</SheetTitle>
            <SheetDescription>
              Aktualisiere deine Bewertung für{" "}
              <span className="font-semibold">{productName}</span>. Dies
              erstellt eine neue aktuelle Bewertung und behält die alte in der
              Historie.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 overflow-y-auto pr-2">
            <ProductDescriptionRow
              productName={productName}
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
              userAuthRole={
                userAuth.state === "authenticated" ? userAuth.role : null
              }
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
