"use client";

import type { City } from "@/data/static";

export function MapWithPlace({
  placeName,
  city,
}: {
  placeName: string;
  city: City;
}) {
  const placeSearch = `${encodeURIComponent(placeName)} ${encodeURIComponent(city)}`;

  return (
    <div>
      <iframe
        className="size-full overflow-hidden rounded-3xl"
        src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY}&q=${placeSearch}`}
      />
    </div>
  );
}
