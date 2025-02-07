"use client";

import { FieldError, Fieldset } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { actionCreateReview, type ReviewCreate } from "@/data/actions";
import { ProductSearchQuery } from "@/data/queries";
import { ratingHighest, ratingLowest } from "@/data/static";
import { schemaCreateReview } from "@/db/db-schema";
import { transformFromStringToNumber } from "@/lib/form-utils";
import { FilePlus, Save, Search } from "lucide-react";
import { useActionState, useState } from "react";
import { CreateProductForm } from "./create-product-form.client";
import { ProductSearch } from "./product-search.client";

const formKeys = {
  productId: "productId",
  note: "note",
  rating: "rating",
};

export type FormStateCreateReview = ReturnType<
  typeof prepareFormDataReviewCreate
>;

export function prepareFormDataReviewCreate(formData: FormData) {
  return {
    note: (formData.get(formKeys.note) as string | null) || null,
    productId: transformFromStringToNumber(
      formData.get(formKeys.productId) as string | null,
    ),
    rating: transformFromStringToNumber(
      formData.get(formKeys.rating) as string | null,
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
  productsForSearch,
}: {
  productsForSearch: ProductSearchQuery[];
}) {
  const [state, formAction, isPendingAction] = useActionState(
    createReview,
    null,
  );
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );

  return (
    <div className="flex flex-col gap-y-16">
      <div>
        <h2 className="mb-4 flex items-center text-2xl text-secondary">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary text-3xl leading-none text-primary-fg">
            1
          </span>
          <span className="ml-4">Select a product</span>
        </h2>

        <Tabs defaultValue="search">
          <TabsList className="mb-10 grid w-96 grid-cols-2">
            <TabsTrigger value="search">
              <Search className="size-5" />
              <span className="ml-2">Search existing</span>
            </TabsTrigger>
            <TabsTrigger value="create">
              <FilePlus className="size-5" />
              <span className="ml-2">Create new</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="search">
            <ProductSearch
              productsForSearch={productsForSearch}
              selectedProductId={selectedProductId}
              onProductSelect={setSelectedProductId}
            />
          </TabsContent>
          <TabsContent value="create">
            <CreateProductForm />
          </TabsContent>
        </Tabs>

        <FieldError
          errorMsg={
            !state?.errors?.productId ? undefined : "Please select a product"
          }
        />
      </div>

      <div>
        <h2 className="mb-4 flex items-center text-2xl text-secondary">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary text-3xl leading-none text-primary-fg">
            2
          </span>
          <span className="ml-4">Add your verdict</span>
        </h2>

        <form
          action={(formData) => {
            setSelectedProductId(null);
            formAction(formData);
          }}
          className="flex flex-col gap-y-6"
          noValidate
        >
          <Fieldset className="hidden">
            <Label htmlFor={formKeys.productId}>Product ID</Label>
            <Input
              name={formKeys.productId}
              type="hidden"
              placeholder="Product"
              defaultValue={selectedProductId ?? undefined}
            />
            <FieldError errorMsg={state?.errors?.productId} />
          </Fieldset>

          <Fieldset>
            <Label htmlFor={formKeys.rating}>Rating</Label>
            <Input
              name={formKeys.rating}
              type="number"
              className="w-32"
              lang="en"
              placeholder={`${ratingLowest} to ${ratingHighest}`}
              defaultValue={state?.values?.rating ?? undefined}
            />
            <FieldError errorMsg={state?.errors?.rating} />
          </Fieldset>

          <Fieldset>
            <Label htmlFor={formKeys.note}>Note</Label>
            <Textarea
              name={formKeys.note}
              placeholder="Want to note something?"
              defaultValue={state?.values?.note ?? undefined}
            />
            <FieldError errorMsg={state?.errors?.note} />
          </Fieldset>

          <Button className="w-min" type="submit" disabled={isPendingAction}>
            <Save /> {isPendingAction ? "Saving..." : "Save"}
          </Button>

          {state?.success && (
            <p aria-live="polite" className="text-xl text-green-700">
              Review saved successfully!
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
