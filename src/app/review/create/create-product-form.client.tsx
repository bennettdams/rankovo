import { CategoriesSelectionFormField } from "@/components/categories-selection";
import { FieldError, Fieldset, formInputWidth } from "@/components/form";
import { InfoMessage } from "@/components/info-message";
import { MapWithPlace } from "@/components/map-with-place";
import { SelectionCard } from "@/components/selection-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  actionCreateProduct,
  type ProductCreate,
  type ProductCreatedAction,
} from "@/data/actions";
import { PlaceSearchQuery } from "@/data/queries";
import { minCharsSearch } from "@/data/static";
import { schemaCreateProduct } from "@/db/db-schema";
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
  startTransition,
  useActionState,
  useEffect,
  useOptimistic,
} from "react";
import { searchParamKeysCreateReview } from "./create-review-form.client";
import { SearchParamsCreateReview } from "./page";

type SearchParamsCreateProduct = Pick<
  SearchParamsCreateReview,
  "placeNameSearch"
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

function createProduct(_: unknown, formData: FormData) {
  const formState = prepareFormState(formConfig, formData);

  const {
    success,
    error,
    data: productParsed,
  } = schemaCreateProduct.safeParse(formState);

  if (!success) {
    return {
      errors: error.flatten().fieldErrors,
      values: formState,
    };
  }

  return actionCreateProduct(productParsed, formState);
}

export function CreateProductForm({
  placesForSearch,
  onCreatedProduct,
}: {
  placesForSearch: PlaceSearchQuery[];
  onCreatedProduct: (productCreated: ProductCreatedAction) => void;
}) {
  const [state, formAction, isPendingAction] = useActionState(
    createProduct,
    null,
  );
  const { searchParams, updateSearchParams } = useSearchParamsHelper();
  const [filters, setOptimisticFilters] = useOptimistic({
    placeNameSearch:
      searchParams.get(searchParamKeysCreateReview.placeNameSearch) ?? null,
  } satisfies SearchParamsCreateProduct);

  // Unfortunately I don't think there is a better way to call a callback after a succesful server action submission.
  useEffect(() => {
    if (state?.success && state.productCreated) {
      onCreatedProduct(state.productCreated);
    }
  }, [state?.success, state?.productCreated, onCreatedProduct]);

  function changeFilters(
    filtersUpdatedPartial: Partial<SearchParamsCreateProduct>,
  ) {
    const filtersNew = prepareFiltersForUpdate(filtersUpdatedPartial, filters);
    if (filtersNew) {
      startTransition(() => {
        setOptimisticFilters(filtersNew);
        updateSearchParams(
          filtersNew,
          !!filtersNew.placeNameSearch &&
            filtersNew.placeNameSearch.length >= minCharsSearch,
        );
      });
    }
  }

  const placeFirst = placesForSearch[0] ?? null;

  return (
    <form action={formAction} className="flex flex-col gap-y-6" noValidate>
      <Fieldset>
        <Label htmlFor={formKeys.name}>Product name</Label>
        <Input
          name={formKeys.name}
          defaultValue={state?.values?.name ?? undefined}
        />
        <FieldError errorMsg={state?.errors?.name} />
      </Fieldset>

      <Fieldset>
        <Label htmlFor={formKeys.category}>Category</Label>
        <CategoriesSelectionFormField
          name={formKeys.category}
          defaultValue={state?.values?.category ?? undefined}
        />
        <FieldError errorMsg={state?.errors?.category} />
      </Fieldset>

      <Fieldset>
        <Label htmlFor={formKeys.note}>Note</Label>
        <Input
          name={formKeys.note}
          placeholder="Want to note something?"
          defaultValue={state?.values?.note ?? undefined}
        />
        <FieldError errorMsg={state?.errors?.note} />
      </Fieldset>

      <div className="flex size-full flex-row items-start">
        <div className="w-1/2">
          <Fieldset>
            <Label htmlFor="search-place-name">Place name</Label>
            <Input
              className={formInputWidth}
              name="search-place-name"
              type="text"
              placeholder="e.g. Five Guys"
              value={filters.placeNameSearch ?? ""}
              onChange={(e) =>
                changeFilters({ placeNameSearch: e.target.value })
              }
            />

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
                  <SelectionCard
                    key={place.id}
                    isSelected={true}
                    onClick={() => {
                      alert("Not implemented");
                    }}
                  >
                    <p className="line-clamp-2 min-h-10 font-bold">
                      {place.name}
                    </p>
                    <p className="line-clamp-2 min-h-2">{place.city}</p>
                  </SelectionCard>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="ml-10 mt-6 grid h-80 w-1/2 grow">
          {!!placeFirst && placeFirst.city ? (
            <MapWithPlace placeName={placeFirst.name} city={placeFirst.city} />
          ) : (
            <MapWithPlace placeName="Bun's" city="Hamburg" />
          )}
        </div>
      </div>

      <Button className="w-min" type="submit" disabled={isPendingAction}>
        <Save /> {isPendingAction ? "Saving product..." : "Save product"}
      </Button>

      {state?.success && (
        <p aria-live="polite" className="text-xl text-green-700">
          Product created successfully!
        </p>
      )}
    </form>
  );
}
