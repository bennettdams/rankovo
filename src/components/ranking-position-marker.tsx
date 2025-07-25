import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function RankingPositionMarker({
  position,
  labelOverwrite,
}: {
  position: number;
  labelOverwrite?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-2 grid size-12 place-items-center rounded-full border-2 border-gray",
        position === 1 && "border-none bg-[#FFD966]",
        position === 2 && "border-none bg-[#B7CADB]",
        position === 3 && "border-none bg-[#c27d6e]",
      )}
    >
      {labelOverwrite ?? (
        <p
          className={cn("text-white", position === 1 ? "text-4xl" : "text-2xl")}
        >
          {position}
        </p>
      )}
    </div>
  );
}
