import { categories, cities, ratingHighest, ratingLowest } from "@/data/static";
import { sql, type SQL } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Helper for case-insensitive equality check.
 * @example
 * .where(eq(lower(usersTable.name), userParsed.name.toLowerCase()));
 */
export function lower(column: AnyPgColumn): SQL {
  return sql`lower(${column})`;
}

export const criticsTable = pgTable("critics", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id")
    .references(() => usersTable.id)
    .notNull(),
  url: varchar({ length: 255 }).notNull(),
});
export type Critic = typeof criticsTable.$inferSelect;

export const reviewsTable = pgTable("reviews", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  // "real" is an inexact floating point number (e.g. has a problem with 0.1 + 0.2 = 0.30000000000000004)
  rating: real().notNull(),
  note: varchar({ length: 255 }),
  productId: integer("product_id")
    .references(() => productsTable.id)
    .notNull(),
  authorId: text("author_id")
    .references(() => usersTable.id)
    .notNull(),
  // TODO make non-nullable when all reviews have a date
  reviewedAt: timestamp("reviewed_at", {
    precision: 6,
    withTimezone: true,
  }),
  isCurrent: boolean("is_current").default(false).notNull(),
  urlSource: varchar({ length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export type Review = typeof reviewsTable.$inferSelect;

const messageRating = `Please pick between ${ratingLowest} and ${ratingHighest}`;
export const schemaRating = z
  .number({ error: messageRating })
  .min(ratingLowest, messageRating)
  .max(ratingHighest, messageRating);

const schemaUrl = z.url({
  error: "Please enter a valid URL (starts with https)",
});

export const schemaCreateReview = createInsertSchema(reviewsTable, {
  rating: schemaRating,
  urlSource: schemaUrl.nullable(),
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
export type ReviewUpdateDb = z.infer<typeof schemaUpdateReview>;

export const placesTable = pgTable("places", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  city: varchar({ length: 255, enum: cities }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});
export const schemaCreatePlace = createInsertSchema(placesTable)
  .required()
  .omit({
    createdAt: true,
    updatedAt: true,
  });
export type PlaceCreateDb = z.infer<typeof schemaCreatePlace>;

export const productsTable = pgTable(
  "products",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    note: varchar({ length: 255 }),
    category: varchar({ length: 255, enum: categories }).notNull(),
    placeId: integer("place_id").references(() => placesTable.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [index("products_name_idx_custom").on(table.name)],
);

export const schemaCategory = z.enum(categories, {
  message: "Please pick a category",
});
const schemaProductName = z.string({ error: "Required" }).min(2).max(255);

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

// #################### Auth schema generated
// Changed:
// - usersTable: add "users_name_unique_idx_custom" to "name" that includes a lower() function for case-insensitive uniqueness
// ####################
export const usersTable = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_name_unique_idx_custom").on(lower(table.name)),
  ],
);

export const sessionsTable = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
});

export const accountsTable = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verificationsTable = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
// #################### Auth schema generated (End)

export type User = typeof usersTable.$inferSelect;
export type UserCreate = typeof usersTable.$inferInsert;
export const schemaUsername = z
  .string()
  .trim()
  .min(2, { error: "Between 2 and 30 characters" })
  .max(30, { error: "Between 2 and 30 characters" });

export const schemaUpdateUsername = createUpdateSchema(usersTable, {
  name: schemaUsername,
}).omit({
  createdAt: true,
  updatedAt: true,
  email: true,
  emailVerified: true,
  image: true,
});
export type UserUpdate = z.infer<typeof schemaUpdateUsername>;
