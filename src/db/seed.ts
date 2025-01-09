import { reviewsTable } from "./db-schema";
import { db } from "./drizzle-setup";

async function main() {
  console.log("########## Seeding");

  // delete all rows from reviews table
  await db.delete(reviewsTable).execute();

  console.log("########## Seeding done");
}

main();
