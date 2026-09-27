import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * User account table supporting both local username/password auth and optional Manus OAuth.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  username: varchar("username", { length: 64 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }).default("password"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatarUrl: text("avatarUrl"),
  bio: text("bio"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Games table: holds user-submitted games with review status (approved/pending/rejected)
 */
export const games = mysqlTable("games", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 150 }).notNull(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  description: text("description").notNull(),
  instructions: text("instructions"),
  category: varchar("category", { length: 50 }).notNull().default("action"),
  thumbnailUrl: text("thumbnailUrl").notNull(),
  gameType: mysqlEnum("gameType", ["html5", "embed", "external"]).notNull().default("html5"),
  // gameCode: runnable HTML/JS/CSS code for playable web games
  gameCode: text("gameCode"),
  // externalUrl: iframe embed URL or playable link
  externalUrl: text("externalUrl"),
  authorId: int("authorId").notNull(),
  authorName: varchar("authorName", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).notNull().default("approved"),
  rejectionReason: text("rejectionReason"),
  playCount: int("playCount").notNull().default(0),
  favoriteCount: int("favoriteCount").notNull().default(0),
  isFeatured: boolean("isFeatured").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Game = typeof games.$inferSelect;
export type InsertGame = typeof games.$inferInsert;

/**
 * Game reviews and ratings
 */
export const gameReviews = mysqlTable("game_reviews", {
  id: int("id").autoincrement().primaryKey(),
  gameId: int("gameId").notNull(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 100 }).notNull(),
  rating: int("rating").notNull().default(5), // 1 to 5
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GameReview = typeof gameReviews.$inferSelect;
export type InsertGameReview = typeof gameReviews.$inferInsert;

/**
 * Favorites / bookmarks
 */
export const gameFavorites = mysqlTable("game_favorites", {
  id: int("id").autoincrement().primaryKey(),
  gameId: int("gameId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GameFavorite = typeof gameFavorites.$inferSelect;
export type InsertGameFavorite = typeof gameFavorites.$inferInsert;
