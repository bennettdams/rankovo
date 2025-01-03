"use client";

import { useState } from "react";
import { Button } from "./ui/button";

function getDemoPlace(p: string) {
  return p === "Five Guys Hamburg" ? "Buns Hamburg" : "Five Guys Hamburg";
}

export function MapWithPlace() {
  const [placeId, setPlaceId] = useState(getDemoPlace("Five Guys Hamburg"));

  return (
    <div>
      <Button
        onClick={() => {
          setPlaceId(getDemoPlace(placeId));
        }}
      >
        Switch
      </Button>

      <iframe
        className="size-full h-[32rem] overflow-hidden rounded-3xl"
        src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY}&q=${placeId}`}
      />
    </div>
  );
}