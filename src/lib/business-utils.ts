import {
  ratingHighest,
  ratingLowest,
  reviewSources,
  type CategoryActive,
} from "@/data/static";
import { objectEntries } from "./utils";

/** Earlier entries win, so "Chicken Burger" counts as a burger. */
const keywordsByCategory: [CategoryActive, string[]][] = [
  ["burger", ["burger", "smash"]],
  [
    "doener",
    ["döner", "doener", "doner", "kebab", "kebap", "dürüm", "durum", "yufka"],
  ],
  ["pizza", ["pizza", "margherita", "calzone"]],
  ["sandwich", ["sandwich", "panini", "pastrami", "baguette"]],
  [
    "chicken",
    ["chicken", "hähnchen", "haehnchen", "wings", "nuggets", "tenders"],
  ],
];

export function guessCategoryFromName(
  productName: string,
): CategoryActive | null {
  const name = productName.toLowerCase();
  for (const [category, keywords] of keywordsByCategory) {
    if (keywords.some((keyword) => name.includes(keyword))) return category;
  }
  return null;
}

export function isRatingInRange(rating: number | null): rating is number {
  return (
    rating != null &&
    Number.isFinite(rating) &&
    rating >= ratingLowest &&
    rating <= ratingHighest
  );
}

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
