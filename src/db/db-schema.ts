import { categories, cities, defaultRole, roles } from "@/data/static";
import {
  schemaCategory,
  schemaCity,
  schemaNote,
  schemaPlaceName,
  schemaProductName,
  schemaRating,
  schemaUrl,
} from "@/lib/schemas";
import { sql, type SQL } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";

/**
 * Helper for case-insensitive equality check.
 * @example
 * .where(eq(lower(usersTable.name), userParsed.name.toLowerCase()));
 */
export function lower(column: AnyPgColumn): SQL {
  return sql`lower(${column})`;
}

/** Only allow one review to be the current review per author and product */
export const indexReviewsOneCurrent =
  "reviews_one_current_per_author_product_idx_custom";

export const roleEnum = pgEnum("role", roles);

export const criticsTable = pgTable("critics", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id")
    .references(() => usersTable.id)
    .notNull(),
  url: varchar({ length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type Critic = typeof criticsTable.$inferSelect;

export const reviewsTable = pgTable(
  "reviews",
  {
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
    urlSource: varchar("url_source", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    // Historical reviews remain available, while this partial index enforces
    // one current review per author and product during concurrent writes.
    uniqueIndex(indexReviewsOneCurrent)
      .on(table.authorId, table.productId)
      .where(sql`${table.isCurrent} = true`),
  ],
);

export type Review = typeof reviewsTable.$inferSelect;

const schemaCreateReviewDb = createInsertSchema(reviewsTable, {
  rating: schemaRating,
  note: schemaNote,
  urlSource: schemaUrl.nullable(),
})
  .required()
  .omit({
    createdAt: true,
    updatedAt: true,
  });
export type ReviewCreateDb = z.infer<typeof schemaCreateReviewDb>;

const schemaAuthorId = schemaCreateReviewDb.pick({ authorId: true }).shape
  .authorId;

export const schemaCreateReview = schemaCreateReviewDb
  // we will always set these fields in the server action, never let the client set it
  .omit({
    authorId: true,
    isCurrent: true,
  })
  .extend({ overwriteAuthorId: schemaAuthorId.nullable() });
export type ReviewCreate = z.infer<typeof schemaCreateReview>;

export const schemaUpdateReview = createUpdateSchema(reviewsTable, {
  rating: schemaRating,
  note: schemaNote,
}).omit({
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
});
export type ReviewUpdateDb = z.infer<typeof schemaUpdateReview>;

// Give this rule a fixed name so the actions can recognize it: one restaurant
// cannot have both "Burger" and "burger" as separate products. If two people
// try to add the same product at once, the action can show a helpful message.
export const indexProductsPlaceNameUnique =
  "products_place_name_unique_idx_custom";

export const placesTable = pgTable("places", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const placeCitiesTable = pgTable(
  "place_cities",
  {
    placeId: integer("place_id")
      .notNull()
      .references(() => placesTable.id, { onDelete: "cascade" }),
    city: varchar({ length: 255, enum: cities }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.placeId, table.city] })],
);

export const schemaCreatePlace = createInsertSchema(placesTable, {
  name: schemaPlaceName,
})
  .required()
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    cities: z.array(schemaCity),
  });
export type PlaceCreateDb = z.infer<typeof schemaCreatePlace>;

export const schemaUpdatePlace = schemaCreatePlace.pick({
  name: true,
  cities: true,
});
export type PlaceUpdateDb = z.infer<typeof schemaUpdatePlace>;
export const schemaPlaceId = createSelectSchema(placesTable, {
  id: (schema) => schema.positive(),
}).shape.id;
const messagePlace = "Bitte wähle ein Restaurant aus";
export const schemaProductPlaceId = z
  .number({ error: messagePlace })
  .int(messagePlace)
  .positive(messagePlace);

export const productsTable = pgTable(
  "products",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    note: varchar({ length: 255 }),
    category: varchar({ length: 255, enum: categories }).notNull(),
    placeId: integer("place_id")
      .notNull()
      .references(() => placesTable.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("products_name_idx_custom").on(table.name),
    uniqueIndex(indexProductsPlaceNameUnique).on(
      table.placeId,
      lower(table.name),
    ),
  ],
);

export const schemaCreateProduct = createInsertSchema(productsTable, {
  category: schemaCategory,
  name: schemaProductName,
  note: schemaNote,
  placeId: schemaProductPlaceId,
})
  .required()
  .omit({
    createdAt: true,
    updatedAt: true,
  });
export type ProductCreateDb = z.infer<typeof schemaCreateProduct>;

export const schemaUpdateProduct = createUpdateSchema(productsTable, {
  name: schemaProductName,
  note: schemaNote,
  category: schemaCategory,
  placeId: schemaProductPlaceId,
})
  .pick({
    name: true,
    note: true,
    category: true,
    placeId: true,
  })
  .required();
export type ProductUpdateDb = z.infer<typeof schemaUpdateProduct>;
export const schemaProductId = createSelectSchema(productsTable, {
  id: (schema) => schema.positive(),
}).shape.id;

// #################### Auth schema generated
// Changed:
// - usersTable: add "users_name_unique_idx_custom" to "name" that includes a lower() function for case-insensitive uniqueness
// - usersTable: add "role" field. This was done together with "additionalFields" in auth-server.ts
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
    role: roleEnum("role").default(defaultRole).notNull(),
  },
  (table) => [
    uniqueIndex("users_name_unique_idx_custom").on(lower(table.name)),
  ],
);

export const sessionsTable = pgTable(
  "sessions",
  {
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
  },
  (table) => [index("sessions_userId_idx").on(table.userId)],
);

export const accountsTable = pgTable(
  "accounts",
  {
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
  },
  (table) => [index("accounts_userId_idx").on(table.userId)],
);

export const verificationsTable = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

// export const usersRelations = relations(users, ({ many }) => ({
//   sessions: many(sessions),
//   accounts: many(accounts),
// }));

// export const sessionsRelations = relations(sessions, ({ one }) => ({
//   users: one(users, {
//     fields: [sessions.userId],
//     references: [users.id],
//   }),
// }));

// export const accountsRelations = relations(accounts, ({ one }) => ({
//   users: one(users, {
//     fields: [accounts.userId],
//     references: [users.id],
//   }),
// }));
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
}).pick({
  name: true,
});
export type UserUpdate = z.infer<typeof schemaUpdateUsername>;
