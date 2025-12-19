import { cn } from "@/lib/utils";

export function ProductDescriptionRow({
  productName,
  placeName,
  city,
  showBold,
}: {
  productName: string | null;
  placeName: string | null;
  city: string | null;
  showBold: boolean;
}) {
  return (
    <div className="flex flex-col overflow-hidden text-start">
      <p className={cn("truncate text-lg", showBold && "font-bold")}>
        {productName ?? "-"}
      </p>

      <p className="line-clamp-2 h-12 text-ellipsis text-secondary group-hover/ranking-card-row:text-secondary-fg">
        {placeName && (
          <>
            <span>{placeName}</span>

            {city && (
              <>
                <span className="ml-2">•</span>
                <span className="ml-2">{city}</span>
              </>
            )}
          </>
        )}
      </p>
    </div>
  );
}
