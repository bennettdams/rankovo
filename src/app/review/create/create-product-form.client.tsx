import { CitiesSelection } from "@/components/cities-selection";
import {
  FieldError,
  Fieldset,
  formInputWidth,
  SelectionFormField,
} from "@/components/form";
import { InfoMessage } from "@/components/info-message";
import { MapWithPlace } from "@/components/map-with-place";
import { SelectionCard } from "@/components/selection-card";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  actionCreatePlace,
  actionCreateProduct,
  type PlaceCreate,
  type ProductCreate,
  type ProductCreatedByAction,
} from "@/data/actions";
import { PlaceSearchQuery } from "@/data/queries";
import { categories, type City, minCharsSearch } from "@/data/static";
import { schemaCreatePlace, schemaCreateProduct } from "@/db/db-schema";
import { type ActionStateError, withCallbacks } from "@/lib/action-utils";
import {
  type FormConfig,
  type FormState,
  prepareFormState,
} from "@/lib/form-utils";
import {
  prepareFiltersForUpdate,
  useSearchParamsHelper,
} from "@/lib/url-state";
import { Save } from "lucide-react";
import {
  type Dispatch,
  type SetStateAction,
  startTransition,
  useActionState,
  useCallback,
  useOptimistic,
  useState,
} from "react";
import { searchParamKeysCreateReview } from "./create-review-form.client";
import { SearchParamsCreateReview } from "./page";

type SearchParamsCreateProduct = Pick<
  SearchParamsCreateReview,
  "placeNameSearch" | "productName"
>;

const formKeys = {
  name: "name",
  note: "note",
  category: "category",
  placeId: "placeId",
} satisfies Record<keyof ProductCreate, string>;

const formConfig = {
  name: "string",
  note: "string",
  category: "string",
  placeId: "number",
} satisfies FormConfig<ProductCreate>;

export type FormStateCreateProduct = FormState<typeof formConfig>;

async function createProduct(_: unknown, formData: FormData) {
  const formState = prepareFormState(formConfig, formData);

  const {
    success,
    error,
    data: productParsed,
  } = schemaCreateProduct.safeParse(formState);

  if (!success) {
    return {
      status: "ERROR",
      formState,
      errors: error.flatten().fieldErrors,
      data: null,
    } satisfies ActionStateError;
  }

  return actionCreateProduct(formState, productParsed);
}

