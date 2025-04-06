"use client";

import { FieldError, Fieldset } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  actionCreateReview,
  type ProductCreatedByAction,
  type ReviewCreate,
} from "@/data/actions";
import type { PlaceSearchQuery, ProductSearchQuery } from "@/data/queries";
import { ratingHighest, ratingLowest } from "@/data/static";
import { schemaCreateReview } from "@/db/db-schema";
import { type ActionStateError, withCallbacks } from "@/lib/action-utils";
import {
  type FormConfig,
  type FormState,
  prepareFormState,
} from "@/lib/form-utils";
import { FilePlus, Save, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useActionState, useCallback, useState } from "react";
import { CreateProductForm } from "./create-product-form.client";
import type { SearchParamsCreateReview } from "./page";
import { ProductSearch } from "./product-search.client";

export const searchParamKeysCreateReview = {
  productName: "productName",
  placeName: "placeName",
} satisfies SearchParamsCreateReview;

const formKeys = {
  productId: "productId",
  note: "note",
  rating: "rating",
  reviewedAt: "reviewedAt",
  urlSource: "urlSource",
} satisfies Record<keyof typeof formConfig, string>;

const formConfig = {
  productId: "number",
  note: "string",
  rating: "number",
  urlSource: "string",
  reviewedAt: "date",
} satisfies FormConfig<ReviewCreate>;

export type FormStateCreateReview = FormState<typeof formConfig>;

const tabs = {
  search: "search",
  create: "create",
};

async function createReview(_: unknown, formData: FormData) {
  const formState = prepareFormState(formConfig, formData);

  const {
    success,
    error,
    data: reviewParsed,
  } = schemaCreateReview.omit({ authorId: true }).safeParse(formState);

  if (!success) {
    return {
      status: "ERROR",
      formState,
      errors: error.flatten().fieldErrors,
      data: null,
    } satisfies ActionStateError;
  }

  return actionCreateReview(formState, reviewParsed);
}

export function CreateReviewForm({
  productsForSearch,
  placesForSearch,
}: {
  productsForSearch: ProductSearchQuery[];
  placesForSearch: PlaceSearchQuery[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [state, formAction, isPendingAction] = useActionState(
    withCallbacks(createReview, {
      onSuccess: () => {
        setSelectedProductId(null);
        // reset search params
        router.push(pathname, { scroll: false });
      },
    }),
    null,
  );
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [tabActive, setTabActive] = useState<string>(tabs.search);

  const handleProductCreation = useCallback(
    (productCreated: ProductCreatedByAction) => {
      setSelectedProductId(productCreated.id);
      setTabActive(tabs.search);
    },
    [],
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

        <Tabs
          value={tabActive}
          onValueChange={(tabSelected) => setTabActive(tabSelected)}
        >
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
              onProductSelect={(productIdSelected) =>
                setSelectedProductId((prev) =>
                  prev === productIdSelected ? null : productIdSelected,
                )
              }
            />
          </TabsContent>
          <TabsContent value="create">
            <CreateProductForm
              placesForSearch={placesForSearch}
              onCreatedProduct={handleProductCreation}
            />
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

        <form action={formAction} className="flex flex-col gap-y-6" noValidate>
          <Fieldset className="hidden">
            <Label htmlFor={formKeys.productId}>Product ID</Label>
            <Input
              name={formKeys.productId}
              type="hidden"
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
              defaultValue={state?.formState?.rating ?? undefined}
            />
            <FieldError errorMsg={state?.errors?.rating} />
          </Fieldset>

          <Fieldset>
            <Label htmlFor={formKeys.urlSource}>URL source</Label>
            <Input
              name={formKeys.urlSource}
              placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              defaultValue={state?.formState?.urlSource ?? undefined}
            />
            <FieldError errorMsg={state?.errors?.urlSource} />
          </Fieldset>

          <Fieldset>
            <Label htmlFor={formKeys.note}>Note</Label>
            <Textarea
              name={formKeys.note}
              placeholder="Want to note something?"
              defaultValue={state?.formState?.note ?? undefined}
            />
            <FieldError errorMsg={state?.errors?.note} />
          </Fieldset>

          <Button className="w-min" type="submit" disabled={isPendingAction}>
            <Save /> {isPendingAction ? "Saving review..." : "Save review"}
          </Button>

          {state?.status === "SUCCESS" && (
            <p aria-live="polite" className="text-xl text-green-700">
              Review saved successfully!
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
