import { cn } from "@/lib/utils";

export function Fieldset({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("grid w-80 items-center gap-1.5", className)}>
      {children}
    </fieldset>
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
