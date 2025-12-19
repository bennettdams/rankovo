"use client";

import { CategoryBadge } from "@/components/category-badge";
import { FieldError, Fieldset } from "@/components/form";
import { InfoMessage } from "@/components/info-message";
import { NumberFormatted } from "@/components/number-formatted";
import { SelectionCard, SelectionCardList } from "@/components/selection-card";
import { StarsForRating } from "@/components/stars-for-rating";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductSearchQuery } from "@/data/queries";
import { type Category, type City, minCharsSearch } from "@/data/static";
import {
  prepareFiltersForUpdate,
  useSearchParamsHelper,
} from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { startTransition, useOptimistic } from "react";
import { searchParamKeysCreateReview } from "./create-review-form.client";
import { SearchParamsCreateReview } from "./page";

type SearchParamsProductSearch = Pick<
  SearchParamsCreateReview,
  "product-name" | "place-name"
>;

export function ProductSearch({
  productsForSearch,
  selectedProductId,
  onProductSelect,
}: {
  productsForSearch: ProductSearchQuery[];
  selectedProductId: number | null;
  onProductSelect: (productId: number | null) => void;
}) {
  const { searchParams, updateSearchParams } = useSearchParamsHelper();

  const [filters, setOptimisticFilters] = useOptimistic({
    "product-name":
      searchParams.get(searchParamKeysCreateReview["product-name"]) ?? null,
    "place-name":
      searchParams.get(searchParamKeysCreateReview["place-name"]) ?? null,
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
          (!!filtersNew["product-name"] &&
            filtersNew["product-name"].length >= minCharsSearch) ||
            (!!filtersNew["place-name"] &&
              filtersNew["place-name"].length >= minCharsSearch),
        );
      });
    }
  }

  function handleProductCardClick(productIdClicked: number) {
    onProductSelect(
      productIdClicked === selectedProductId ? null : productIdClicked,
    );
  }

  const hasNoSearch = !filters["product-name"] && !filters["place-name"];
  const hasValidSearch =
    (!!filters["product-name"] &&
      filters["product-name"].length >= minCharsSearch) ||
    (!!filters["place-name"] && filters["place-name"].length >= minCharsSearch);

  return (
    <div className="w-full space-y-6 overflow-hidden">
      {/* Search Filters */}
      <div className="overflow-hidden rounded-xl py-4 sm:py-6">
        <div className="flex w-full min-w-0 flex-col gap-4 md:flex-row md:items-end md:gap-6">
          <Fieldset className="w-full min-w-0 flex-1">
            <Label
              htmlFor="filter-product-name"
              className="text-sm font-medium text-fg"
            >
              Nach Produktname filtern
            </Label>
            <Input
              name="filter-product-name"
              type="text"
              placeholder="z. B. Cheeseburger"
              value={filters["product-name"] ?? ""}
              onChange={(e) =>
                changeFilters({ "product-name": e.target.value })
              }
              className="mt-1 w-full"
            />
            <FieldError
              errorMsg={
                !!filters["product-name"] &&
                filters["product-name"].length < minCharsSearch
                  ? `Mindestens ${minCharsSearch} Zeichen`
                  : undefined
              }
            />
          </Fieldset>

          <div className="hidden items-center justify-center px-4 py-2 text-dark-gray md:flex">
            <span className="text-sm font-medium">UND</span>
          </div>

          <Fieldset className="w-full min-w-0 flex-1">
            <Label
              htmlFor="filter-place-name"
              className="text-sm font-medium text-fg"
            >
              Nach Restaurantname filtern
            </Label>
            <Input
              name="filter-place-name"
              type="text"
              placeholder="z. B. Five Guys"
              value={filters["place-name"] ?? ""}
              onChange={(e) => changeFilters({ "place-name": e.target.value })}
              className="mt-1 w-full"
            />
            <FieldError
              errorMsg={
                !!filters["place-name"] &&
                filters["place-name"].length < minCharsSearch
                  ? `Mindestens ${minCharsSearch} Zeichen`
                  : undefined
              }
            />
          </Fieldset>
        </div>
      </div>

      {/* Results */}
      <div>
        {/* Results Header */}
        {hasValidSearch && (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {productsForSearch.length > 0 && (
                <h3 className="text-lg font-medium text-fg">
                  {`${productsForSearch.length} Produkt${
                    productsForSearch.length === 1 ? "" : "e"
                  } gefunden`}
                </h3>
              )}
            </div>

            {/* Show active filters */}
            {(filters["product-name"] || filters["place-name"]) && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="whitespace-nowrap text-dark-gray">
                  Gefiltert nach:
                </span>
                {filters["product-name"] && (
                  <span className="bg-primary/10 rounded-md px-2 py-1 text-primary">
                    Produkt: &ldquo;{filters["product-name"]}&rdquo;
                  </span>
                )}
                {filters["place-name"] && (
                  <span className="bg-primary/10 rounded-md px-2 py-1 text-primary">
                    Restaurant: &ldquo;{filters["place-name"]}&rdquo;
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <SelectionCardList className="min-h-[200px]">
          {hasNoSearch ? (
            <div className="flex h-48 items-center justify-center rounded-xl">
              <InfoMessage>
                Gib einen Produktnamen oder Restaurantnamen ein, um zu suchen
              </InfoMessage>
            </div>
          ) : (
            hasValidSearch &&
            (productsForSearch.length === 0 ? (
              <div className="flex h-48 items-center justify-center rounded-xl">
                <div className="text-center">
                  <svg
                    className="mx-auto mb-4 size-16 text-dark-gray opacity-40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <InfoMessage>
                    Keine Produkte für deine Suchkriterien gefunden
                  </InfoMessage>
                  <p className="mt-2 text-sm text-dark-gray">
                    Versuche, deine Suchbegriffe anzupassen oder überprüfe die
                    Schreibweise
                  </p>
                </div>
              </div>
            ) : (
              // Responsive Grid with improved breakpoints
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
                    ratingAvg={null}
                    numOfReviews={null}
                  />
                ))}
              </div>
            ))
          )}
        </SelectionCardList>
      </div>
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
      <div className="flex h-full flex-col gap-3">
        {/* Header: Product name and category */}
        <div className="flex-shrink-0">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h4 className="line-clamp-2 flex-1 text-lg font-semibold leading-tight">
              {name}
            </h4>
            <CategoryBadge size="sm" category={category} />
          </div>

          {note && (
            <p className="line-clamp-2 text-sm leading-relaxed">{note}</p>
          )}
        </div>

        {/* Middle: Location - only show if exists */}
        {placeName && (
          <div className="flex items-start gap-2 text-sm">
            <svg
              className="mt-0.5 size-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <div className="min-w-0 flex-1">
              <span className="line-clamp-1">{placeName}</span>
              {city && <span className="text-xs">{city}</span>}
            </div>
          </div>
        )}

        {/* Footer: Rating - always at bottom */}
        <div className="mt-auto flex-shrink-0 pt-2">
          {!ratingAvg ? (
            <span className="text-sm">Noch keine Bewertungen</span>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <NumberFormatted num={ratingAvg} min={1} max={1} />
                {/* prevent primary on primary */}
                <div className={cn(isSelectedProduct && "rounded-sm bg-gray")}>
                  <StarsForRating size="small" rating={ratingAvg} />
                </div>
              </div>
              <span className="text-sm">
                ({numOfReviews} Bewertung{numOfReviews === 1 ? "" : "en"})
              </span>
            </div>
          )}
        </div>
      </div>
    </SelectionCard>
  );
}
