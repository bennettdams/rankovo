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
      className="mt-10 flex flex-col gap-y-10 md:flex-row md:gap-x-4"
    >
      {/* Desktop: sidebar filters */}
      <div className="hidden basis-auto md:block md:basis-1/3">
        {filtersSlot}
      </div>

      {/* List content */}
      <div className="basis-full overflow-y-hidden md:basis-2/3">
        {listSlot}
      </div>

      {/* Mobile: floating filter button + drawer */}
      <RankingsFiltersMobile sectionRef={ref} filtersSlot={filtersSlot} />
    </div>
  );
}
