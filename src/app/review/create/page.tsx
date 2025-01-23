import { queries } from "@/data/queries";
import { schemaSearchParamSingle } from "@/lib/schemas";
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
      <h1 className="text-center text-3xl text-primary">Create a Review</h1>
      <CreateReviewForm products={productsFound} />;
    </div>
  );
}
