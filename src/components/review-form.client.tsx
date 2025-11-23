"use client";

import { FieldError, Fieldset } from "@/components/form";
import { NumberFormatted } from "@/components/number-formatted";
import { Slider } from "@/components/slider";
import { StarsForRating } from "@/components/stars-for-rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { actionCreateReview, type ReviewCreate } from "@/data/actions";
import {
  ratingHighest,
  ratingLowest,
  ratingMiddle,
  type Role,
  usernamesReserved,
} from "@/data/static";
import { schemaCreateReview } from "@/db/db-schema";
import { type ActionStateError, withCallbacks } from "@/lib/action-utils";
import {
  type FormConfig,
  type FormState,
  prepareFormState,
} from "@/lib/form-utils";
import { cn } from "@/lib/utils";
import { Save } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useActionState, useState } from "react";

const formKeys = {
  productId: "productId",
  note: "note",
  rating: "rating",
  reviewedAt: "reviewedAt",
  urlSource: "urlSource",
  overwriteAuthorId: "overwriteAuthorId",
} satisfies Record<keyof typeof formConfig, string>;

const formConfig = {
  productId: "number",
  note: "string",
  rating: "number",
  urlSource: "string",
  reviewedAt: "date",
  overwriteAuthorId: "string",
} satisfies FormConfig<ReviewCreate & { overwriteAuthorId: string | null }>;

export type FormStateCreateReview = FormState<typeof formConfig>;

async function createReview(_: unknown, formData: FormData) {
  const formStateRaw = prepareFormState(formConfig, formData);

  const formState = {
    ...formStateRaw,
    // Transform empty string to null for overwriteAuthorId
    overwriteAuthorId:
      formStateRaw.overwriteAuthorId === ""
        ? null
        : formStateRaw.overwriteAuthorId,
  };

  const {
    success,
    error,
    data: reviewParsed,
  } = schemaCreateReview
    .omit({ authorId: true, isCurrent: true })
    .safeParse(formState);

  if (!success) {
    return {
      status: "ERROR",
      formState,
      errors: error.flatten().fieldErrors,
    } satisfies ActionStateError;
  }

  return actionCreateReview(formState, reviewParsed);
}

export function ReviewForm({
  productId,
  initialValues,
  onSuccess,
  showSuccessMessage = true,
  layout,
  userAuthRole,
}: {
  productId: FormStateCreateReview["productId"];
  /** Initial form values for editing (optional) */
  initialValues: {
    rating: FormStateCreateReview["rating"];
    note: FormStateCreateReview["note"];
    urlSource: FormStateCreateReview["urlSource"];
  } | null;
  onSuccess: () => void;
  showSuccessMessage: boolean;
  layout: "grid" | "stacked";
  userAuthRole: Role | null;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [state, formAction, isPendingAction] = useActionState(
    withCallbacks(createReview, {
      onSuccess: () => {
        setRatingSlider(null);

        // reset search params
        router.push(pathname, { scroll: false });

        onSuccess();
      },
    }),
    null,
  );

  const [ratingSlider, setRatingSlider] = useState<number | null>(
    state?.formState.rating ?? initialValues?.rating ?? null,
  );

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <Fieldset className="hidden">
        <Label htmlFor={formKeys.productId}>Product ID</Label>
        <Input
          name={formKeys.productId}
          type="hidden"
          defaultValue={productId ?? undefined}
        />
        <FieldError errorMsg={state?.errors?.productId} />
      </Fieldset>

      <div
        className={cn(
          "grid grid-cols-1 gap-6",
          layout === "grid" ? "lg:grid-cols-2" : "lg:grid-cols-1",
        )}
      >
        <Fieldset className="w-full">
          <Label htmlFor={formKeys.rating} className="text-base font-medium">
            Rating
          </Label>

          <div className="flex flex-col items-center space-y-4">
            <div className="text-2xl font-semibold">
              {ratingSlider !== null ? (
                <NumberFormatted num={ratingSlider} min={1} max={1} />
              ) : (
                "—"
              )}
            </div>

            <StarsForRating
              rating={ratingSlider ?? ratingMiddle}
              size="large"
              onMouseDown={(ratingClicked) => setRatingSlider(ratingClicked)}
            />

            <div className="w-full max-w-xs">
              <Slider
                min={ratingLowest}
                max={ratingHighest}
                step={0.1}
                value={!ratingSlider ? undefined : [ratingSlider]}
                onValueChange={(value) => {
                  const newRating = value[0];
                  if (newRating !== undefined) {
                    setRatingSlider(newRating);
                  }
                }}
              />
            </div>
          </div>

          <Input
            name={formKeys.rating}
            type="hidden"
            value={ratingSlider ?? ""}
            readOnly
          />
          <FieldError errorMsg={state?.errors?.rating} />
        </Fieldset>

        <Fieldset className="w-full">
          <Label htmlFor={formKeys.urlSource} className="text-base font-medium">
            URL source
          </Label>
          <Input
            name={formKeys.urlSource}
            placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            defaultValue={
              state?.formState.urlSource ??
              initialValues?.urlSource ??
              undefined
            }
            className="w-full"
          />
          <FieldError errorMsg={state?.errors?.urlSource} />
        </Fieldset>
      </div>

      <Fieldset className="w-full">
        <Label htmlFor={formKeys.note} className="text-base font-medium">
          Note
        </Label>
        <Textarea
          name={formKeys.note}
          placeholder="Want to note something?"
          defaultValue={
            state?.formState.note ?? initialValues?.note ?? undefined
          }
          className="min-h-[120px] w-full resize-none"
        />
        <FieldError errorMsg={state?.errors?.note} />
      </Fieldset>

      {userAuthRole === "admin" && (
        <Fieldset className="w-full">
          <Label
            htmlFor={formKeys.overwriteAuthorId}
            className="text-base font-medium"
          >
            User ID Override (Admin)
          </Label>
          <Input
            name={formKeys.overwriteAuthorId}
            placeholder="Enter user ID to create review on their behalf"
            defaultValue={state?.formState.overwriteAuthorId ?? undefined}
            className="w-full"
          />
          <ul>
            {usernamesReserved.map((reservedName) => (
              <li
                key={reservedName}
                onClick={() => {
                  navigator.clipboard.writeText(reservedName);
                }}
                className="text-sm text-secondary"
              >
                {reservedName}
              </li>
            ))}
          </ul>
          {/* @ts-expect-error - overwriteAuthorId is dynamically added to errors */}
          <FieldError errorMsg={state?.errors?.overwriteAuthorId} />
        </Fieldset>
      )}

      <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center">
        <Button
          className="w-full px-8 py-3 text-base font-medium shadow-lg sm:w-auto"
          type="submit"
          disabled={isPendingAction}
          size="lg"
        >
          <Save className="mr-2 size-5" />
          {isPendingAction ? `Saving...` : "Save review"}
        </Button>

        {showSuccessMessage && state?.status === "SUCCESS" && (
          <p
            aria-live="polite"
            className="rounded-lg bg-green-50 px-4 py-2 text-green-700 ring-1 ring-green-200"
          >
            Review saved successfully!
          </p>
        )}

        <FieldError
          errorMsg={
            !state?.errors?.productId
              ? undefined
              : "Please select a product above"
          }
        />
      </div>
    </form>
  );
}
