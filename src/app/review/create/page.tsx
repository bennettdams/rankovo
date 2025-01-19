"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { actionCreateReview, type ReviewCreate } from "@/data/actions";
import { ratingHighest, ratingLowest } from "@/data/static";
import { schemaCreateReview } from "@/db/db-schema";
import { useActionState } from "react";

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

export default function PageReviewCreate() {
  const [state, formAction, pending] = useActionState(createReview, null);

  return (
    <div>
      <h1 className="text-center text-3xl text-primary">Create Review</h1>

      <form action={formAction} className="mt-10 flex flex-col gap-y-4">
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

        <Button className="w-min" type="submit" disabled={pending}>
          {pending ? "Submitting..." : "Submit"}
        </Button>

        {state?.success && (
          <p aria-live="polite" className="text-green-700">
            Review submitted successfully!
          </p>
        )}
      </form>
    </div>
  );
}

function Fieldset({ children }: { children: React.ReactNode }) {
  return (
    <fieldset className="grid w-full max-w-sm items-center gap-1.5">
      {children}
    </fieldset>
  );
}

function FieldError({ errorMsg }: { errorMsg: string[] | undefined }) {
  return (
    errorMsg && (
      <p aria-live="polite" className="text-error">
        {errorMsg}
      </p>
    )
  );
}
