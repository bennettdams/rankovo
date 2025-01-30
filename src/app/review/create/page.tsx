import { queries } from "@/data/queries";
import { schemaSearchParamSingle } from "@/lib/schemas";
import { NotepadText } from "lucide-react";
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
  const paramsParsed = schemaSearchParams.parse(await searchParams);
  const productsFound =
    !paramsParsed.productName && !paramsParsed.placeName
      ? []
      : await queries.searchProduct(paramsParsed);

  return (
    <div>
      <h1 className="mb-20 mt-10 flex flex-col items-center text-center text-4xl text-primary">
        <NotepadText className="size-14 text-secondary" />
        <span className="mt-6">Create a review</span>
      </h1>
      <CreateReviewForm products={productsFound} />
    </div>
  );
}
