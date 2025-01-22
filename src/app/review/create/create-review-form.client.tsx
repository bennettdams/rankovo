"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { actionCreateReview, type ReviewCreate } from "@/data/actions";
import { ProductSearchQuery } from "@/data/queries";
import {
  minCharsSearchProduct,
  ratingHighest,
  ratingLowest,
} from "@/data/static";
import { schemaCreateReview } from "@/db/db-schema";
import { createQueryString } from "@/lib/url-state";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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

export function CreateReviewForm({
  products,
}: {
  products: ProductSearchQuery[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [state, formAction, isPendingAction] = useActionState(
    createReview,
    null,
  );

  const query = searchParams.get("q") ?? null;

  function updateSearchTerm(productName: string) {
    if (productName === "") {
      router.replace(pathname);
    } else if (productName.length < minCharsSearchProduct) {
      window.history.replaceState(
        null,
        "",
        `?${createQueryString("q", productName, searchParams)}`,
      );
    } else {
      router.replace(
        pathname + "?" + createQueryString("q", productName, searchParams),
        {
          scroll: false,
        },
      );
    }
  }

  return (
    <div>
      <h1 className="text-center text-3xl text-primary">Create Review</h1>

      <div>
        <h2>1. Search for a product</h2>

        <Fieldset>
          <Label htmlFor="filter-product-name">Filter by product name</Label>
          <Input
            name="filter-product-name"
            type="text"
            placeholder="e.g. Cheeseburger"
            defaultValue={query ?? undefined}
            onChange={(e) => updateSearchTerm(e.target.value)}
          />
        </Fieldset>

        {!!query && (
          <div className="mt-4">
            {query.length < minCharsSearchProduct ? (
              <p>Enter more characters</p>
            ) : products.length === 0 ? (
              <p>No products found</p>
            ) : (
              <div className="w-30 flex flex-row flex-wrap gap-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="grid h-32 w-60 cursor-pointer rounded-md bg-white p-2 hover:bg-secondary hover:text-secondary-fg"
                  >
                    <p className="text-xl">{product.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <Fieldset>
          <Label htmlFor="filter-place-name">Filter by place name</Label>
          <Input
            name="filter-place-name"
            type="text"
            placeholder="e.g. Five Guys"
            defaultValue={query ?? undefined}
            onChange={(e) => updateSearchTerm(e.target.value)}
          />
        </Fieldset>
      </div>

      <div>
        <h2>2. Add your verdict</h2>

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
