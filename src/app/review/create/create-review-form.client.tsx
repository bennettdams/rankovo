"use client";

import { ReviewForm } from "@/components/review-form.client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type ProductCreatedByAction } from "@/data/actions";
import type { PlaceSearchQuery, RankingQuery } from "@/data/queries";
import { cn } from "@/lib/utils";
import { FilePlus, Search } from "lucide-react";
import { useState } from "react";
import { CreateProductForm } from "./create-product-form.client";
import type { SearchParamsCreateReview } from "./page";
import { ProductSearch } from "./product-search.client";

export const searchParamKeysCreateReview = {
  "product-name": "product-name",
  "place-name": "place-name",
} satisfies SearchParamsCreateReview;

const tabs = {
  search: "search",
  create: "create",
};

export function CreateReviewForm({
  productsForSearch,
  placesForSearch,
}: {
  productsForSearch: RankingQuery[];
  placesForSearch: PlaceSearchQuery[];
}) {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [tabActive, setTabActive] = useState<string>(tabs.search);

  function handleProductCreation(productCreated: ProductCreatedByAction) {
    setSelectedProductId(productCreated.id);
    setTabActive(tabs.search);
  }

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
      </StepSection>

      {/* Step 2: Review Details Card */}
      <StepSection
        stepNumber={2}
        title="Add your verdict"
        description="Rate the product and share your thoughts"
      >
        <ReviewForm
          initialValues={null}
          productId={selectedProductId}
          onSuccess={() => setSelectedProductId(null)}
          showSuccessMessage={true}
          layout="grid"
        />
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