export function CreateProductForm({
  placesForSearch,
  onCreatedProduct,
}: {
  placesForSearch: PlaceSearchQuery[];
  onCreatedProduct: (productCreated: ProductCreatedByAction) => void;
}) {
  const [state, formAction, isPendingAction] = useActionState(
    withCallbacks(createProduct, {
      onSuccess: (data) => onCreatedProduct(data.productCreated),
    }),
    null,
  );
  const { searchParams, updateSearchParams } = useSearchParamsHelper();
  const [filters, setOptimisticFilters] = useOptimistic({
    productName:
      searchParams.get(searchParamKeysCreateReview.productName) ?? null,
    placeNameSearch:
      searchParams.get(searchParamKeysCreateReview.placeNameSearch) ?? null,
  } satisfies SearchParamsCreateProduct);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [isPlaceDrawerOpen, setIsPlaceDrawerOpen] = useState(false);

  function changeFilters(
    filtersUpdatedPartial: Partial<SearchParamsCreateProduct>,
  ) {
    const filtersNew = prepareFiltersForUpdate(filtersUpdatedPartial, filters);
    if (filtersNew) {
      startTransition(() => {
        setOptimisticFilters(filtersNew);
        updateSearchParams(
          filtersNew,
          (!!filtersNew.productName &&
            filtersNew.productName.length >= minCharsSearch) ||
            (!!filtersNew.placeNameSearch &&
              filtersNew.placeNameSearch.length >= minCharsSearch),
        );
      });
    }
  }

  const handlePlaceCreation = useCallback((placeIdCreated: number) => {
    setSelectedPlaceId(placeIdCreated);
    setIsPlaceDrawerOpen(false);
  }, []);

  const placeForMap = selectedPlaceId
    ? placesForSearch.find((p) => p.id === selectedPlaceId)
    : // fallback first place from search if nothing selected
      (placesForSearch[0] ?? null);

  /** We remind the user to select a place so it is not assumed that entering a place name automatically makes a selection. */
  const isPlaceSelectionNeeded =
    selectedPlaceId === null && filters.placeNameSearch !== null;

  return (
    <form action={formAction} className="flex flex-col gap-y-6" noValidate>
      <Fieldset>
        <Label htmlFor={formKeys.name}>Product name</Label>
        <Input
          name={formKeys.name}
          value={filters.productName ?? ""}
          onChange={(e) => {
            changeFilters({ productName: e.target.value });
          }}
        />
        <FieldError errorMsg={state?.errors?.name} />
      </Fieldset>

      <Fieldset>
        <Label htmlFor={formKeys.category}>Category</Label>
        <SelectionFormField
          name={formKeys.category}
          defaultValue={state?.formState.category ?? undefined}
          options={categories}
        />
        <FieldError errorMsg={state?.errors?.category} />
      </Fieldset>

      <Fieldset>
        <Label htmlFor={formKeys.note}>Note</Label>
        <Input
          name={formKeys.note}
          placeholder="Want to note something?"
          defaultValue={state?.formState.note ?? undefined}
        />
        <FieldError errorMsg={state?.errors?.note} />
      </Fieldset>

      {/* PLACE */}
      <div className="mt-4">
        <h2 className="flex items-center text-xl text-secondary">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary text-2xl leading-none text-primary-fg">
            1.1
          </span>
          <span className="ml-4">Select a place (optional)</span>
        </h2>

        <div className="mt-4 flex size-full flex-row items-start">
          <div className="w-1/2">
            <Fieldset>
              <Label htmlFor="search-place-name">Place name</Label>
              <Input
                className={formInputWidth}
                name="search-place-name"
                type="text"
                placeholder="e.g. Five Guys"
                value={filters.placeNameSearch ?? ""}
                onChange={(e) => {
                  setSelectedPlaceId(null);
                  changeFilters({ placeNameSearch: e.target.value });
                }}
              />
              <Fieldset>
                <Label htmlFor={formKeys.placeId}>Place ID</Label>
                <Input
                  name={formKeys.placeId}
                  type="hidden"
                  defaultValue={selectedPlaceId ?? undefined}
                />
                <FieldError errorMsg={state?.errors?.placeId} />
              </Fieldset>

              <FieldError errorMsg={state?.errors?.placeId} />
            </Fieldset>

            <div className="mt-10">
              <p>Similar places for your filter:</p>

              <div className="mt-4 flex h-full flex-row gap-x-4 overflow-x-scroll">
                {!filters.placeNameSearch ? (
                  <InfoMessage>-</InfoMessage>
                ) : placesForSearch.length === 0 ? (
                  <InfoMessage>No places found</InfoMessage>
                ) : (
                  placesForSearch.map((place) => (
                    <PlaceCard
                      key={place.id}
                      isSelected={place.id === selectedPlaceId}
                      onSelect={() =>
                        setSelectedPlaceId((prev) =>
                          prev === place.id ? null : place.id,
                        )
                      }
                      name={place.name}
                      city={place.city}
                    />
                  ))
                )}
              </div>
            </div>

            <DrawerCreatePlace
              placeNameSearch={filters.placeNameSearch}
              onChangePlaceName={(placeName) =>
                changeFilters({ placeNameSearch: placeName })
              }
              onCreatedPlace={handlePlaceCreation}
              isOpen={isPlaceDrawerOpen}
              setIsOpen={setIsPlaceDrawerOpen}
            >
              <div onClick={() => setIsPlaceDrawerOpen(true)}>
                <InfoMessage className="mt-4 inline-block cursor-pointer">
                  Place not found?
                  <span className="ml-2 font-bold not-italic text-primary">
                    Create one instead
                  </span>
                </InfoMessage>
              </div>
            </DrawerCreatePlace>
          </div>

          <div className="ml-10 mt-6 grid h-80 w-1/2 grow">
            {!!placeForMap && placeForMap.city ? (
              <MapWithPlace
                placeName={placeForMap.name}
                city={placeForMap.city}
              />
            ) : (
              <MapWithPlace placeName="Bun's" city="Hamburg" />
            )}
          </div>
        </div>
      </div>

      <Button
        className="w-min"
        type="submit"
        disabled={isPendingAction || isPlaceSelectionNeeded}
      >
        <Save /> {isPendingAction ? "Saving product..." : "Save product"}
      </Button>
      {isPlaceSelectionNeeded && (
        <FieldError errorMsg="Either select/create a place or remove your place name search." />
      )}

      {state?.status === "SUCCESS" && (
        <p aria-live="polite" className="text-xl text-green-700">
          Product created successfully!
        </p>
      )}
    </form>
  );
}

