import { Box } from "@/components/box";
import { CategoryBadge } from "@/components/category-badge";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queries } from "@/data/queries";
import { minCharsSearch } from "@/data/static";
import { assertAdmin } from "@/lib/auth-server";
import { formatCitiesFull } from "@/lib/cities";
import { routes } from "@/lib/navigation";
import {
  lastPage,
  pageFromSearchParam,
  pageSearchParam,
  shiftPage,
  totalPages,
  type Page,
} from "@/lib/pagination";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PlaceEditor, ProductEditor } from "./admin.client";
import {
  adminHref,
  emptyAdminParams,
  parseSearchParamsAdmin,
  searchParamKeysAdmin,
  type SearchParamsAdmin,
} from "./admin.shared";

export const metadata: Metadata = {
  title: "Rankovo | Verwaltung",
};

function redirectIfPageOutOfRange(
  page: Page,
  total: number,
  pageSize: number,
  params: SearchParamsAdmin,
) {
  const pageCount = totalPages(total, pageSize);
  if (page > pageCount) {
    redirect(
      adminHref({
        ...params,
        page: pageSearchParam(lastPage(pageCount)),
        productId: null,
        placeId: null,
      }),
    );
  }
}

export default function PageAdmin({
  searchParams,
}: {
  searchParams: Promise<unknown>;
}) {
  return (
    <Suspense
      fallback={
        <p className="px-4 py-16 text-center">Verwaltung wird geladen …</p>
      }
    >
      <AdminContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminContent({
  searchParams,
}: {
  searchParams: Promise<unknown>;
}) {
  await assertAdmin();
  const params = parseSearchParamsAdmin(await searchParams);
  const isPlacesTab = params.tab === "places";

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16">
      <SectionHeader>Verwaltung</SectionHeader>

      <nav
        aria-label="Verwaltungsbereiche"
        className="mb-6 flex justify-center gap-2"
      >
        <Button asChild variant={isPlacesTab ? "outline" : "default"}>
          <Link
            aria-current={isPlacesTab ? undefined : "page"}
            href={adminHref(emptyAdminParams())}
          >
            Produkte
          </Link>
        </Button>
        <Button asChild variant={isPlacesTab ? "default" : "outline"}>
          <Link
            aria-current={isPlacesTab ? "page" : undefined}
            href={adminHref(emptyAdminParams({ tab: "places" }))}
          >
            Restaurants
          </Link>
        </Button>
      </nav>

      {isPlacesTab ? (
        <PlacePanel params={params} />
      ) : (
        <ProductPanel params={params} />
      )}
    </div>
  );
}

function AdminSearchForm({ params }: { params: SearchParamsAdmin }) {
  const isPlacesTab = params.tab === "places";
  const searchKey = isPlacesTab
    ? searchParamKeysAdmin["place-search"]
    : searchParamKeysAdmin["product-search"];
  const searchLabel = isPlacesTab ? "Restaurantname" : "Produktname";

  return (
    <form action={routes.admin} className="flex gap-2" method="get">
      {/* Native GET replaces the query string. Without this, search from the
          places tab drops `tab=places` and the page falls back to products. */}
      {isPlacesTab && (
        <input name={searchParamKeysAdmin.tab} type="hidden" value="places" />
      )}
      <Input
        aria-label={searchLabel}
        defaultValue={params[searchKey] ?? ""}
        maxLength={255}
        name={searchKey}
        placeholder={searchLabel}
        type="search"
      />
      <Button type="submit">Suchen</Button>
    </form>
  );
}

function AdminPagination({
  params,
  total,
  pageSize,
}: {
  params: SearchParamsAdmin;
  total: number;
  pageSize: number;
}) {
  const page = pageFromSearchParam(params.page);
  const pageCount = totalPages(total, pageSize);

  return (
    <nav
      aria-label="Seitennavigation der Admin-Liste"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-sm text-dark-gray">
        Seite {page} von {pageCount} · {total} Einträge
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Button asChild size="sm" variant="outline">
            <Link
              href={adminHref({
                ...params,
                page: pageSearchParam(shiftPage(page, -1)),
                productId: null,
                placeId: null,
              })}
            >
              Zurück
            </Link>
          </Button>
        ) : (
          <Button disabled size="sm" variant="outline">
            Zurück
          </Button>
        )}

        {page < pageCount ? (
          <Button asChild size="sm" variant="outline">
            <Link
              href={adminHref({
                ...params,
                page: pageSearchParam(shiftPage(page, 1)),
                productId: null,
                placeId: null,
              })}
            >
              Weiter
            </Link>
          </Button>
        ) : (
          <Button disabled size="sm" variant="outline">
            Weiter
          </Button>
        )}
      </div>
    </nav>
  );
}

