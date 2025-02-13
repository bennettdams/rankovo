import { cn } from "@/lib/utils";

export const formInputWidth = "w-80";

export function Fieldset({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <fieldset
      className={cn("grid items-center gap-1.5", formInputWidth, className)}
    >
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
