import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function RankingPositionMarker({
  position,
  labelOverwrite,
  size = "md",
}: {
  position: number;
  labelOverwrite?: ReactNode;
  size?: "md" | "lg";
}) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-full text-fg",
        size === "lg" ? "size-14" : "size-12",
        position <= 3 && "shadow-lg",
        position > 3 && "border-2 border-gray",
        position === 1 &&
          "bg-linear-to-br from-yellow-500 via-yellow-400 to-yellow-600 text-white",
        position === 2 &&
          "bg-linear-to-br from-slate-400 via-slate-300 to-slate-500 text-fg",
        position === 3 &&
          "bg-linear-to-br from-amber-700 via-amber-600 to-amber-800 text-white",
      )}
    >
      {labelOverwrite ?? (
        <p className={cn(position === 1 ? "text-4xl" : "text-2xl")}>
          {position}
        </p>
      )}
    </div>
  );
}
