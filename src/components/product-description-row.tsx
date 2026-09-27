import type { City } from "@/data/static";
import { formatCitiesLabel } from "@/lib/cities";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

function ProductDescriptionRowBase({
  productName,
  showBold,
  children,
}: {
  productName: string;
  showBold: boolean;
  children?: ReactNode;
}) {
  return (
    // Keep the metadata at its natural height so a growing form cannot clip its text.
    <div className="flex shrink-0 flex-col overflow-hidden text-start">
      <p className={cn("truncate text-lg", showBold && "font-bold")}>
        {productName}
      </p>
      <p className="line-clamp-2 h-12 text-ellipsis text-secondary group-hover/ranking-card-row:text-secondary-fg">
        {children}
      </p>
    </div>
  );
}

export function ProductDescriptionRow({
  productName,
  placeName,
  cities,
  showBold,
}: {
  productName: string;
  placeName: string;
  cities: City[];
  showBold: boolean;
}) {
  const citiesLabel = formatCitiesLabel(cities);

  return (
    <ProductDescriptionRowBase productName={productName} showBold={showBold}>
      <span>{placeName}</span>

      {citiesLabel && (
        <>
          <span className="ml-2">•</span>
          <span className="ml-2">{citiesLabel}</span>
        </>
      )}
    </ProductDescriptionRowBase>
  );
}

export function EmptyProductDescriptionRow({
  showBold,
}: {
  showBold: boolean;
}) {
  return <ProductDescriptionRowBase productName="-" showBold={showBold} />;
}
