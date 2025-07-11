import { cn } from "@/lib/utils";
import { filterButtonStyles } from "./filter-button";

export const formInputWidth = "w-full md:w-80";

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

/** This component does not allow unselecting, as it uses native radio buttons under the hood. */
export function SelectionFormField({
  name,
  options,
  defaultValue,
}: {
  name: string;
  options: string[] | ReadonlyArray<string>;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label key={option}>
          <input
            type="radio"
            name={name}
            value={option}
            defaultChecked={defaultValue === option}
            className="peer hidden"
          />
          <div
            className={cn(
              filterButtonStyles.default,
              filterButtonStyles.activeViaPeer,
            )}
          >
            <span className="capitalize">{option}</span>
          </div>
        </label>
      ))}
    </div>
  );
}
