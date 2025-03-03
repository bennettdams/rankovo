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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    objectEntries(reviewSources).find(([_, sourceUrl]) =>
      urlWithoutPrefix.startsWith(sourceUrl),
    )?.[0] ?? null
  );
}
