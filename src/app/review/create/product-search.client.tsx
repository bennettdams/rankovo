"use client";

import { FieldError, Fieldset } from "@/components/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductSearchQuery } from "@/data/queries";
import { minCharsSearch } from "@/data/static";
import { stringifySearchParams } from "@/lib/url-state";
import { cn, isKeyOfObj } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchParamsCreateReview } from "./page";

const searchParamKeys = {
  productName: "productName",
  placeName: "placeName",
} satisfies SearchParamsCreateReview;

export function ProductSearch({
  products,
  selectedProductId,
  onProductSelect,
}: {
  products: ProductSearchQuery[];
  selectedProductId: number | null;
  onProductSelect: (productId: number) => void;
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
    // a bit of overhead, but this way we save a network request (as updating search params also reloads the RSC page)
    const hasChanged = Object.keys(filtersUpdatedPartial).some((key) => {
      if (isKeyOfObj(filters, key)) {
        return filters[key] !== filtersUpdatedPartial[key];
      }
    });

    if (hasChanged) {
      const filtersMerged = { ...filters, ...filtersUpdatedPartial };
      updateSearchParams(filtersMerged);
    }
  }

  return (
    <div className="mt-10 flex flex-row">
      <div>
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

      <div className="ml-10 flex items-center overflow-x-auto">
        {(!!filters.productName || !!filters.placeName) &&
          (products.length === 0 ? (
            <p>No products found</p>
          ) : (
            <div className="flex h-full flex-row gap-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => onProductSelect(product.id)}
                  className={cn(
                    "h-32 w-52 min-w-52 cursor-pointer rounded-md p-2 transition-colors active:bg-primary active:text-primary-fg",
                    product.id === selectedProductId
                      ? "bg-secondary text-secondary-fg"
                      : "bg-gray hover:bg-secondary hover:text-secondary-fg",
                  )}
                >
                  <p className="text-xs">{product.name}</p>
                  <p className="text-xs">{product.category}</p>
                  <p className="text-xs">{product.note}</p>
                  <p className="text-xs">{product.placeName}</p>
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}
