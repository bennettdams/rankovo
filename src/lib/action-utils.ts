// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ActionDataExtract<TFn extends (...args: any[]) => Promise<any>> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TFn extends (...args: any[]) => Promise<infer UReturnType>
    ? UReturnType extends { status: "SUCCESS"; data: infer UData }
      ? UData
      : never
    : never;

type ActionDataBase = Record<string, unknown> | null;
type FormStateBase = Record<string, unknown>;

export type ActionStateSuccess = {
  status: "SUCCESS";
  formState: FormStateBase;
  data: unknown;
};
export type ActionStateError = {
  status: "ERROR";
  formState: FormStateBase;
  errors: Partial<Record<keyof FormStateBase, string[]>>;
};

type FormErrors<TFormState extends FormStateBase> = Partial<
  Record<keyof TFormState, string[]>
>;

export function withCallbacks<
  TArgs extends unknown[],
  TFormState extends FormStateBase,
  TActionData extends ActionDataBase,
  TActionState extends
    | {
        status: "SUCCESS";
        formState: TFormState;
        data: TActionData;
      }
    | {
        status: "ERROR";
        formState: TFormState;
        errors: FormErrors<TFormState>;
      },
>(
  action: (...args: TArgs) => Promise<TActionState>,
  callbacks?: {
    onSuccess?: TActionState extends { status: "SUCCESS" }
      ? ((actionData: NonNullable<TActionState["data"]>) => void) | (() => void)
      : never;
    onError?: TActionState extends { status: "ERROR" }
      ? (errors: FormErrors<TFormState>) => void
      : never;
  },
): (...args: TArgs) => Promise<TActionState> {
  return async (...args: TArgs) => {
    const promise = action(...args);

    const result = await promise;

    if (result.status === "SUCCESS") {
      if (result.data === null) {
        // FIXME How to make this a valid call for the given type?
        (callbacks?.onSuccess as (() => void) | undefined)?.();
      } else {
        callbacks?.onSuccess?.(result.data);
      }
    }

    if (result.status === "ERROR") {
      callbacks?.onError?.(result.errors);
    }

    return promise;
  };
}
