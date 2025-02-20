import { reviewSources } from "@/data/static";
import { objectEntries } from "./utils";

/**
 * Takes an URL and tries to find a matching review source.
 * Strips the URL starting with `https://` or `http://` and `www.`.
 */
export function extractReviewSourceFromUrl(url: string) {
  const urlWithoutPrefix = url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "");

  return (
    objectEntries(reviewSources).find(([_, sourceUrl]) =>
      urlWithoutPrefix.startsWith(sourceUrl),
    )?.[0] ?? null
  );
}
