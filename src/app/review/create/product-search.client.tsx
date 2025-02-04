"use client";

import { CategoryBadge } from "@/components/category-badge";
import { FieldError, Fieldset } from "@/components/form";
import { NumberFormatted } from "@/components/number-formatted";
import { StarsForRating } from "@/components/stars-for-rating";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductSearchQuery } from "@/data/queries";
import { minCharsSearch } from "@/data/static";
import {
  prepareFiltersForUpdate,
  stringifySearchParams,
} from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchParamsCreateReview } from "./page";

const searchParamKeys = {
  productName: "productName",
  placeName: "placeName",
} satisfies SearchParamsCreateReview;

export function ProductSearch({
  productsForSearch,
  selectedProductId,
  onProductSelect,
}: {
  productsForSearch: ProductSearchQuery[];
  selectedProductId: number | null;
  onProductSelect: (productId: number | null) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = {
    productName: searchParams.get(searchParamKeys.productName) ?? null,
    placeName: searchParams.get(searchParamKeys.placeName) ?? null,
  } satisfies SearchParamsCreateReview;

  function updateSearchParams(newFilters: SearchParamsCreateReview) {
    const queryString = stringifySearchParams(newFilters);

    const pathWithQuery = queryString ? `${pathname}?${queryString}` : pathname;

    if (
      (!!newFilters.productName &&
        newFilters.productName.length >= minCharsSearch) ||
      (!!newFilters.placeName && newFilters.placeName.length >= minCharsSearch)
    ) {
      router.replace(pathWithQuery, {
        scroll: false,
      });
    } else {
      window.history.replaceState(null, "", pathWithQuery);
    }
  }

  function changeFilters(
    filtersUpdatedPartial: Partial<SearchParamsCreateReview>,
  ) {
    const filtersNew = prepareFiltersForUpdate(filtersUpdatedPartial, filters);
    if (filtersNew) {
      updateSearchParams(filtersNew);
    }
  }

  const hasNoSearch = !filters.productName && !filters.placeName;
  const hasValidSearch =
    (!!filters.productName && filters.productName.length >= minCharsSearch) ||
    (!!filters.placeName && filters.placeName.length >= minCharsSearch);

  return (
    <div className="flex flex-col">
      {/* INPUTS */}
      <div className="flex items-start gap-x-6">
        <Fieldset>
          <Label htmlFor="filter-product-name">Filter by product name</Label>
          <Input
            name="filter-product-name"
            type="text"
            placeholder="e.g. Cheeseburger"
            defaultValue={filters.productName ?? undefined}
            onChange={(e) => changeFilters({ productName: e.target.value })}
          />
          <FieldError
            errorMsg={
              !!filters.productName &&
              filters.productName.length < minCharsSearch
                ? `At least ${minCharsSearch} characters`
                : undefined
            }
          />
        </Fieldset>

        <div className="hitespace-nowrap mt-6">&mdash; & &mdash;</div>

        <Fieldset>
          <Label htmlFor="filter-place-name">Filter by place name</Label>
          <Input
            name="filter-place-name"
            type="text"
            placeholder="e.g. Five Guys"
            defaultValue={filters.placeName ?? undefined}
            onChange={(e) => changeFilters({ placeName: e.target.value })}
          />
          <FieldError
            errorMsg={
              !!filters.placeName && filters.placeName.length < minCharsSearch
                ? `At least ${minCharsSearch} characters`
                : undefined
            }
          />
        </Fieldset>
      </div>

      {/* PRODUCTS LIST */}
      <div className="mt-8 flex items-center overflow-x-auto">
        {hasNoSearch ? (
          <p className="italic">No filters for search.</p>
        ) : (
          hasValidSearch &&
          (productsForSearch.length === 0 ? (
            <p>No products found</p>
          ) : (
            <div className="flex h-full flex-row gap-x-4">
              {productsForSearch.map((product) => (
                <div
                  key={product.id}
                  onClick={() =>
                    onProductSelect(
                      product.id === selectedProductId ? null : product.id,
                    )
                  }
                  className={cn(
                    "flex h-32 w-64 min-w-52 cursor-pointer flex-col justify-between rounded-md p-2 transition-colors active:bg-primary active:text-primary-fg",
                    product.id === selectedProductId
                      ? "bg-primary text-primary-fg"
                      : "bg-secondary text-secondary-fg hover:bg-tertiary hover:text-tertiary-fg",
                  )}
                >
                  <p className="line-clamp-2 min-h-10">{product.name}</p>
                  <div className="flow-row flex items-center justify-start gap-x-1.5">
                    <CategoryBadge size="sm" category={product.category} />
                    <p className="line-clamp-1 text-xs">
                      {product.note ?? <>&nbsp;</>}
                    </p>
                  </div>
                  <div className="flow-row flex items-center justify-start gap-x-1.5">
                    <p className="text-xs">{product.placeName}</p>
                    <p className="text-xs"> | </p>
                    <p className="text-xs">{product.city}</p>
                  </div>
                  <div className="flex flex-row items-center">
                    <NumberFormatted
                      num={product.averageRating}
                      min={2}
                      max={2}
                    />
                    <StarsForRating
                      size="small"
                      rating={product.averageRating}
                    />
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
