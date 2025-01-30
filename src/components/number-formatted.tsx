const defaultLocale = "en";

type NumProps = {
  num: number;
  min?: number;
  max?: number;
  locale?: string;
};

export function NumberFormatted({
  num,
  min = 0,
  max,
  locale = defaultLocale,
}: NumProps) {
  if (isNaN(num)) {
    console.error(`Given number '${num}' is NaN`);
    return <span>Invalid number</span>;
  }

  const numFormatted = formatNumber({ num, min, max, locale });
  const numFormattedWithoutMaxFraction = formatNumber({ num, min, locale });

  return <span title={numFormattedWithoutMaxFraction}>{numFormatted}</span>;
}

function formatNumber({ num, min = 0, max, locale = defaultLocale }: NumProps) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  }).format(num);
}
