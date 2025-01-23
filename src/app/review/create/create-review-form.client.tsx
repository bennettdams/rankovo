"use client";

import { FieldError, Fieldset } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { actionCreateReview, type ReviewCreate } from "@/data/actions";
import { ProductSearchQuery } from "@/data/queries";
import { ratingHighest, ratingLowest } from "@/data/static";
import { schemaCreateReview } from "@/db/db-schema";
import { useActionState } from "react";
import { ProductSearch } from "./product-search.client";

const formKeys = {
  productId: "productId",
  note: "note",
  rating: "rating",
};

function transformFromStringToNumber(numAsString: string) {
  if (numAsString === "") return undefined;

  const num = Number(numAsString);
  if (isNaN(num)) return undefined;

  return num;
}

export type FormState = ReturnType<typeof prepareFormDataReviewCreate>;

export function prepareFormDataReviewCreate(formData: FormData) {
  return {
    note: formData.get(formKeys.note) as string | undefined,
    productId: transformFromStringToNumber(
      formData.get(formKeys.productId) as string,
    ),
    rating: transformFromStringToNumber(
      formData.get(formKeys.rating) as string,
    ),
    reviewedAt: new Date(),
  } satisfies Record<keyof ReviewCreate, unknown>;
}

function createReview(_: unknown, formData: FormData) {
  const formState = prepareFormDataReviewCreate(formData);

  const {
    success,
    error,
    data: reviewParsed,
  } = schemaCreateReview.omit({ authorId: true }).safeParse(formState);

  if (!success) {
    return {
      errors: error.flatten().fieldErrors,
      values: formState,
    };
  }

  return actionCreateReview(reviewParsed, formState);
}

export function CreateReviewForm({
  products,
}: {
  products: ProductSearchQuery[];
}) {
  const [state, formAction, isPendingAction] = useActionState(
    createReview,
    null,
  );

  return (
    <div className="flex flex-col gap-y-8">
      <div>
        <h2 className="text-2xl">1. Search for a product</h2>

        <ProductSearch products={products} />
      </div>

      <div>
        <h2 className="text-2xl">2. Add your verdict</h2>

        <form action={formAction} className="mt-10 flex flex-col">
          <Fieldset>
            <Label htmlFor={formKeys.productId}>Product ID</Label>
            <Input
              name={formKeys.productId}
              type="text"
              placeholder="Product"
              defaultValue={state?.values?.productId ?? ""}
            />
            <FieldError errorMsg={state?.errors?.productId} />
          </Fieldset>

          <Fieldset>
            <Label htmlFor={formKeys.rating}>Rating</Label>
            <Input
              name={formKeys.rating}
              type="number"
              className="w-32"
              step="0.1"
              lang="en"
              placeholder={`${ratingLowest} to ${ratingHighest}`}
              defaultValue={state?.values?.rating ?? ""}
            />
            <FieldError errorMsg={state?.errors?.rating} />
          </Fieldset>

          <Fieldset>
            <Label htmlFor={formKeys.note}>Note</Label>
            <Textarea
              name={formKeys.note}
              placeholder="Want to note something?"
              defaultValue={state?.values?.note ?? ""}
            />
            <FieldError errorMsg={state?.errors?.note} />
          </Fieldset>

          <Button className="w-min" type="submit" disabled={isPendingAction}>
            {isPendingAction ? "Submitting..." : "Submit"}
          </Button>

          {state?.success && (
            <p aria-live="polite" className="text-green-700">
              Review submitted successfully!
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
