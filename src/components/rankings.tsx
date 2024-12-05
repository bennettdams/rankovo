import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createRankings, type Ranking } from "@/data/mock-data";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@radix-ui/react-dialog";
import { MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { DateTime } from "./date-time";
import { Card, CardContent, CardFooter } from "./ui/card";
import { DialogHeader } from "./ui/dialog";
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
              <Dialog key={ranking.id}>
                <DialogTrigger asChild>
                  <RankingTableRow
                    key={ranking.id}
                    restaurantName={ranking.restaurantName}
                    rating={ranking.rating}
                    product={ranking.product}
                    note={ranking.note}
                    reviewedAt={ranking.reviewedAt}
                  />
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
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

function RankingTableRow({
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-haspopup="true" size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
