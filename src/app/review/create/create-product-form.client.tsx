import { CitiesSelection } from "@/components/cities-selection";
import {
  FieldError,
  Fieldset,
  formInputWidth,
  SelectionFormField,
} from "@/components/form";
import { InfoMessage } from "@/components/info-message";
import { MapWithPlace } from "@/components/map-with-place";
import { SelectionCard, SelectionCardList } from "@/components/selection-card";
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
  "placeName" | "productName"
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

function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-light-gray p-6">
      <h3 className="mb-4 text-lg font-medium text-fg">{title}</h3>
      {children}
    </div>
  );
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
    placeName: searchParams.get(searchParamKeysCreateReview.placeName) ?? null,
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
            (!!filtersNew.placeName &&
              filtersNew.placeName.length >= minCharsSearch),
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
    selectedPlaceId === null && filters.placeName !== null;

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-6" noValidate>
        {/* Basic Product Info */}
        <SubSection title="Product Details">
          <div className="space-y-4">
            <Fieldset>
              <Label
                htmlFor={formKeys.name}
                className="text-sm font-medium text-dark-gray"
              >
                Product name
              </Label>
              <Input
                name={formKeys.name}
                value={filters.productName ?? ""}
                onChange={(e) => {
                  changeFilters({ productName: e.target.value });
                }}
                className="mt-1"
              />
              <FieldError errorMsg={state?.errors?.name} />
            </Fieldset>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Fieldset>
                <Label
                  htmlFor={formKeys.category}
                  className="text-sm font-medium text-dark-gray"
                >
                  Category
                </Label>
                <SelectionFormField
                  name={formKeys.category}
                  defaultValue={state?.formState.category ?? undefined}
                  options={categories}
                />
                <FieldError errorMsg={state?.errors?.category} />
              </Fieldset>

              <Fieldset>
                <Label
                  htmlFor={formKeys.note}
                  className="text-sm font-medium text-dark-gray"
                >
                  Note (optional)
                </Label>
                <Input
                  name={formKeys.note}
                  placeholder="Want to note something?"
                  defaultValue={state?.formState.note ?? undefined}
                  className="mt-1"
                />
                <FieldError errorMsg={state?.errors?.note} />
              </Fieldset>
            </div>
          </div>
        </SubSection>

        {/* Place Selection */}
        <SubSection title="Select a place (optional)">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Place Search and Selection */}
            <div className="space-y-6">
              <Fieldset>
                <Label
                  htmlFor="search-place-name"
                  className="text-sm font-medium text-dark-gray"
                >
                  Place name
                </Label>
                <Input
                  name="search-place-name"
                  type="text"
                  placeholder="e.g. Five Guys"
                  value={filters.placeName ?? ""}
                  onChange={(e) => {
                    setSelectedPlaceId(null);
                    changeFilters({ placeName: e.target.value });
                  }}
                  className="mt-1"
                />
                <Fieldset>
                  <Input
                    name={formKeys.placeId}
                    type="hidden"
                    defaultValue={selectedPlaceId ?? undefined}
                  />
                  <FieldError errorMsg={state?.errors?.placeId} />
                </Fieldset>
              </Fieldset>

              <div>
                <h4 className="mb-3 text-sm font-medium text-dark-gray">
                  Similar places:
                </h4>
                <SelectionCardList className="space-y-3">
                  {!filters.placeName ? (
                    <div className="flex h-32 items-center justify-center rounded-lg bg-light-gray text-dark-gray">
                      <InfoMessage>
                        Enter a place name to see suggestions
                      </InfoMessage>
                    </div>
                  ) : placesForSearch.length === 0 ? (
                    <div className="flex h-32 items-center justify-center rounded-lg bg-light-gray text-dark-gray">
                      <InfoMessage>No places found</InfoMessage>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {placesForSearch.map((place) => (
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
                      ))}
                    </div>
                  )}
                </SelectionCardList>
              </div>

              <DrawerCreatePlace
                placeName={filters.placeName}
                onChangePlaceName={(placeName) => changeFilters({ placeName })}
                onCreatedPlace={handlePlaceCreation}
                isOpen={isPlaceDrawerOpen}
                setIsOpen={setIsPlaceDrawerOpen}
              >
                <div onClick={() => setIsPlaceDrawerOpen(true)}>
                  <InfoMessage className="inline-block border-tertiary text-tertiary">
                    Place not found?
                    <span className="ml-2 font-bold not-italic text-primary">
                      Create one instead
                    </span>
                  </InfoMessage>
                </div>
              </DrawerCreatePlace>
            </div>

            {/* Map */}
            <div className="flex flex-col">
              <h4 className="mb-3 text-sm font-medium text-dark-gray">
                Location preview
              </h4>
              <div className="grid h-40 w-full overflow-hidden md:h-96">
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
        </SubSection>

        {/* Submit */}
        <div className="flex items-center gap-4 pt-4">
          <Button
            className="px-8 py-3 text-base font-medium shadow-lg"
            type="submit"
            disabled={isPendingAction || isPlaceSelectionNeeded}
            size="lg"
          >
            <Save className="mr-2 size-5" />
            {isPendingAction ? "Saving product..." : "Save product"}
          </Button>

          {isPlaceSelectionNeeded && (
            <FieldError errorMsg="Either select/create a place or remove your place name search." />
          )}

          {state?.status === "SUCCESS" && (
            <p
              aria-live="polite"
              className="rounded-lg bg-green-50 px-4 py-2 text-green-700 ring-1 ring-green-200"
            >
              Product created successfully!
            </p>
          )}
        </div>
      </form>
    </div>
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
      <div className="space-y-2">
        <h4 className="line-clamp-2 font-semibold">{name}</h4>
        {city && (
          <div className="flex items-center gap-1 text-sm text-dark-gray">
            <svg
              className="size-4 text-dark-gray"
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
            <span>{city}</span>
          </div>
        )}
      </div>
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
  placeName,
  onChangePlaceName,
  onCreatedPlace,
  children,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  placeName: string | null;
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

        <div className="mt-6 flex min-h-0 flex-col gap-x-6 gap-y-6 md:flex-row">
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
                value={placeName ?? ""}
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

          <div className="grid h-40 w-full md:h-80 md:w-1/2">
            {!!placeName && !!selectedCity ? (
              <MapWithPlace placeName={placeName} city={selectedCity} />
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
