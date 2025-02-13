import { isKeyOfObj, objectEntries } from "./utils";

function transformFromStringToNumber(numAsString: string | null) {
  if (numAsString === "" || numAsString === null) return null;

  const num = Number(numAsString);
  if (isNaN(num)) return null;

  return num;
}

type FormValueType = keyof typeof formDataTransformers;

export type FormConfig<T extends Record<string, unknown>> = {
  [K in keyof T]: FormValueType;
};
export type FormState<TConfig extends FormConfig<Record<string, unknown>>> = {
  [K in keyof TConfig]: TransformerResult<TConfig[K]>;
};

type TransformerResult<TFormValue extends FormValueType> = ReturnType<
  (typeof formDataTransformers)[TFormValue]
>;

const formDataTransformers = {
  string: (formData: FormData, key: string) =>
    (formData.get(key) as string | null) || null,
  number: (formData: FormData, key: string) =>
    transformFromStringToNumber(formData.get(key) as string | null),
  date: (formData: FormData, key: string) =>
    new Date(formData.get(key) as string),
} satisfies Record<string, (formData: FormData, key: string) => unknown>;

export function prepareFormState<
  TConfig extends FormConfig<Record<string, unknown>>,
>(formConfig: TConfig, formData: FormData): FormState<TConfig> {
  const formState = {} as FormState<TConfig>;

  objectEntries(formConfig).forEach(([configKey, formValueType]) => {
    if (!isKeyOfObj(formConfig, configKey))
      throw new Error(`Key ${configKey} not found in form config`);

    const transformer = formDataTransformers[formValueType];

    const valueTransformed = transformer(
      formData,
      configKey,
      // TODO There has to be a type-safe way... but the result cannot be extacted via the nested key of the form config
    ) as TransformerResult<TConfig[typeof configKey]>;

    formState[configKey] = valueTransformed;
  });

  return formState;
}
