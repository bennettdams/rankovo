"use client";

import { CategoryBadge } from "@/components/category-badge";
import { FieldError, Fieldset } from "@/components/form";
import { InfoMessage } from "@/components/info-message";
import { NumberFormatted } from "@/components/number-formatted";
import { SelectionCard, SelectionCardList } from "@/components/selection-card";
import { StarsForRating } from "@/components/stars-for-rating";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Ranking } from "@/data/queries";
import { type Category, type City, minCharsSearch } from "@/data/static";
import {
  prepareFiltersForUpdate,
  useSearchParamsHelper,
} from "@/lib/url-state";
import { startTransition, useOptimistic } from "react";
import { searchParamKeysCreateReview } from "./create-review-form.client";
import { SearchParamsCreateReview } from "./page";

type SearchParamsProductSearch = Pick<
  SearchParamsCreateReview,
  "productName" | "placeName"
>;

export function ProductSearch({
  productsForSearch,
  selectedProductId,
  onProductSelect,
}: {
  productsForSearch: Ranking[];
  selectedProductId: number | null;
  onProductSelect: (productId: number | null) => void;
}) {
  const { searchParams, updateSearchParams } = useSearchParamsHelper();

  const [filters, setOptimisticFilters] = useOptimistic({
    productName:
      searchParams.get(searchParamKeysCreateReview.productName) ?? null,
    placeName: searchParams.get(searchParamKeysCreateReview.placeName) ?? null,
  } satisfies SearchParamsProductSearch);

  function changeFilters(
    filtersUpdatedPartial: Partial<SearchParamsProductSearch>,
  ) {
    const filtersNew = prepareFiltersForUpdate(filtersUpdatedPartial, filters);
    if (filtersNew) {
      startTransition(() => {
        setOptimisticFilters(filtersNew);
        updateSearchParams(
          filtersNew,
          (!!filtersNew.productName &&
            filtersNew.productName.length >= minCharsSearch) ||
            (!!filtersNew.placeName &&
              filtersNew.placeName.length >= minCharsSearch),
        );
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
      <div className="flex flex-col items-start gap-x-6 md:flex-row">
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

        <div className="my-3 w-full whitespace-nowrap text-center text-lg md:mt-6 md:w-auto">
          &mdash; & &mdash;
        </div>

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
      <SelectionCardList className="mt-8 flex items-center overflow-x-auto">
        {hasNoSearch ? (
          <InfoMessage>No filters for search.</InfoMessage>
        ) : (
          hasValidSearch &&
          (productsForSearch.length === 0 ? (
            <InfoMessage>No products found</InfoMessage>
          ) : (
            <div className="flex h-full flex-row gap-x-4">
              {productsForSearch.map((product) => (
                <ProductCard
                  key={product.productId}
                  isSelectedProduct={product.productId === selectedProductId}
                  onClick={() => handleProductCardClick(product.productId)}
                  name={product.productName}
                  category={product.productCategory}
                  note={product.productNote}
                  placeName={product.placeName}
                  city={product.city}
                  ratingAvg={product.ratingAvg}
                  numOfReviews={product.numOfReviews}
                />
              ))}
            </div>
          ))
        )}
      </SelectionCardList>
    </div>
  );
}

function ProductCard({
  isSelectedProduct,
  onClick,
  name,
  category,
  note,
  placeName,
  city,
  ratingAvg,
  numOfReviews,
}: {
  isSelectedProduct: boolean;
  onClick: () => void;
  name: string;
  category: Category;
  note: string | null;
  placeName: string | null;
  city: City | null;
  ratingAvg: number | null;
  numOfReviews: number | null;
}) {
  return (
    <SelectionCard isSelected={isSelectedProduct} onClick={onClick}>
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
        {!ratingAvg ? (
          <p>No rating yet</p>
        ) : (
          <>
            <NumberFormatted num={ratingAvg} min={2} max={2} />
            <StarsForRating size="small" rating={ratingAvg} />
            <span className="ml-2 text-sm">({numOfReviews})</span>
          </>
        )}
      </div>
    </SelectionCard>
  );
}
