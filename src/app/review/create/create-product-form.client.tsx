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
import { categoriesActive, type City, minCharsSearch } from "@/data/static";
import { schemaCreatePlace, schemaCreateProduct } from "@/db/db-schema";
import { type ActionStateError, withCallbacks } from "@/lib/action-utils";
import {
  type FormConfig,
  type FormState,
  prepareFormState,
} from "@/lib/form-utils";
import { t } from "@/lib/i18n";
import {
  prepareFiltersForUpdate,
  useSearchParamsHelper,
} from "@/lib/url-state";
import { MapPin, PlusIcon, ReceiptText, Save } from "lucide-react";
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
  "place-name" | "product-name"
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
    } satisfies ActionStateError;
  }

  return actionCreateProduct(formState, productParsed);
}

function SubSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-fg">
        {Icon && <Icon className="size-5 text-primary" />}
        {title}
      </h3>
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
    "product-name":
      searchParams.get(searchParamKeysCreateReview["product-name"]) ?? null,
    "place-name":
      searchParams.get(searchParamKeysCreateReview["place-name"]) ?? null,
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
          (!!filtersNew["product-name"] &&
            filtersNew["product-name"].length >= minCharsSearch) ||
            (!!filtersNew["place-name"] &&
              filtersNew["place-name"].length >= minCharsSearch),
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
    selectedPlaceId === null && filters["place-name"] !== null;

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-6" noValidate>
        {/* Basic Product Info */}
        <SubSection title="Produktdetails" icon={ReceiptText}>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-start">
            {/* Left section: Product name and Note */}
            <div className="space-y-4">
              <Fieldset>
                <Label
                  htmlFor={formKeys.name}
                  className="text-sm font-medium text-dark-gray"
                >
                  Produktname
                </Label>
                <Input
                  name={formKeys.name}
                  value={filters["product-name"] ?? ""}
                  onChange={(e) => {
                    changeFilters({ "product-name": e.target.value });
                  }}
                  className="mt-1"
                />
                <FieldError errorMsg={state?.errors?.name} />
              </Fieldset>

              <Fieldset>
                <Label
                  htmlFor={formKeys.note}
                  className="text-sm font-medium text-dark-gray"
                >
                  Notiz (optional)
                </Label>
                <Input
                  name={formKeys.note}
                  placeholder="Merkmale, Besonderheiten, .."
                  defaultValue={state?.formState.note ?? undefined}
                  className="mt-1"
                />
                <FieldError errorMsg={state?.errors?.note} />
              </Fieldset>
            </div>

            {/* Right section: Category */}
            <div>
              <Fieldset>
                <Label
                  htmlFor={formKeys.category}
                  className="text-sm font-medium text-dark-gray"
                >
                  Kategorie
                </Label>
                <SelectionFormField
                  name={formKeys.category}
                  defaultValue={state?.formState.category ?? undefined}
                  options={categoriesActive.map((category) => ({
                    value: category,
                    label: t[category],
                  }))}
                />
              </Fieldset>
            </div>
          </div>
        </SubSection>

        {/* Place Selection */}
        <SubSection title="Restaurant auswählen (optional)" icon={MapPin}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Place Search and Selection */}
            <div className="space-y-6">
              <Fieldset>
                <Label
                  htmlFor="search-place-name"
                  className="text-sm font-medium text-dark-gray"
                >
                  Restaurantname
                </Label>
                <Input
                  name="search-place-name"
                  type="text"
                  placeholder="z. B. Five Guys"
                  value={filters["place-name"] ?? ""}
                  onChange={(e) => {
                    setSelectedPlaceId(null);
                    changeFilters({ "place-name": e.target.value });
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
                  Ähnliche Restaurants
                </h4>
                <SelectionCardList className="space-y-3">
                  {!filters["place-name"] ? (
                    <div className="flex h-32 items-center justify-center rounded-lg text-dark-gray">
                      <InfoMessage>
                        Gib einen Restaurantnamen ein, um Vorschläge zu sehen
                      </InfoMessage>
                    </div>
                  ) : placesForSearch.length === 0 ? (
                    <div className="flex h-32 items-center justify-center rounded-lg text-dark-gray">
                      <InfoMessage>Keine Restaurants gefunden</InfoMessage>
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
                placeName={filters["place-name"]}
                onChangePlaceName={(placeName) =>
                  changeFilters({ "place-name": placeName })
                }
                onCreatedPlace={handlePlaceCreation}
                isOpen={isPlaceDrawerOpen}
                setIsOpen={setIsPlaceDrawerOpen}
              >
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsPlaceDrawerOpen(true)}
                  className="text-primary"
                >
                  <PlusIcon className="size-4 flex-shrink-0" />
                  <span>
                    Restaurant nicht gefunden?
                    <span className="ml-1 font-semibold">
                      Erstelle stattdessen einen
                    </span>
                  </span>
                </Button>
              </DrawerCreatePlace>
            </div>

            {/* Map */}
            <div className="flex flex-col">
              <h4 className="mb-3 text-sm font-medium text-dark-gray">
                Vorschau des Standorts
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
            {isPendingAction
              ? "Produkt wird gespeichert..."
              : "Produkt speichern"}
          </Button>

          {state?.errors?.category && (
            <FieldError errorMsg={state.errors.category} />
          )}

          {isPlaceSelectionNeeded && (
            <FieldError errorMsg="Wähle ein Restaurant aus/erstelle eins oder entferne deine Restaurantnamenssuche." />
          )}

          {state?.status === "SUCCESS" && (
            <p
              aria-live="polite"
              className="rounded-lg bg-green-50 px-4 py-2 text-green-700 ring-1 ring-green-200"
            >
              Produkt erfolgreich erstellt!
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
        <DrawerHeader className="flex-shrink-0">
          <DrawerTitle className="font-normal">
            Neues Restaurant erstellen
          </DrawerTitle>
        </DrawerHeader>

        <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden md:mt-10">
          <div className="flex-1 overflow-y-auto px-6">
            <div className="flex flex-col gap-6 pb-6 md:flex-row md:gap-6">
              <form
                action={formAction}
                className="flex flex-1 flex-col gap-6 md:w-1/2"
                noValidate
              >
                <Fieldset>
                  <Label htmlFor={formKeysCreatePlace.name}>
                    Restaurantname
                  </Label>
                  <Input
                    className={formInputWidth}
                    name={formKeysCreatePlace.name}
                    type="text"
                    placeholder="z. B. Five Guys"
                    value={placeName ?? ""}
                    onChange={(e) => onChangePlaceName(e.target.value)}
                  />
                  <FieldError errorMsg={state?.errors?.name} />
                </Fieldset>

                <Fieldset>
                  <Label htmlFor={formKeysCreatePlace.city}>Stadt</Label>
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

                <Button
                  className="w-min"
                  type="submit"
                  disabled={isPendingAction}
                >
                  <Save />{" "}
                  {isPendingAction
                    ? "Restaurant wird gespeichert..."
                    : "Restaurant speichern"}
                </Button>
              </form>

              <div className="flex flex-col md:w-1/2">
                <div className="h-60 w-full md:h-80">
                  {!!placeName && !!selectedCity ? (
                    <MapWithPlace placeName={placeName} city={selectedCity} />
                  ) : (
                    <MapWithPlace placeName="Bun's" city="Hamburg" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter className="flex-shrink-0">
          <DrawerClose asChild>
            <Button variant="secondary">Schließen</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