function PlaceCard({
  isSelected,
  onSelect,
  name,
  city,
}: {
  isSelected: boolean;
  onSelect: () => void;
  name: string;
  city: City | null;
}) {
  return (
    <SelectionCard isSelected={isSelected} onClick={onSelect}>
      <p className="line-clamp-2 min-h-10 font-bold">{name}</p>
      <p className="line-clamp-2 min-h-2">{city}</p>
    </SelectionCard>
  );
}

const formKeysCreatePlace = {
  name: "name",
  city: "city",
} satisfies Record<keyof PlaceCreate, string>;

const formConfigCreatePlace = {
  name: "string",
  city: "string",
} satisfies FormConfig<PlaceCreate>;

export type FormStateCreatePlace = FormState<typeof formConfigCreatePlace>;

async function createPlace(_: unknown, formData: FormData) {
  const formState = prepareFormState(formConfigCreatePlace, formData);

  const {
    success,
    error,
    data: placeParsed,
  } = schemaCreatePlace.safeParse(formState);

  if (!success) {
    return {
      status: "ERROR",
      formState,
      errors: error.flatten().fieldErrors,
      data: null,
    } satisfies ActionStateError;
  }

  return actionCreatePlace(formState, placeParsed);
}

function DrawerCreatePlace({
  isOpen,
  setIsOpen,
  placeNameSearch,
  onChangePlaceName,
  onCreatedPlace,
  children,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  placeNameSearch: string | null;
  onChangePlaceName: (placeName: string) => void;
  onCreatedPlace: (placeId: number) => void;
  children: React.ReactNode;
}) {
  const [state, formAction, isPendingAction] = useActionState(
    withCallbacks(createPlace, {
      onSuccess: (data) => onCreatedPlace(data.placeIdCreated),
    }),
    null,
  );
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="mx-auto flex h-[80vh] w-full flex-col md:max-w-5xl">
        <DrawerHeader>
          <DrawerTitle className="font-normal">Create a new place</DrawerTitle>
        </DrawerHeader>

        <div className="mt-6 flex min-h-0 flex-row gap-x-6">
          <form
            action={formAction}
            className="flex min-h-0 w-1/2 flex-1 flex-col gap-y-6"
            noValidate
          >
            <Fieldset>
              <Label htmlFor={formKeysCreatePlace.name}>Place name</Label>
              <Input
                className={formInputWidth}
                name={formKeysCreatePlace.name}
                type="text"
                placeholder="e.g. Five Guys"
                value={placeNameSearch ?? ""}
                onChange={(e) => onChangePlaceName(e.target.value)}
              />
              <FieldError errorMsg={state?.errors?.name} />
            </Fieldset>

            <Fieldset>
              <Label htmlFor={formKeysCreatePlace.city}>City</Label>
              <Input
                name={formKeysCreatePlace.city}
                type="hidden"
                defaultValue={selectedCity ?? undefined}
              />
              <CitiesSelection
                citiesActive={!selectedCity ? [] : [selectedCity]}
                onClick={setSelectedCity}
              />
              <FieldError errorMsg={state?.errors?.city} />
            </Fieldset>

            <Button className="w-min" type="submit" disabled={isPendingAction}>
              <Save /> {isPendingAction ? "Saving place..." : "Save place"}
            </Button>
          </form>

          <div className="gdrow grid h-80 w-1/2">
            {!!placeNameSearch && !!selectedCity ? (
              <MapWithPlace placeName={placeNameSearch} city={selectedCity} />
            ) : (
              <MapWithPlace placeName="Bun's" city="Hamburg" />
            )}
          </div>
        </div>

        <DrawerFooter className="flex items-end">
          <DrawerClose asChild>
            <Button variant="secondary">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