async function ProductPanel({ params }: { params: SearchParamsAdmin }) {
  const page = pageFromSearchParam(params.page);
  const placeSearch = params["place-search"];
  const shouldSearchPlaces =
    params.productId !== null &&
    placeSearch !== null &&
    placeSearch.length >= minCharsSearch;
  const [products, selectedProduct, placesSearch] = await Promise.all([
    queries.adminProducts({
      q: params["product-search"],
      page: params.page,
    }),
    params.productId === null
      ? Promise.resolve(null)
      : queries.adminProductForId(params.productId),
    shouldSearchPlaces
      ? queries.adminPlaces({ q: placeSearch, page: null })
      : Promise.resolve(null),
  ]);

  redirectIfPageOutOfRange(page, products.total, products.pageSize, params);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(20rem,3fr)]">
      <Box variant="sm" className="space-y-4">
        <div>
          <h2 className="mb-3 text-xl font-semibold">Produkte</h2>
          <AdminSearchForm params={params} />
        </div>

        {products.items.length === 0 ? (
          <p className="py-6 text-center text-dark-gray">
            Keine Produkte gefunden.
          </p>
        ) : (
          <ul className="space-y-2">
            {products.items.map((product) => {
              const isSelected = params.productId === product.id;
              const cities = formatCitiesFull(product.cities);

              return (
                <li key={product.id}>
                  <Link
                    aria-current={isSelected ? "true" : undefined}
                    className={cn(
                      "block rounded-md border p-3 transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-stone-200 bg-white/50 hover:border-primary/40 hover:bg-white",
                    )}
                    href={adminHref({
                      ...params,
                      productId: product.id,
                      placeId: null,
                      "place-search": null,
                    })}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium">{product.name}</span>
                      <span className="shrink-0 text-xs text-dark-gray">
                        #{product.id}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <CategoryBadge category={product.category} size="sm" />
                      <span className="text-sm text-dark-gray">
                        {`${product.placeName}${cities ? ` · ${cities}` : ""}`}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <AdminPagination
          pageSize={products.pageSize}
          params={params}
          total={products.total}
        />
      </Box>

      <Box variant="sm">
        {selectedProduct ? (
          <ProductEditor
            key={selectedProduct.id}
            params={params}
            placesForSearch={placesSearch?.items ?? []}
            placesSearchTotal={placesSearch?.total ?? 0}
            product={selectedProduct}
          />
        ) : params.productId !== null ? (
          <p className="text-error">Produkt wurde nicht gefunden</p>
        ) : (
          <p className="text-dark-gray">Wähle ein Produkt aus der Liste aus.</p>
        )}
      </Box>
    </div>
  );
}

async function PlacePanel({ params }: { params: SearchParamsAdmin }) {
  const [places, selectedPlace] = await Promise.all([
    queries.adminPlaces({
      q: params["place-search"],
      page: params.page,
    }),
    params.placeId === null
      ? Promise.resolve(null)
      : queries.adminPlaceForId(params.placeId),
  ]);

  redirectIfPageOutOfRange(
    pageFromSearchParam(params.page),
    places.total,
    places.pageSize,
    params,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(20rem,3fr)]">
      <Box className="space-y-4" variant="sm">
        <div>
          <h2 className="mb-3 text-xl font-semibold">Restaurants</h2>
          <AdminSearchForm params={params} />
        </div>

        {places.items.length === 0 ? (
          <p className="py-6 text-center text-dark-gray">
            Keine Restaurants gefunden.
          </p>
        ) : (
          <ul className="space-y-2">
            {places.items.map((place) => {
              const isSelected = params.placeId === place.id;
              const cities = formatCitiesFull(place.cities);

              return (
                <li key={place.id}>
                  <Link
                    aria-current={isSelected ? "true" : undefined}
                    className={cn(
                      "block rounded-md border p-3 transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-stone-200 bg-white/50 hover:border-primary/40 hover:bg-white",
                    )}
                    href={adminHref({
                      ...params,
                      productId: null,
                      placeId: place.id,
                    })}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium">{place.name}</span>
                      <span className="shrink-0 text-xs text-dark-gray">
                        #{place.id}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-dark-gray">
                      {cities ?? "Nicht städtebezogen"}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <AdminPagination
          pageSize={places.pageSize}
          params={params}
          total={places.total}
        />
      </Box>

      <Box variant="sm">
        {selectedPlace ? (
          <PlaceEditor key={selectedPlace.id} place={selectedPlace} />
        ) : params.placeId !== null ? (
          <p className="text-error">Restaurant wurde nicht gefunden</p>
        ) : (
          <p className="text-dark-gray">
            Wähle ein Restaurant aus der Liste aus.
          </p>
        )}
      </Box>
    </div>
  );
}
