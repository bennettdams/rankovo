import { createRankings, type Ranking } from "@/data/mock-data";
import Image from "next/image";
import { DateTime } from "./date-time";
import { RankingsAdminControls } from "./rankings-admin-controls";
import { Card, CardContent, CardFooter } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

export function Rankings() {
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
            {createRankings().map((ranking) => (
              <RankingsTableRow
                key={ranking.id}
                restaurantName={ranking.restaurantName}
                rating={ranking.rating}
                product={ranking.product}
                note={ranking.note}
                reviewedAt={ranking.reviewedAt}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="text-xs">
          Showing <strong>1-10</strong> of <strong>32</strong> rankings
        </div>
      </CardFooter>
    </Card>
  );
}

export function RankingsTableRow({
  rating,
  product,
  note,
  reviewedAt,
  restaurantName,
}: {
  rating: Ranking["rating"];
  product: Ranking["product"];
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
      <TableCell className="font-medium">{rating}</TableCell>
      <TableCell className="font-medium">{product}</TableCell>
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
