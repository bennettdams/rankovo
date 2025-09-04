"use client";

import type { City } from "@/data/static";
import { useState } from "react";

export function MapWithPlace({
  placeName,
  city,
}: {
  placeName: string;
  city: City;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const placeSearch = `${encodeURIComponent(placeName)} ${encodeURIComponent(city)}`;

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-3xl bg-light-gray">
      {!isLoaded && (
        <div className="absolute inset-0 rounded-3xl bg-light-gray">
          <div className="sr-only">Loading map...</div>
        </div>
      )}
      <iframe
        className="h-full w-full border-0"
        src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY}&q=${placeSearch}`}
        onLoad={() => setIsLoaded(true)}
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
        }}
      />
    </div>
  );
}
