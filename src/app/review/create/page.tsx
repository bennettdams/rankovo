import { queries } from "@/data/queries";
import { schemaSearchParamSingle } from "@/lib/schemas";
import { NotepadText } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { z } from "zod";
import { CreateReviewForm } from "./create-review-form.client";

export const metadata: Metadata = {
  title: "Rankovo | Bewertung abgeben",
};

const schemaSearchParams = z.object({
  "product-name": schemaSearchParamSingle(z.string().min(1), "string"),
  "place-name": schemaSearchParamSingle(z.string().min(1), "string"),
});
export type SearchParamsCreateReview = z.output<typeof schemaSearchParams>;

export default async function PageReviewCreate({
  searchParams,
}: {
  searchParams: Promise<unknown>;
}) {
  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <div className="overflow-hidden pb-12 pt-16">
        <div className="mx-auto max-w-4xl animate-appear px-4">
          <h1 className="flex flex-col items-center text-center">
            <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-[#6c3e6e]/40 shadow-lg">
              <NotepadText className="size-10 text-white" />
            </div>
            <span className="text-5xl font-bold text-primary">
              Eine Bewertung abgeben
            </span>
            <p className="mt-4 text-lg text-secondary">
              Teile deine Erfahrung und hilf anderen, großartige Produkte zu
              entdecken
            </p>
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-12">
        <Suspense
          fallback={
            <CreateReviewForm productsForSearch={[]} placesForSearch={[]} />
          }
        >
          <FormWrapper searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function FormWrapper({
  searchParams,
}: {
  searchParams: Promise<unknown>;
}) {
  const paramsParsed = schemaSearchParams.parse(await searchParams);

  const productsForSearch = !paramsParsed["product-name"]
    ? []
    : await queries.searchProducts(paramsParsed["product-name"]);

  const placesForSearch = !paramsParsed["place-name"]
    ? []
    : await queries.searchPlaces(paramsParsed["place-name"]);

  return (
    <CreateReviewForm
      productsForSearch={productsForSearch}
      placesForSearch={placesForSearch}
    />
  );
}
