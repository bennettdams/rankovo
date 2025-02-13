"use client";

import { CategoryBadge } from "@/components/category-badge";
import { FieldError, Fieldset } from "@/components/form";
import { NumberFormatted } from "@/components/number-formatted";
import { StarsForRating } from "@/components/stars-for-rating";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type ProductCreatedAction } from "@/data/actions";
import { ProductSearchQuery } from "@/data/queries";
import { type Category, type City, minCharsSearch } from "@/data/static";
import {
  prepareFiltersForUpdate,
  stringifySearchParams,
} from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useOptimistic } from "react";
import { SearchParamsCreateReview } from "./page";

const searchParamKeys = {
  productName: "productName",
  placeName: "placeName",
} satisfies SearchParamsCreateReview;

export function ProductSearch({
  productsForSearch,
  productCreated,
  selectedProductId,
  onProductSelect,
}: {
  productsForSearch: ProductSearchQuery[];
  productCreated: ProductCreatedAction | null;
  selectedProductId: number | null;
  onProductSelect: (productId: number | null) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setOptimisticFilters] = useOptimistic({
    productName: searchParams.get(searchParamKeys.productName) ?? null,
    placeName: searchParams.get(searchParamKeys.placeName) ?? null,
  } satisfies SearchParamsCreateReview);

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
      startTransition(() => {
        setOptimisticFilters(filtersNew);
        updateSearchParams(filtersNew);
      });
    }
  }

  function handleProductCardClick(productIdClicked: number) {
    onProductSelect(
      productIdClicked === selectedProductId ? null : productIdClicked,
    );
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
            value={filters.productName ?? ""}
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
            value={filters.placeName ?? ""}
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
        {!!productCreated ? (
          <ProductCard
            key={productCreated.id}
            isSelectedProduct={productCreated.id === selectedProductId}
            onClick={() => handleProductCardClick(productCreated.id)}
            productId={productCreated.id}
            name={productCreated.name}
            category={productCreated.category}
            note={productCreated.note}
            placeName={productCreated.placeName}
            city={productCreated.city}
            averageRating={null}
          />
        ) : hasNoSearch ? (
          <p className="italic">No filters for search.</p>
        ) : (
          hasValidSearch &&
          (productsForSearch.length === 0 ? (
            <p>No products found</p>
          ) : (
            <div className="flex h-full flex-row gap-x-4">
              {productsForSearch.map((product) => (
                <ProductCard
                  key={product.id}
                  isSelectedProduct={product.id === selectedProductId}
                  onClick={() => handleProductCardClick(product.id)}
                  productId={product.id}
                  name={product.name}
                  category={product.category}
                  note={product.note}
                  placeName={product.placeName}
                  city={product.city}
                  averageRating={product.averageRating}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ProductCard({
  isSelectedProduct,
  onClick,
  productId,
  name,
  category,
  note,
  placeName,
  city,
  averageRating,
}: {
  isSelectedProduct: boolean;
  onClick: () => void;
  productId: number;
  name: string;
  category: Category;
  note: string | null;
  placeName: string | null;
  city: City | null;
  averageRating: number | null;
}) {
  return (
    <div
      key={productId}
      onClick={onClick}
      className={cn(
        "flex h-32 w-64 min-w-52 cursor-pointer flex-col justify-between rounded-md p-2 transition-colors active:bg-primary active:text-primary-fg",
        isSelectedProduct
          ? "bg-primary text-primary-fg"
          : "bg-secondary text-secondary-fg hover:bg-tertiary hover:text-tertiary-fg",
      )}
    >
      <p className="line-clamp-2 min-h-10">{name}</p>
      <div className="flow-row flex items-center justify-start gap-x-1.5">
        <CategoryBadge size="sm" category={category} />
        <p className="line-clamp-1 text-xs">{note ?? <>&nbsp;</>}</p>
      </div>
      <div className="flow-row flex items-center justify-start gap-x-1.5">
        {!placeName ? (
          <p>&nbsp;</p>
        ) : (
          <>
            <p className="text-xs">{placeName}</p>
            {!!city && (
              <>
                <p className="text-xs"> | </p>
                <p className="text-xs">{city}</p>
              </>
            )}
          </>
        )}
      </div>
      <div className="flex flex-row items-center">
        {!averageRating ? (
          <p>&nbsp;</p>
        ) : (
          <>
            <NumberFormatted num={averageRating} min={2} max={2} />
            <StarsForRating size="small" rating={averageRating} />
          </>
        )}
      </div>
    </div>
  );
}
