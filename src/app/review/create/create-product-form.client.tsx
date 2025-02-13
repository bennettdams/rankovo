import { CategoriesSelectionFormField } from "@/components/categories-selection";
import { FieldError, Fieldset } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  actionCreateProduct,
  type ProductCreate,
  type ProductCreatedAction,
} from "@/data/actions";
import { schemaCreateProduct } from "@/db/db-schema";
import {
  type FormConfig,
  type FormState,
  prepareFormState,
} from "@/lib/form-utils";
import { Save } from "lucide-react";
import { useActionState, useEffect } from "react";

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
  onCreatedProduct,
}: {
  onCreatedProduct: (productCreated: ProductCreatedAction) => void;
}) {
  const [state, formAction, isPendingAction] = useActionState(
    createProduct,
    null,
  );

  // Unfortunately I don't think there is a better way to call a callback after a succesful server action submission.
  useEffect(() => {
    if (state?.success && state.productCreated) {
      onCreatedProduct(state.productCreated);
    }
  }, [state?.success, state?.productCreated, onCreatedProduct]);

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
