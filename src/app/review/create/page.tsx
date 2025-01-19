"use client";

import { actionCreateReview, ReviewCreate } from "@/data/actions";
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
    <form action={formAction}>
      <fieldset>
        <label htmlFor={formKeys.productId}>Product ID</label>
        <input
          name={formKeys.productId}
          type="text"
          placeholder="Product"
          defaultValue={state?.values?.productId ?? ""}
        />
        {state?.errors?.productId && (
          <p aria-live="polite">{state.errors.productId}</p>
        )}
      </fieldset>

      <fieldset>
        <label htmlFor={formKeys.note}>Note</label>
        <textarea
          name={formKeys.note}
          placeholder="Want to note something?"
          defaultValue={state?.values?.note ?? ""}
        />
        {state?.errors?.note && <p aria-live="polite">{state.errors.note}</p>}
      </fieldset>

      <fieldset>
        <label htmlFor={formKeys.rating}>Rating</label>
        <input
          name={formKeys.rating}
          type="number"
          className="w-20"
          min={ratingLowest}
          max={ratingHighest}
          step="0.1"
          lang="en"
          placeholder={`${ratingLowest} - ${ratingHighest}`}
          defaultValue={state?.values?.rating ?? ""}
        />
        {state?.errors?.rating && (
          <p aria-live="polite">{state.errors.rating}</p>
        )}
      </fieldset>

      {state?.success && (
        <p aria-live="polite" className="text-green-700">
          Review submitted successfully!
        </p>
      )}

      <button type="submit" disabled={pending}>
        {pending ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
