"use client";
import {
  type DateTimeFormat,
  formatDateTime,
  languageDefault,
} from "@/lib/date-utils";
import { useSyncExternalStore } from "react";

function emptySubscribe() {
  return () => {};
}

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
    () => formatDateTime(dateExternal, format, languageDefault),
  );

  return <time dateTime={dateExternal.toISOString()}>{dateFormatted}</time>;
}
