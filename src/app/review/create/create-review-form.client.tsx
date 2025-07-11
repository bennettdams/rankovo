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
import type { PlaceSearchQuery, RankingQuery } from "@/data/queries";
import { ratingHighest, ratingLowest } from "@/data/static";
import { schemaCreateReview } from "@/db/db-schema";
import { type ActionStateError, withCallbacks } from "@/lib/action-utils";
import {
  type FormConfig,
  type FormState,
  prepareFormState,
} from "@/lib/form-utils";
import { cn } from "@/lib/utils";
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
  } = schemaCreateReview
    .omit({ authorId: true, isCurrent: true })
    .safeParse(formState);

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
  productsForSearch: RankingQuery[];
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
    <div className="space-y-20">
      {/* Step 1: Product Selection Card */}
      <StepSection
        stepNumber={1}
        title="Select a product"
        description="Choose from existing products or create a new one"
      >
        <Tabs
          value={tabActive}
          onValueChange={(tabSelected) => setTabActive(tabSelected)}
        >
          <TabsList className="mb-6 w-full sm:mb-8 sm:w-auto sm:max-w-md">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="size-4" />
              <span className="hidden sm:inline">Search existing</span>
              <span className="sm:hidden">Search</span>
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <FilePlus className="size-4" />
              <span className="hidden sm:inline">Create new</span>
              <span className="sm:hidden">Create</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-0">
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

          <TabsContent value="create" className="mt-0">
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
      </StepSection>

      {/* Step 2: Review Details Card */}
      <StepSection
        stepNumber={2}
        title="Add your verdict"
        description="Rate the product and share your thoughts"
      >
        <form action={formAction} className="space-y-6" noValidate>
          <Fieldset className="hidden">
            <Label htmlFor={formKeys.productId}>Product ID</Label>
            <Input
              name={formKeys.productId}
              type="hidden"
              defaultValue={selectedProductId ?? undefined}
            />
            <FieldError errorMsg={state?.errors?.productId} />
          </Fieldset>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Fieldset className="w-full">
              <Label
                htmlFor={formKeys.rating}
                className="text-base font-medium"
              >
                Rating
              </Label>
              <Input
                name={formKeys.rating}
                type="number"
                className="w-full max-w-32"
                lang="en"
                placeholder={`${ratingLowest} to ${ratingHighest}`}
                defaultValue={state?.formState?.rating ?? undefined}
              />
              <FieldError errorMsg={state?.errors?.rating} />
            </Fieldset>

            <Fieldset className="w-full">
              <Label
                htmlFor={formKeys.urlSource}
                className="text-base font-medium"
              >
                URL source
              </Label>
              <Input
                name={formKeys.urlSource}
                placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                defaultValue={state?.formState?.urlSource ?? undefined}
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
              defaultValue={state?.formState?.note ?? undefined}
              className="min-h-[120px] w-full resize-none"
            />
            <FieldError errorMsg={state?.errors?.note} />
          </Fieldset>

          <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center">
            <Button
              className="w-full px-8 py-3 text-base font-medium shadow-lg sm:w-auto"
              type="submit"
              disabled={isPendingAction}
              size="lg"
            >
              <Save className="mr-2 size-5" />
              {isPendingAction ? "Saving review..." : "Save review"}
            </Button>

            {state?.status === "SUCCESS" && (
              <p
                aria-live="polite"
                className="rounded-lg bg-green-50 px-4 py-2 text-green-700 ring-1 ring-green-200"
              >
                Review saved successfully!
              </p>
            )}
          </div>
        </form>
      </StepSection>
    </div>
  );
}

function StepSection({
  stepNumber,
  title,
  description,
  children,
  className,
}: {
  stepNumber: number;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5",
        className,
      )}
    >
      <div className="bg-gradient-to-r from-[#eb8c21]/40 to-[#6c3e6e]/40 px-4 py-6 sm:px-8">
        <h2 className="flex items-center text-2xl font-semibold text-secondary">
          <span className="mr-4 flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-xl font-bold text-white shadow-lg">
            {stepNumber}
          </span>
          <div>
            <span>{title}</span>
            <p className="mt-1 text-sm font-normal text-dark-gray">
              {description}
            </p>
          </div>
        </h2>
      </div>

      <div className="p-4 sm:p-8">{children}</div>
    </div>
  );
}
