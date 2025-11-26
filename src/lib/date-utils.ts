type Locale = "en" | "de";

/** e.g en, en-US, fr, fr-FR, es-ES, .. */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const languageLocal = (navigator.language ?? "de") as Locale;

const dateTimeFormatters = {
  "hh:mm": formatDateToHourAndMinute,
  "hh:mm:ss": formatDateToHourAndMinuteAndSecond,
  "MM-DD": formatDateToMonthAndDay,
  "MM-DD hh:mm": formatDateToMonthAndDayAndHourAndMinute,
  "MM-DD hh:mm:ss": formatDateToMonthAndDayAndHourAndMinuteAndSecond,
  "YYYY-MM-DD": formatDateToYearAndMonthAndDay,
  "YYYY-MM-DD hh:mm": formatDateToYearAndMonthAndDayAndHourAndMinute,
  "UTC YYYY-MM-DD": formatDateToUTCYearAndMonthAndDay,
} as const;

// REFERENCE: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat
export type DateTimeFormat = keyof typeof dateTimeFormatters;

/**
 * Global function to format date-time.
 */
export function formatDateTime(
  date: Date,
  format: DateTimeFormat,
  locale: Locale = languageLocal,
) {
  return dateTimeFormatters[format](date, locale);
}

/**
 * @example
 * 15:34
 */
function formatDateToHourAndMinute(
  date: Date,
  locale: Locale = languageLocal,
): string {
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

/**
 * @example
 * 15:34:12
 */
function formatDateToHourAndMinuteAndSecond(
  date: Date,
  locale: Locale = languageLocal,
): string {
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
}

/**
 * @example
 * 05/22
 */
function formatDateToMonthAndDay(
  date: Date,
  locale: Locale = languageLocal,
): string {
  return date.toLocaleDateString(locale, {
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * @example
 * 24.12.2021
 */
function formatDateToYearAndMonthAndDay(
  date: Date,
  locale: Locale = languageLocal,
): string {
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * @example
 * 25-11 15:34
 */
function formatDateToMonthAndDayAndHourAndMinute(
  date: Date,
  locale: Locale = languageLocal,
): string {
  return `${formatDateToMonthAndDay(date, locale)} ${formatDateToHourAndMinute(date, locale)}`;
}

/**
 * @example
 * 25-11 15:34:12
 */
function formatDateToMonthAndDayAndHourAndMinuteAndSecond(
  date: Date,
  locale: Locale = languageLocal,
): string {
  return `${formatDateToMonthAndDay(date, locale)} ${formatDateToHourAndMinuteAndSecond(
    date,
    locale,
  )}`;
}

/**
 * @example
 * 06/30/2022 18:22
 */
function formatDateToYearAndMonthAndDayAndHourAndMinute(
  date: Date,
  locale: Locale = languageLocal,
): string {
  return `${formatDateToYearAndMonthAndDay(date, locale)} ${formatDateToHourAndMinute(
    date,
    locale,
  )}`;
}

/**
 * String representation in the format YYYY-MM-DD.
 *
 * We take the time zone of the date into account.
 * With that offset, we create a new date which now is a "wrong date":
 * e.g.
 * - the given date is at
 *    4 pm with UTC + 2 hours
 * - the new date including the offset is then at
 *    6 pm with UTC + 2 hours
 *
 * This is obviously false, but we want to use the "toISOString" method, which uses
 * UTC. By creating this "false" date, the ISO string will be for the right day and time.
 *
 * If we would not take the time zone offset into account, "toISOString" could give us the wrong day & time
 * when the given date is around midnight, because UTC could jump to the previous/next day.
 *
 * @example
 * 2021-11-25
 */
function formatDateToUTCYearAndMonthAndDay(date: Date): string {
  const minutesOffset = date.getTimezoneOffset();
  const millisecondsOffset = minutesOffset * 60 * 1000;
  const falseLocalDate = new Date(date.getTime() - millisecondsOffset);

  return falseLocalDate.toISOString().substring(0, 10);
}
