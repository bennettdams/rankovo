import { queries } from "@/data/queries";
import { schemaSearchParamSingle } from "@/lib/schemas";
import { z } from "zod";
import { CreateReviewForm } from "./create-review-form.client";

const schemaSearchParams = z.object({
  q: schemaSearchParamSingle(z.string().min(1), "string"),
});

export default async function PageReviewCreate({
  searchParams,
}: {
  searchParams: Promise<unknown>;
}) {
  const paramsParsed = schemaSearchParams.parse(await searchParams);
  const productsFound = !paramsParsed.q
    ? []
    : await queries.searchProduct(paramsParsed.q);

  return <CreateReviewForm products={productsFound} />;
}
