import {
  integer,
  pgTable,
  real,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const reviewsTable = pgTable("reviews", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  // 0 to 5 – Note: "real" is an inexact floating point number (e.g. has a problem with 0.1 + 0.2 = 0.30000000000000004)
  rating: real().notNull(),
  note: varchar({ length: 255 }),
  reviewedAt: timestamp("reviewed_at", {
    precision: 6,
    withTimezone: true,
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export type Review = typeof reviewsTable.$inferSelect;
export type ReviewCreate = Required<typeof reviewsTable.$inferInsert>;
export type ReviewUpdate = Partial<Review>;

