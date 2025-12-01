import type { AssertEqual } from "./utils";

const translations = {
  en: {
    // Other
    "about-us": "About Us",
    reviews: "Reviews",
    // Categories
    "bread & bakery": "Brot & Bäckerei",
    breakfast: "Breakfast",
    burger: "Burger",
    chicken: "Chicken",
    dessert: "Dessert",
    drinks: "Drinks",
    "grill & barbecue": "Grill & Barbecue",
    doener: "Döner",
    noodles: "Noodles",
    pizza: "Pizza",
    salad: "Salad",
    sandwich: "Sandwich",
    seafood: "Seafood",
    snack: "Snack",
    soup: "Soup",
    sushi: "Sushi",
  },
  de: {
    // Other
    "about-us": "Über uns",
    reviews: "Bewertungen",
    // Categories
    "bread & bakery": "Backwaren",
    breakfast: "Frühstück",
    burger: "Burger",
    chicken: "Hähnchen",
    dessert: "Dessert",
    drinks: "Drinks",
    "grill & barbecue": "Grill & Barbecue",
    doener: "Döner",
    noodles: "Nudeln",
    pizza: "Pizza",
    salad: "Salat",
    sandwich: "Sandwich",
    seafood: "Seafood",
    snack: "Snack",
    soup: "Suppe",
    sushi: "Sushi",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["en"];

type HasAllTranslationKeys = AssertEqual<
  TranslationKey,
  keyof (typeof translations)["de"]
>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const missingTranslationKeys: AssertEqual<HasAllTranslationKeys, true> = true;

export const t = translations["de"];
