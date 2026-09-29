"use client";

import { RankingsFiltersMobile } from "@/components/rankings-filters.client";
import { useRef } from "react";

/**
 * Wrapper for rankings section that renders:
 * - Desktop: sidebar filters + list
 * - Mobile: list + floating filter button with drawer
 */
export function RankingsSectionClient({
  filtersSlot,
  listSlot,
}: {
  filtersSlot: React.ReactNode;
  listSlot: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className="mt-10 flex flex-col gap-y-10 md:flex-row md:gap-x-10"
    >
      {/* Desktop: sidebar filters */}
      <div
        className="hidden basis-auto md:sticky md:top-6 md:block md:h-fit md:basis-1/4"
      >
        {filtersSlot}
      </div>

      {/* List content */}
      <div className="basis-full overflow-y-hidden md:basis-3/4">
        {listSlot}
      </div>

      {/* Mobile: floating filter button + drawer */}
      <RankingsFiltersMobile sectionRef={ref} filtersSlot={filtersSlot} />
    </div>
  );
}
