"use client";
import { DateTimeFormat, formatDateTime } from "@/lib/date-utils";
import { useSyncExternalStore } from "react";

function emptySubscribe() {
  return () => {};
}

const localeServerDefault = "de";

/**
 * Component to render formatted dates. Avoids hydration mismatches.
 */
export function DateTime({
  date: dateExternal,
  format,
}: {
  date: Date;
  format: DateTimeFormat;
}) {
  const dateFormatted = useSyncExternalStore(
    emptySubscribe,
    () => formatDateTime(dateExternal, format),
    () => formatDateTime(dateExternal, format, localeServerDefault),
  );

  return <time dateTime={dateExternal.toISOString()}>{dateFormatted}</time>;
}
