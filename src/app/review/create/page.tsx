import { queries } from "@/data/queries";
import { schemaSearchParamSingle } from "@/lib/schemas";
import { NotepadText } from "lucide-react";
import { Suspense } from "react";
import { z } from "zod";
import { CreateReviewForm } from "./create-review-form.client";

const schemaSearchParams = z.object({
  productName: schemaSearchParamSingle(z.string().min(1), "string"),
  placeName: schemaSearchParamSingle(z.string().min(1), "string"),
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
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="flex flex-col items-center text-center">
            <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-[#6c3e6e]/40 shadow-lg">
              <NotepadText className="size-10 text-white" />
            </div>
            <span className="text-5xl font-bold text-primary">
              Create a review
            </span>
            <p className="mt-4 text-lg text-secondary">
              Share your experience and help others discover great products
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
  const productsForSearch =
    !paramsParsed.productName && !paramsParsed.placeName
      ? []
      : await queries.rankings({
          productName: paramsParsed.productName,
          placeName: paramsParsed.placeName,
          categories: null,
          cities: null,
          critics: null,
          ratingMin: null,
          ratingMax: null,
        });

  const placesForSearch = !paramsParsed.placeName
    ? []
    : await queries.searchPlaces(paramsParsed.placeName);

  return (
    <CreateReviewForm
      productsForSearch={productsForSearch}
      placesForSearch={placesForSearch}
    />
  );
}
