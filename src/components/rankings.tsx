import { api } from "@/data/api";
import type { Ranking } from "@/data/mock-data";
import type { RankingsFilters } from "@/lib/schemas";
import Image from "next/image";
import { DateTime } from "./date-time";
import { RankingsAdminControls } from "./rankings-admin-controls";
import { RatingWithStars } from "./rating-with-stars";
import { Card, CardContent, CardFooter } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

export async function Rankings({
  filters: filtersExternal,
}: {
  filters: Promise<RankingsFilters>;
}) {
  const filters = await filtersExternal;
  const rankings = await api.getRankings(filters);

  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden min-w-16 sm:table-cell">
                <span className="sr-only">Image</span>
              </TableHead>
              <TableHead>Restaurant</TableHead>
              <TableHead className="hidden md:table-cell">Rating</TableHead>
              <TableHead className="hidden md:table-cell">Product</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="hidden md:table-cell">Note</TableHead>
              <TableHead className="hidden md:table-cell">
                Reviewed at
              </TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankings.map((ranking) => (
              <RankingsTableRow
                key={ranking.id}
                restaurantName={ranking.restaurantName}
                rating={ranking.rating}
                product={ranking.product}
                category={ranking.catgory}
                note={ranking.note}
                reviewedAt={ranking.reviewedAt}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="text-xs">
          {rankings.length === 0 ? (
            <span>No rankings for your filters</span>
          ) : (
            <>
              <strong>{rankings.length}</strong>
              <span className="ml-1">ranking{rankings.length > 1 && "s"}</span>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export function RankingsTableRow({
  rating,
  product,
  category,
  note,
  reviewedAt,
  restaurantName,
}: {
  rating: Ranking["rating"];
  product: Ranking["product"];
  category: Ranking["catgory"];
  note: Ranking["note"];
  reviewedAt: Ranking["reviewedAt"];
  restaurantName: Ranking["restaurantName"];
}) {
  return (
    <TableRow>
      <TableCell className="min-w-14 p-0">
        <Image
          alt="Product image"
          className="aspect-square rounded-md object-cover"
          height="56"
          src="/image-placeholder.svg"
          width="56"
        />
      </TableCell>
      <TableCell className="font-medium text-primary">
        {restaurantName}
      </TableCell>
      <TableCell className="flex items-center font-medium">
        <RatingWithStars rating={rating} />
      </TableCell>
      <TableCell className="font-medium">{product}</TableCell>
      <TableCell className="font-medium">{category}</TableCell>
      <TableCell className="font-medium">{note}</TableCell>
      <TableCell className="hidden md:table-cell">
        <DateTime format="YYYY-MM-DD" date={reviewedAt} />
      </TableCell>
      <TableCell>
        <RankingsAdminControls />
      </TableCell>
    </TableRow>
  );
}
