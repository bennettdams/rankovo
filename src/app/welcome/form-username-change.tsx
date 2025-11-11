"use client";

import { FieldError, Fieldset } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actionChangeUsername, type UsernameChange } from "@/data/actions";
import { schemaUpdateUsername } from "@/db/db-schema";
import { withCallbacks, type ActionStateError } from "@/lib/action-utils";
import { useUserAuth } from "@/lib/auth-client";
import {
  prepareFormState,
  type FormConfig,
  type FormState,
} from "@/lib/form-utils";
import { routes } from "@/lib/navigation";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";

export const formKeys = {
  name: "name",
} as const satisfies Record<keyof typeof formConfig, string>;

const formConfig = {
  name: "string",
} satisfies FormConfig<UsernameChange>;

export type FormStateChangeUsername = FormState<typeof formConfig>;

async function changeUsername(_: unknown, formData: FormData) {
  const formState = prepareFormState(formConfig, formData);

  const {
    success,
    error,
    data: usernameParsed,
  } = schemaUpdateUsername.safeParse(formState);

  if (!success) {
    return {
      status: "ERROR",
      formState,
      errors: error.flatten().fieldErrors,
    } satisfies ActionStateError;
  }

  return actionChangeUsername(formState, usernameParsed, formKeys.name);
}

export function FormUsernameChange() {
  const router = useRouter();
  const userAuth = useUserAuth();

  const [state, formAction, isPendingAction] = useActionState(
    withCallbacks(changeUsername, {
      onSuccess: () => {
        console.debug("Username changed successfully");

        userAuth.refetch();
        router.push(routes.home);
      },
    }),
    null,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col items-center gap-y-6"
      noValidate
    >
      <Fieldset>
        <Input
          name={formKeys.name}
          defaultValue={state?.formState.name ?? userAuth.username ?? undefined}
        />
        <FieldError errorMsg={state?.errors?.name} />
      </Fieldset>

      <Button className="w-min" type="submit" disabled={isPendingAction}>
        <Save /> {isPendingAction ? "Saving..." : "Save"}
      </Button>

      {state?.status === "SUCCESS" && (
        <p aria-live="polite" className="text-xl text-green-700">
          Username updated successfully!
        </p>
      )}

      {/* // TODO add global error unrelated to schema validation */}
    </form>
  );
}
