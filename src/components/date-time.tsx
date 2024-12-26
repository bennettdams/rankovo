"use client";
import { DateTimeFormat, formatDateTime } from "@/lib/date-utils";
import { useEffect, useState } from "react";

/**
 * Client component to render date-time. Avoids hydration mismatches.
 */
export function DateTime({
  date,
  format,
  title,
}: {
  date: Date;
  format: DateTimeFormat;
  title?: string;
}) {
  // initialize with null to prevent server-render mismatches
  const [dateTransformed, setDateTransformed] = useState<{
    dateFormatted: string;
    dateTime: string;
  } | null>(null);

  useEffect(() => {
    setDateTransformed({
      dateFormatted: formatDateTime(date, format),
      dateTime: formatDateTime(date, "UTC YYYY-MM-DD"),
    });
  }, [date, format]);

  return (
    <time
      dateTime={dateTransformed?.dateTime}
      title={`${title ? title + " " : ""}${dateTransformed?.dateFormatted}`}
    >
      {dateTransformed?.dateFormatted}
    </time>
  );
}
