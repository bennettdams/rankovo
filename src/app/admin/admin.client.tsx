"use client";

import { CategoriesSelection } from "@/components/categories-selection";
import { CitiesSelection } from "@/components/cities-selection";
import { FieldError, Fieldset } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  actionAdminUpdatePlace,
  actionAdminUpdateProduct,
} from "@/data/actions";
import type {
  AdminPlace,
  AdminPlacesQuery,
  AdminProduct,
} from "@/data/queries";
import { minCharsSearch, type Category, type City } from "@/data/static";
import {
  schemaPlaceId,
  schemaProductId,
  schemaUpdatePlace,
  schemaUpdateProduct,
} from "@/db/db-schema";
import { getActionRootErrors, type ActionStateError } from "@/lib/action-utils";
import { formatCitiesFull } from "@/lib/cities";
import { prepareFormState } from "@/lib/form-utils";
import { useSearchParamsHelper } from "@/lib/url-state.client";
import { cn } from "@/lib/utils";
import { useActionState, useState, type FormEvent } from "react";
import { z } from "zod";
import {
  formConfigUpdatePlace,
  formConfigUpdateProduct,
  formKeysUpdatePlace,
  formKeysUpdateProduct,
  searchParamKeysAdmin,
  type FormStateUpdatePlace,
  type FormStateUpdateProduct,
  type SearchParamsAdmin,
} from "./admin.shared";

type SelectedPlace = {
  id: number;
  name: string;
  cities: City[];
};

function selectedPlaceFromProduct(product: AdminProduct): SelectedPlace {
  return {
    id: product.placeId,
    name: product.placeName,
    cities: product.cities,
  };
}

function placeAssignmentLabel(place: SelectedPlace): string {
  const cities = formatCitiesFull(place.cities);
  return `${place.name}${cities ? ` · ${cities}` : ""} · #${place.id}`;
}

