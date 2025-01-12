import { categories } from "@/data/static";
import {
  integer,
  pgTable,
  real,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

export const reviewsTable = pgTable("reviews", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  // 0 to 5 – Note: "real" is an inexact floating point number (e.g. has a problem with 0.1 + 0.2 = 0.30000000000000004)
  rating: real().notNull(),
  note: varchar({ length: 255 }),
  productId: integer("product_id")
    .references(() => productsTable.id)
    .notNull(),
  reviewedAt: timestamp("reviewed_at", {
    precision: 6,
    withTimezone: true,
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export type Review = typeof reviewsTable.$inferSelect;

export const schemaCreateReview = createInsertSchema(reviewsTable)
  .required()
  .omit({
    reviewedAt: true,
    createdAt: true,
    updatedAt: true,
  });
export type ReviewCreate = z.infer<typeof schemaCreateReview>;

export const schemaUpdateReview = createUpdateSchema(reviewsTable).omit({
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
});
export type ReviewUpdate = z.infer<typeof schemaUpdateReview>;

export const placesTable = pgTable("places", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export type Place = typeof placesTable.$inferSelect;
export type PlaceCreate = Required<typeof placesTable.$inferInsert>;

export const productsTable = pgTable("products", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  note: varchar({ length: 255 }),
  category: varchar({ length: 255, enum: categories }).notNull(),
  placeId: integer("place_id")
    .references(() => placesTable.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export type Product = typeof productsTable.$inferSelect;
export type ProductCreate = Required<typeof productsTable.$inferInsert>;
