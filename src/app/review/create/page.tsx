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
    <div>
      <h1 className="mb-20 mt-10 flex flex-col items-center text-center text-4xl text-primary">
        <NotepadText className="size-14 text-secondary" />
        <span className="mt-6">Create a review</span>
      </h1>

      <Suspense
        fallback={
          <CreateReviewForm productsForSearch={[]} placesForSearch={[]} />
        }
      >
        <FormWrapper searchParams={searchParams} />
      </Suspense>
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
