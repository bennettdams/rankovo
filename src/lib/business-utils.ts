import { reviewSources } from "@/data/static";
import { objectEntries } from "./utils";

/**
 * Takes a URL and returns the matching review source, or null.
 * Compares the parsed hostname (without a leading `www.`) to known hosts.
 */
export function extractReviewSourceFromUrl(url: string) {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return null;
  }

  const host = hostname.replace(/^www\./, "");

  return (
    objectEntries(reviewSources).find(
      ([, sourceHost]) => host === sourceHost,
    )?.[0] ?? null
  );
}
