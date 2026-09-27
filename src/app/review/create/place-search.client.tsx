"use client";

import { LoadingSpinner } from "@/components/loading-spinner";
import { Input } from "@/components/ui/input";
import type { PlaceSearchQuery, UserRecentPlaceQuery } from "@/data/queries";
import { minCharsSearch, shouldRunSearch } from "@/data/static";
import { formatCitiesLabel } from "@/lib/cities";
import { routes } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { ChevronRight, Plus } from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function PlaceSearchView({
  queryInitial,
  placesFound,
  placesRecent,
  isSignedIn,
}: {
  queryInitial: string | null;
  placesFound: PlaceSearchQuery[];
  placesRecent: UserRecentPlaceQuery[];
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(queryInitial ?? "");
  const [isSearching, startSearch] = useTransition();

  const queryTrimmed = query.trim();
  const hasQuery = queryTrimmed.length > 0;
  const hasValidSearch = shouldRunSearch(query);

  function changeSearchQuery(queryNew: string) {
    setQuery(queryNew);

    const url = routes.reviewCreateSearch(queryNew);

    if (shouldRunSearch(queryNew)) {
      startSearch(() => router.replace(url, { scroll: false }));
    } else {
      window.history.replaceState(null, "", url);
    }
  }

  return (
    <div className="animate-appear space-y-6">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold text-fg md:text-5xl">Wo warst du?</h1>
        <p className="text-lg text-dark-gray">
          Such das Restaurant. Danach bewertest du, was du dort gegessen hast.
        </p>
      </header>

      {!isSignedIn && (
        <p className="rounded-lg bg-primary/10 px-4 py-3 text-sm ring-1 ring-primary/30">
          Melde dich an, um Bewertungen zu speichern.
        </p>
      )}

      <div className="relative">
        <label htmlFor="place-search" className="sr-only">
          Restaurant oder Gericht
        </label>
        <Input
          id="place-search"
          type="search"
          autoFocus
          autoComplete="off"
          placeholder='Restaurant oder Gericht, z. B. "Five Guys"'
          value={query}
          onChange={(e) => changeSearchQuery(e.target.value)}
          className="h-14 rounded-xl bg-white pr-12 text-lg shadow-sm"
        />
        {isSearching && (
          <LoadingSpinner className="absolute top-1/2 right-4 size-5 -translate-y-1/2" />
        )}
      </div>

      {
        /* A non-empty query below the search threshold can only start a new place. */
        hasQuery && !hasValidSearch ? (
          <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
            <p className="border-b border-light-gray px-4 py-3 text-dark-gray">
              Ab {minCharsSearch} Zeichen suchen wir nach Restaurants und
              Gerichten.
            </p>
            <ul>
              <li>
                <CreateNewPlaceLink
                  placeName={queryTrimmed}
                  href={routes.reviewCreateNewPlace(queryTrimmed)}
                />
              </li>
            </ul>
          </section>
        ) : /* An empty query shows the user's recent places, or the search hint. */
        !hasQuery ? (
          placesRecent.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-dark-gray">
                Zuletzt von dir bewertet
              </h2>
              <div className="flex flex-wrap gap-2">
                {placesRecent.map((place) => (
                  <Link
                    key={place.id}
                    href={routes.reviewCreateAtPlace(place.id)}
                    className="inline-flex items-center gap-2 rounded-full bg-gray px-4 py-2 transition-colors hover:bg-secondary hover:text-secondary-fg"
                  >
                    {place.name}
                    <LinkPendingSpinner className="size-4 fill-current" />
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <p className="text-dark-gray">
              Tipp: Du kannst auch nach einem Gericht suchen, wenn dir der Name
              des Restaurants nicht einfällt.
            </p>
          )
        ) : (
          /* A valid query shows the current results, even while the next search loads. */
          <section
            aria-label="Suchergebnisse"
            aria-busy={isSearching}
            className={cn(
              "overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-opacity",
              isSearching && "opacity-60",
            )}
          >
            {placesFound.length === 0 && (
              <p className="border-b border-light-gray px-4 py-3 text-dark-gray">
                Kein Restaurant gefunden.
              </p>
            )}

            <ul className="divide-y divide-light-gray">
              {placesFound.map((place) => (
                <li key={place.id}>
                  <Link
                    href={routes.reviewCreateAtPlace(place.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-primary/5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {place.name}
                      </span>
                      <span className="block truncate text-sm text-dark-gray">
                        <PlaceMetaLabel place={place} />
                      </span>
                    </span>
                    <PlaceLinkTrailingIcon />
                  </Link>
                </li>
              ))}

              <li>
                <CreateNewPlaceLink
                  placeName={queryTrimmed}
                  href={routes.reviewCreateNewPlace(queryTrimmed)}
                />
              </li>
            </ul>
          </section>
        )
      }
    </div>
  );
}

function CreateNewPlaceLink({
  placeName,
  href,
}: {
  placeName: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex w-full items-center gap-3 px-4 py-3 text-left font-medium text-primary transition-colors hover:bg-primary/5"
    >
      <Plus className="size-5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">
        &quot;{placeName}&quot; als neues Restaurant anlegen
      </span>
      <LinkPendingSpinner className="size-5" />
    </Link>
  );
}

function LinkPendingSpinner({ className }: { className: string }) {
  const { pending } = useLinkStatus();
  return (
    <LoadingSpinner
      className={cn(className, !pending && "invisible")}
      aria-hidden
    />
  );
}

function PlaceLinkTrailingIcon() {
  const { pending } = useLinkStatus();
  return pending ? (
    <LoadingSpinner className="size-5" />
  ) : (
    <ChevronRight className="size-5 text-dark-gray" />
  );
}

function PlaceMetaLabel({ place }: { place: PlaceSearchQuery }) {
  const parts = [
    formatCitiesLabel(place.cities),
    `${place.numOfProducts} ${place.numOfProducts === 1 ? "Produkt" : "Produkte"}`,
  ].filter(Boolean);

  return (
    <>
      {parts.join(" · ")}
      {place.productNameMatched && (
        <span>
          {" · mit "}
          <span className="font-medium text-fg">
            {place.productNameMatched}
          </span>
        </span>
      )}
    </>
  );
}
