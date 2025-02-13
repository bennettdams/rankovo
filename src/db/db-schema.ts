import { categories, cities, ratingHighest, ratingLowest } from "@/data/static";
import {
  integer,
  pgTable,
  real,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
});
export type User = typeof criticsTable.$inferSelect;
export const schemaUsername = z.string().trim().min(1).max(30);

export const criticsTable = pgTable("critics", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id")
    .references(() => usersTable.id)
    .notNull(),
  url: varchar({ length: 255 }).notNull(),
});
export type Critic = typeof criticsTable.$inferSelect;

export const reviewsTable = pgTable("reviews", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  // 0 to 5 – Note: "real" is an inexact floating point number (e.g. has a problem with 0.1 + 0.2 = 0.30000000000000004)
  rating: real().notNull(),
  note: varchar({ length: 255 }),
  productId: integer("product_id")
    .references(() => productsTable.id)
    .notNull(),
  authorId: integer("author_id")
    .references(() => usersTable.id)
    .notNull(),
  reviewedAt: timestamp("reviewed_at", {
    precision: 6,
    withTimezone: true,
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export type Review = typeof reviewsTable.$inferSelect;

const messageRating = `Please pick between ${ratingLowest} and ${ratingHighest}`;
export const schemaRating = z
  .number()
  .min(ratingLowest, messageRating)
  .max(ratingHighest, messageRating);

export const schemaCreateReview = createInsertSchema(reviewsTable, {
  rating: schemaRating,
})
  .required()
  .omit({
    createdAt: true,
    updatedAt: true,
  });
export type ReviewCreateDb = z.infer<typeof schemaCreateReview>;

export const schemaUpdateReview = createUpdateSchema(reviewsTable, {
  rating: schemaRating,
}).omit({
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
});
export type ReviewUpdate = z.infer<typeof schemaUpdateReview>;

export const placesTable = pgTable("places", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  city: varchar({ length: 255, enum: cities }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const productsTable = pgTable("products", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  note: varchar({ length: 255 }),
  category: varchar({ length: 255, enum: categories }).notNull(),
  placeId: integer("place_id").references(() => placesTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const schemaCategory = z.enum(categories, {
  message: "Please pick a category",
});
const schemaProductName = z.string({ message: "Required" }).min(2).max(255);

export const schemaCreateProduct = createInsertSchema(productsTable, {
  category: schemaCategory,
  name: schemaProductName,
})
  .required()
  .omit({
    createdAt: true,
    updatedAt: true,
  });
export type ProductCreateDb = z.infer<typeof schemaCreateProduct>;
