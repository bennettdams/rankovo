import { CategoriesSelection } from "@/components/categories-selection";
import { FieldError, Fieldset } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actionCreateProduct, ProductCreate } from "@/data/actions";
import { Category } from "@/data/static";
import { schemaCreateProduct } from "@/db/db-schema";
import { transformFromStringToNumber } from "@/lib/form-utils";
import { Save } from "lucide-react";
import { useActionState, useState } from "react";

const formKeys = {
  name: "name",
  note: "note",
  category: "category",
  placeId: "placeId",
};

export type FormStateCreateProduct = ReturnType<
  typeof prepareFormDataProductCreate
>;

export function prepareFormDataProductCreate(formData: FormData) {
  return {
    name: (formData.get(formKeys.name) as string | null) || null,
    note: (formData.get(formKeys.note) as string | null) || null,
    category: (formData.get(formKeys.category) as string | null) || null,
    placeId: transformFromStringToNumber(
      formData.get(formKeys.placeId) as string | null,
    ),
  } satisfies Record<keyof ProductCreate, unknown>;
}

function createProduct(_: unknown, formData: FormData) {
  const formState = prepareFormDataProductCreate(formData);

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

export function CreateProductForm() {
  const [state, formAction, isPendingAction] = useActionState(
    createProduct,
    null,
  );
  const [categorySelected, setCategorySelected] = useState<Category | null>(
    null,
  );

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
        <CategoriesSelection
          categoriesActive={!categorySelected ? null : [categorySelected]}
          onClick={(categorySelected) => setCategorySelected(categorySelected)}
        />
        <Input
          type="hidden"
          // can't use undefined here because it will make it an uncontrolled input
          value={categorySelected ?? state?.values?.category ?? ""}
          name={formKeys.category}
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

      <Fieldset>
        <Label htmlFor={formKeys.placeId}>Place</Label>
        <Input
          name={formKeys.placeId}
          placeholder=""
          defaultValue={state?.values?.placeId ?? undefined}
        />
        <FieldError errorMsg={state?.errors?.placeId} />
      </Fieldset>

      <Button className="w-min" type="submit" disabled={isPendingAction}>
        <Save /> {isPendingAction ? "Saving..." : "Save"}
      </Button>

      {state?.success && (
        <p aria-live="polite" className="text-xl text-green-700">
          Product created successfully!
        </p>
      )}
    </form>
  );
}