export function ProductEditor({
  product,
  placesForSearch,
  placesSearchTotal,
  params,
}: {
  product: AdminProduct;
  placesForSearch: AdminPlacesQuery[];
  placesSearchTotal: number;
  params: SearchParamsAdmin;
}) {
  const { updateSearchParams } = useSearchParamsHelper();
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace>(
    selectedPlaceFromProduct(product),
  );
  const [selectedCategory, setSelectedCategory] = useState<Category>(
    product.category,
  );
  const placeQuery = params["place-search"] ?? "";

  function searchPlaces(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(
      new FormData(event.currentTarget).get(
        searchParamKeysAdmin["place-search"],
      ) ?? "",
    );
    const placeSearch = value.length > 0 ? value : null;
    updateSearchParams({ ...params, "place-search": placeSearch }, true);
  }

  async function updateProduct(_: unknown, formData: FormData) {
    const formState = {
      ...prepareFormState(formConfigUpdateProduct, formData),
      placeId: selectedPlace.id,
    };
    const productResult = schemaUpdateProduct.safeParse(formState);
    const productIdResult = schemaProductId.safeParse(product.id);

    if (!productResult.success) {
      return {
        status: "ERROR",
        formState,
        errors: z.flattenError(productResult.error).fieldErrors,
      } satisfies ActionStateError<FormStateUpdateProduct>;
    }

    if (!productIdResult.success) {
      return {
        status: "ERROR",
        formState,
        rootErrors: ["Ungültige Produkt-ID"],
      } satisfies ActionStateError<FormStateUpdateProduct>;
    }

    return actionAdminUpdateProduct(
      formState,
      productIdResult.data,
      productResult.data,
    );
  }

  const [state, formAction, isPending] = useActionState(updateProduct, null);
  const values = state ? state.formState : product;
  const errors = state?.status === "ERROR" ? state.errors : undefined;
  const rootErrors = getActionRootErrors(state);
  const updateFormId = "admin-product-update";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Produkt bearbeiten</h2>
        <p className="mt-2 text-sm text-dark-gray">ID #{product.id}</p>
      </div>

      <div className="space-y-5">
        <form
          action={formAction}
          className="space-y-5"
          id={updateFormId}
          noValidate
        >
          <Fieldset className="w-full">
            <Label htmlFor={formKeysUpdateProduct.name}>Produktname</Label>
            <Input
              defaultValue={values.name ?? ""}
              id={formKeysUpdateProduct.name}
              maxLength={255}
              minLength={2}
              name={formKeysUpdateProduct.name}
              required
            />
            <FieldError errorMsg={errors?.name} />
          </Fieldset>

          <Fieldset className="w-full">
            <Label>Kategorie</Label>
            <input
              name={formKeysUpdateProduct.category}
              type="hidden"
              value={selectedCategory}
            />
            <CategoriesSelection
              categoriesSelected={[selectedCategory]}
              onClick={setSelectedCategory}
            />
            <FieldError errorMsg={errors?.category} />
          </Fieldset>

          <Fieldset className="w-full">
            <Label htmlFor={formKeysUpdateProduct.note}>Notiz</Label>
            <Textarea
              defaultValue={values.note ?? ""}
              id={formKeysUpdateProduct.note}
              maxLength={255}
              name={formKeysUpdateProduct.note}
            />
            <FieldError errorMsg={errors?.note} />
          </Fieldset>
        </form>

        <Fieldset className="w-full md:w-full">
          <Label htmlFor="admin-place-search">Restaurant</Label>
          <div className="rounded-md border border-stone-200 bg-white/50 p-3">
            <p className="text-sm text-dark-gray">Aktuelle Zuweisung</p>
            <p className="font-medium">{placeAssignmentLabel(selectedPlace)}</p>
          </div>
          <form className="flex gap-2" onSubmit={searchPlaces}>
            <Input
              autoComplete="off"
              defaultValue={placeQuery}
              id="admin-place-search"
              maxLength={255}
              name={searchParamKeysAdmin["place-search"]}
              placeholder="Restaurant suchen"
              type="search"
            />
            <Button type="submit">Suchen</Button>
          </form>
          <FieldError
            errorMsg={
              placeQuery.length > 0 && placeQuery.length < minCharsSearch
                ? `Mindestens ${minCharsSearch} Zeichen`
                : undefined
            }
          />
          <FieldError errorMsg={errors?.placeId} />
          <PlaceSearchResults
            onSelect={setSelectedPlace}
            placeQuery={placeQuery}
            placesForSearch={placesForSearch}
            placesSearchTotal={placesSearchTotal}
            selectedPlaceId={selectedPlace.id}
          />
        </Fieldset>

        {rootErrors && (
          <div aria-live="polite" className="space-y-1 text-error">
            {rootErrors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}

        <Button disabled={isPending} form={updateFormId} type="submit">
          {isPending ? "Wird gespeichert …" : "Speichern"}
        </Button>

        {state?.status === "SUCCESS" && !isPending && (
          <p aria-live="polite" className="text-green-700">
            Produkt wurde gespeichert.
          </p>
        )}
      </div>
    </div>
  );
}

function PlaceSearchResults({
  placeQuery,
  placesForSearch,
  placesSearchTotal,
  selectedPlaceId,
  onSelect,
}: {
  placeQuery: string;
  placesForSearch: AdminPlacesQuery[];
  placesSearchTotal: number;
  selectedPlaceId: number;
  onSelect: (place: SelectedPlace) => void;
}) {
  if (placeQuery.length === 0) {
    return (
      <p className="text-sm text-dark-gray">
        Gib einen Restaurantnamen ein, um Vorschläge zu sehen.
      </p>
    );
  }

  if (placeQuery.length < minCharsSearch) {
    return null;
  }

  if (placesForSearch.length === 0) {
    return (
      <p className="text-sm text-dark-gray">Keine Restaurants gefunden.</p>
    );
  }

  return (
    <div className="space-y-2">
      {placesSearchTotal > placesForSearch.length && (
        <p className="text-sm text-dark-gray">
          Zeige {placesForSearch.length} von {placesSearchTotal} Treffern. Suche
          genauer.
        </p>
      )}
      <ul className="max-h-80 space-y-2 overflow-y-auto">
        {placesForSearch.map((place) => {
          const isSelected = place.id === selectedPlaceId;

          return (
            <li key={place.id}>
              <button
                aria-pressed={isSelected}
                className={cn(
                  "block w-full rounded-md border p-3 text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-stone-200 bg-white/50 hover:border-primary/40 hover:bg-white",
                )}
                onClick={() =>
                  onSelect({
                    id: place.id,
                    name: place.name,
                    cities: place.cities,
                  })
                }
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-medium">{place.name}</span>
                  <span className="shrink-0 text-xs text-dark-gray">
                    #{place.id}
                  </span>
                </div>
                <p className="mt-2 text-sm text-dark-gray">
                  {formatCitiesFull(place.cities) ?? "Nicht städtebezogen"}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function PlaceEditor({ place }: { place: AdminPlace }) {
  const [selectedCities, setSelectedCities] = useState<City[]>(place.cities);

  async function updatePlace(_: unknown, formData: FormData) {
    const formState = prepareFormState(formConfigUpdatePlace, formData);
    const placeResult = schemaUpdatePlace.safeParse(formState);
    const placeIdResult = schemaPlaceId.safeParse(place.id);

    if (!placeResult.success) {
      return {
        status: "ERROR",
        formState,
        errors: z.flattenError(placeResult.error).fieldErrors,
      } satisfies ActionStateError<FormStateUpdatePlace>;
    }

    if (!placeIdResult.success) {
      return {
        status: "ERROR",
        formState,
        rootErrors: ["Ungültige Restaurant-ID"],
      } satisfies ActionStateError<FormStateUpdatePlace>;
    }

    return actionAdminUpdatePlace(
      formState,
      placeIdResult.data,
      placeResult.data,
    );
  }

  const [state, formAction, isPending] = useActionState(updatePlace, null);
  const values = state ? state.formState : place;
  const errors = state?.status === "ERROR" ? state.errors : undefined;
  const rootErrors = getActionRootErrors(state);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Restaurant bearbeiten</h2>
        <p className="mt-2 text-sm text-dark-gray">ID #{place.id}</p>
      </div>

      <form action={formAction} className="space-y-5" noValidate>
        <Fieldset className="w-full">
          <Label htmlFor={formKeysUpdatePlace.name}>Restaurantname</Label>
          <Input
            defaultValue={values.name ?? ""}
            id={formKeysUpdatePlace.name}
            maxLength={255}
            minLength={1}
            name={formKeysUpdatePlace.name}
            required
          />
          <FieldError errorMsg={errors?.name} />
        </Fieldset>

        <fieldset className="grid w-full items-center gap-1.5">
          <legend className="text-sm leading-none font-medium">Städte</legend>
          <p className="mb-2 text-sm text-dark-gray">
            Keine Auswahl = nicht städtebezogen
          </p>
          {selectedCities.map((city) => (
            <input
              key={city}
              name={formKeysUpdatePlace.cities}
              type="hidden"
              value={city}
            />
          ))}
          <CitiesSelection
            citiesActive={selectedCities}
            onClick={(city) =>
              setSelectedCities((currentCities) =>
                currentCities.includes(city)
                  ? currentCities.filter(
                      (selectedCity) => selectedCity !== city,
                    )
                  : [...currentCities, city],
              )
            }
          />
          <FieldError errorMsg={errors?.cities} />
        </fieldset>

        {rootErrors && (
          <div aria-live="polite" className="space-y-1 text-error">
            {rootErrors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}

        <Button disabled={isPending} type="submit">
          {isPending ? "Wird gespeichert …" : "Speichern"}
        </Button>

        {state?.status === "SUCCESS" && !isPending && (
          <p aria-live="polite" className="text-green-700">
            Restaurant wurde gespeichert.
          </p>
        )}
      </form>
    </div>
  );
}
