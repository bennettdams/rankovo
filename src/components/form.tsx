export function Fieldset({ children }: { children: React.ReactNode }) {
  return (
    <fieldset className="grid w-80 items-center gap-1.5">{children}</fieldset>
  );
}

export function FieldError({
  errorMsg,
}: {
  errorMsg: string | string[] | undefined;
}) {
  return (
    errorMsg && (
      <p aria-live="polite" className="text-error">
        {errorMsg}
      </p>
    )
  );
}
