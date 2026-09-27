"use client";

import { FieldError, Fieldset } from "@/components/form";
import { RatingInput } from "@/components/rating-input.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { actionCreateReview } from "@/data/actions";
import { type Role, usernamesReserved } from "@/data/static";
import { type ReviewCreate, schemaCreateReview } from "@/db/db-schema";
import {
  type ActionStateError,
  getActionRootErrors,
  withCallbacks,
} from "@/lib/action-utils";
import { isRatingInRange } from "@/lib/business-utils";
import {
  type FormConfig,
  type FormState,
  prepareFormState,
} from "@/lib/form-utils";
import { Save } from "lucide-react";
import { useActionState, useState } from "react";
import { z } from "zod";

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
} satisfies FormConfig<ReviewCreate>;

export type FormStateCreateReview = FormState<typeof formConfig>;

type ReviewFormProps = {
  productId: FormStateCreateReview["productId"];
  /** Initial form values for editing (optional) */
  initialValues: {
    rating: FormStateCreateReview["rating"];
    note: FormStateCreateReview["note"];
    urlSource: FormStateCreateReview["urlSource"];
  } | null;
  onSuccess: (successAt: string) => void;
  showSuccessMessage?: boolean;
  userAuthRole: Role | null;
};

export function ReviewForm({
  productId,
  initialValues,
  onSuccess,
  showSuccessMessage: showSuccessMessageExternal = true,
  userAuthRole,
}: ReviewFormProps) {
  const [formKey, setFormKey] = useState(0);
  const [showSuccessMessage, setShowSuccess] = useState(false);
  return (
    <ReviewFormInternal
      key={formKey}
      productId={productId}
      initialValues={initialValues}
      onSuccess={(successAt) => {
        setFormKey((prev) => prev + 1);
        setShowSuccess(true);
        onSuccess(successAt);
      }}
      onError={() => setShowSuccess(false)}
      showSuccessMessage={
        // We honor the props if they want to hide it, otherwise use the showSuccess state.
        // Without this, the success message would never show because the "state" of the server action is also reset.
        showSuccessMessageExternal === false ? false : showSuccessMessage
      }
      userAuthRole={userAuthRole}
    />
  );
}

function ReviewFormInternal({
  productId,
  initialValues,
  onSuccess,
  onError,
  showSuccessMessage = true,
  userAuthRole,
}: ReviewFormProps & { onError: () => void }) {
  async function createReview(_: unknown, formData: FormData) {
    const formState = {
      ...prepareFormState(formConfig, formData),
      productId,
    };

    const {
      success,
      error,
      data: reviewParsed,
    } = schemaCreateReview.safeParse(formState);

    if (!success) {
      return {
        status: "ERROR",
        formState,
        errors: z.flattenError(error).fieldErrors,
      } satisfies ActionStateError;
    }

    return actionCreateReview(formState, reviewParsed);
  }

  const [ratingSlider, setRatingSlider] = useState<number | null>(
    initialValues?.rating ?? null,
  );
  const [showUrlSource, setShowUrlSource] = useState(
    () => !!initialValues?.urlSource,
  );

  const [state, formAction, isPendingAction] = useActionState(
    withCallbacks(createReview, {
      onSuccess: () => {
        setRatingSlider(null);
        onSuccess(new Date().toISOString());
      },
      onError,
    }),
    null,
  );

  // A failed submit resets the form to these defaults. Once submitted, the
  // submitted value wins, so a field the user cleared doesn't refill.
  function valueAfterSubmit(key: "note" | "urlSource") {
    const value = state ? state.formState[key] : initialValues?.[key];
    return value ?? undefined;
  }

  const ratingError = isRatingInRange(ratingSlider)
    ? undefined
    : state?.errors?.rating;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <Fieldset className="w-full">
        <Label htmlFor={formKeys.rating} className="text-base font-medium">
          Bewertung
        </Label>

        <RatingInput value={ratingSlider} onChange={setRatingSlider} />

        <Input
          name={formKeys.rating}
          type="hidden"
          value={ratingSlider ?? ""}
          readOnly
        />
        <FieldError errorMsg={ratingError} />
      </Fieldset>

      <Fieldset className="w-full">
        <Label htmlFor={formKeys.note} className="text-base font-medium">
          Notiz
        </Label>
        <Textarea
          name={formKeys.note}
          placeholder="Besonderheiten, Anmerkungen, .."
          defaultValue={valueAfterSubmit("note")}
          className="min-h-30 w-full resize-none"
        />
        <FieldError errorMsg={state?.errors?.note} />
      </Fieldset>

      {showUrlSource ? (
        <Fieldset className="w-full">
          <div className="mb-1 flex items-center justify-between gap-3">
            <Label
              htmlFor={formKeys.urlSource}
              className="text-base font-medium"
            >
              URL-Quelle
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowUrlSource(false)}
            >
              Entfernen
            </Button>
          </div>
          <Input
            id={formKeys.urlSource}
            name={formKeys.urlSource}
            placeholder="z.B. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            defaultValue={valueAfterSubmit("urlSource")}
            className="w-full"
          />
          <FieldError errorMsg={state?.errors?.urlSource} />
        </Fieldset>
      ) : (
        <Button
          type="button"
          variant="ghost"
          className="px-0 text-secondary"
          onClick={() => setShowUrlSource(true)}
        >
          Quelle hinzufügen
        </Button>
      )}

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
          <FieldError errorMsg={state?.errors?.overwriteAuthorId} />
        </Fieldset>
      )}

      <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center">
        <Button
          className="w-full px-8 py-3 text-base font-medium shadow-lg sm:w-auto"
          type="submit"
          disabled={isPendingAction || productId == null}
          size="lg"
        >
          <Save className="mr-2 size-5" />
          {isPendingAction ? `Wird gespeichert...` : "Bewertung speichern"}
        </Button>

        {showSuccessMessage && (
          <p
            aria-live="polite"
            className="rounded-lg bg-green-50 px-4 py-2 text-green-700 ring-1 ring-green-200"
          >
            Bewertung erfolgreich gespeichert!
          </p>
        )}

        <FieldError
          errorMsg={
            !state?.errors?.productId
              ? undefined
              : "Bitte wähle oben ein Produkt aus"
          }
        />
        <FieldError errorMsg={getActionRootErrors(state)} />
      </div>
    </form>
  );
}
