import { cn } from "@/lib/utils";
import { formatCitiesLabel } from "@/lib/cities";
import type { City } from "@/data/static";

export function ProductDescriptionRow({
  productName,
  placeName,
  cities,
  showBold,
}: {
  productName: string | null;
  placeName: string | null;
  cities: City[];
  showBold: boolean;
}) {
  const citiesLabel = formatCitiesLabel(cities);

  return (
    <div className="flex flex-col overflow-hidden text-start">
      <p className={cn("truncate text-lg", showBold && "font-bold")}>
        {productName ?? "-"}
      </p>

      <p className="line-clamp-2 h-12 text-ellipsis text-secondary group-hover/ranking-card-row:text-secondary-fg">
        {placeName && (
          <>
            <span>{placeName}</span>

            {citiesLabel && (
              <>
                <span className="ml-2">•</span>
                <span className="ml-2">{citiesLabel}</span>
              </>
            )}
          </>
        )}
      </p>
    </div>
  );
}
