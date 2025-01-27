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
  className,
}: {
  errorMsg: string | string[] | undefined;
  className?: string;
}) {
  return (
    errorMsg && (
      <p aria-live="polite" className={cn("text-error", className)}>
        {errorMsg}
      </p>
    )
  );
}
