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

type FormErrors<TFormState extends FormStateBase> = Partial<
  Record<keyof TFormState, string[]>
>;

export type ActionStateSuccess<
  TFormState extends FormStateBase = FormStateBase,
  TData = unknown,
> = {
  status: "SUCCESS";
  formState: TFormState;
  data: TData;
};

type ActionStateErrorBase<TFormState extends FormStateBase> = {
  status: "ERROR";
  formState: TFormState;
};

export type ActionStateError<TFormState extends FormStateBase = FormStateBase> =
  ActionStateErrorBase<TFormState> &
    (
      | { errors: FormErrors<TFormState>; rootErrors?: string[] }
      | { errors?: FormErrors<TFormState>; rootErrors: string[] }
    );

export function getActionRootErrors(
  state: ActionStateSuccess | ActionStateError | null,
): string[] | undefined {
  return state?.status === "ERROR" ? state.rootErrors : undefined;
}

type ActionState<
  TFormState extends FormStateBase,
  TActionData extends ActionDataBase,
> = ActionStateSuccess<TFormState, TActionData> | ActionStateError<TFormState>;

type SuccessData<TActionState> = TActionState extends {
  status: "SUCCESS";
  data: infer TData;
}
  ? TData
  : never;

export function withCallbacks<
  TArgs extends unknown[],
  TFormState extends FormStateBase,
  TActionData extends ActionDataBase,
  TActionState extends ActionState<TFormState, TActionData>,
>(
  action: (...args: TArgs) => Promise<TActionState>,
  callbacks?: {
    onSuccess?: TActionState extends { status: "SUCCESS" }
      ? (actionData: SuccessData<TActionState>) => void
      : never;
    onError?: TActionState extends { status: "ERROR" }
      ? (error: ActionStateError<TFormState>) => void
      : never;
  },
): (...args: TArgs) => Promise<TActionState> {
  return async (...args: TArgs) => {
    const promise = action(...args);

    // Needed so `status` narrows to SUCCESS/ERROR and we can pass `result`
    // into onSuccess/onError.
    //
    // TS *will* narrow a concrete union:
    //   type Result =
    //     | { status: "SUCCESS"; data: { id: number } }
    //     | { status: "ERROR"; errors: { name?: string[] } }
    //   if (result.status === "ERROR") result.errors // ok
    //
    // `await promise` is TActionState: a type *parameter* `T extends Result`,
    // not Result itself. T might be only SUCCESS, only ERROR, or the full
    // union. Discriminant narrowing only filters union members, so it does
    // not apply to T — `result.errors` stays invalid. We widen to the
    // concrete union (subtype → supertype, not an assertion). Callers still
    // get TActionState back via `return promise`.
    const result: ActionState<TFormState, TActionData> = await promise;

    if (result.status === "SUCCESS") {
      callbacks?.onSuccess?.(result.data);
    }

    if (result.status === "ERROR") {
      callbacks?.onError?.(result);
    }

    return promise;
  };
}
