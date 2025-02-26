import { cities, type City } from "@/data/static";
import { FilterButton } from "./filter-button";

export function CitiesSelection({
  onClick,
  citiesActive,
}: {
  onClick: (city: City) => void;
  citiesActive: City[] | null;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {cities.map((city) => (
        <FilterButton
          key={city}
          isActive={citiesActive === null ? true : citiesActive.includes(city)}
          onMouseDown={() => onClick(city)}
        >
          <span className="capitalize">{city}</span>
        </FilterButton>
      ))}
    </div>
  );
}
