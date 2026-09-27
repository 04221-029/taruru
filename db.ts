import { desc, eq, and, sql, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, User, users, games, InsertGame, Game, gameReviews, InsertGameReview, GameReview, gameFavorites, InsertGameFavorite } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "username", "passwordHash", "avatarUrl", "bio"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result[0];
}

export async function createLocalUser(params: {
  username: string;
  passwordHash: string;
  name: string;
  email?: string;
  role?: "user" | "admin";
}): Promise<User> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const openId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const values: InsertUser = {
    openId,
    username: params.username,
    passwordHash: params.passwordHash,
    name: params.name,
    email: params.email ?? null,
    loginMethod: "password",
    role: params.role || "user",
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${params.username}`,
    lastSignedIn: new Date(),
  };

  await db.insert(users).values(values);
  const created = await getUserByUsername(params.username);
  if (!created) throw new Error("Failed to retrieve created user");
  return created;
}

export async function updateUserRole(userId: number, role: "user" | "admin"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function listAllUsers(): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

// ----------------- GAMES -----------------

export async function createGame(game: InsertGame): Promise<Game> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(games).values(game);
  const created = await getGameBySlug(game.slug);
  if (!created) throw new Error("Failed to retrieve created game");
  return created;
}

export async function updateGame(
  gameId: number,
  data: Partial<InsertGame>
): Promise<Game | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(games).set({ ...data, updatedAt: new Date() }).where(eq(games.id, gameId));
  return getGameById(gameId);
}

export async function deleteGame(gameId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(games).where(eq(games.id, gameId));
  await db.delete(gameReviews).where(eq(gameReviews.gameId, gameId));
  await db.delete(gameFavorites).where(eq(gameFavorites.gameId, gameId));
}

export async function getGameById(id: number): Promise<Game | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(games).where(eq(games.id, id)).limit(1);
  return result[0];
}

export async function getGameBySlug(slug: string): Promise<Game | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(games).where(eq(games.slug, slug)).limit(1);
  return result[0];
}

export async function listGames(params: {
  status?: "approved" | "pending" | "rejected" | "all";
  category?: string;
  search?: string;
  authorId?: number;
  featuredOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ items: Game[]; total: number }> {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const conditions = [];

  if (params.status && params.status !== "all") {
    conditions.push(eq(games.status, params.status));
  } else if (!params.status) {
    conditions.push(eq(games.status, "approved"));
  }

  if (params.category && params.category !== "all") {
    conditions.push(eq(games.category, params.category));
  }

  if (params.authorId) {
    conditions.push(eq(games.authorId, params.authorId));
  }

  if (params.featuredOnly) {
    conditions.push(eq(games.isFeatured, true));
  }

  if (params.search && params.search.trim() !== "") {
    const q = `%${params.search.trim()}%`;
    conditions.push(or(like(games.title, q), like(games.description, q), like(games.authorName, q)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const totalRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(games)
    .where(whereClause);
  const total = Number(totalRes[0]?.count ?? 0);

  let query = db
    .select()
    .from(games)
    .where(whereClause)
    .orderBy(desc(games.createdAt));

  if (params.limit) {
    query = (query as any).limit(params.limit);
  }
  if (params.offset) {
    query = (query as any).offset(params.offset);
  }

  const items = await query;
  return { items, total };
}

export async function incrementPlayCount(gameId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(games)
    .set({ playCount: sql`${games.playCount} + 1` })
    .where(eq(games.id, gameId));
}

// ----------------- REVIEWS -----------------

export async function addReview(params: InsertGameReview): Promise<GameReview> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(gameReviews).values(params);
  const latest = await db
    .select()
    .from(gameReviews)
    .where(and(eq(gameReviews.gameId, params.gameId), eq(gameReviews.userId, params.userId)))
    .orderBy(desc(gameReviews.createdAt))
    .limit(1);
  return latest[0];
}

export async function listReviewsForGame(gameId: number): Promise<GameReview[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(gameReviews)
    .where(eq(gameReviews.gameId, gameId))
    .orderBy(desc(gameReviews.createdAt));
}

// ----------------- FAVORITES -----------------

export async function toggleFavorite(userId: number, gameId: number): Promise<{ isFavorited: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(gameFavorites)
    .where(and(eq(gameFavorites.userId, userId), eq(gameFavorites.gameId, gameId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(gameFavorites).where(eq(gameFavorites.id, existing[0].id));
    await db
      .update(games)
      .set({ favoriteCount: sql`GREATEST(0, ${games.favoriteCount} - 1)` })
      .where(eq(games.id, gameId));
    return { isFavorited: false };
  } else {
    await db.insert(gameFavorites).values({ userId, gameId });
    await db
      .update(games)
      .set({ favoriteCount: sql`${games.favoriteCount} + 1` })
      .where(eq(games.id, gameId));
    return { isFavorited: true };
  }
}

export async function isGameFavorited(userId: number, gameId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const existing = await db
    .select()
    .from(gameFavorites)
    .where(and(eq(gameFavorites.userId, userId), eq(gameFavorites.gameId, gameId)))
    .limit(1);
  return existing.length > 0;
}

export async function getUserFavoriteGames(userId: number): Promise<Game[]> {
  const db = await getDb();
  if (!db) return [];
  const favs = await db
    .select()
    .from(gameFavorites)
    .where(eq(gameFavorites.userId, userId))
    .orderBy(desc(gameFavorites.createdAt));

  if (favs.length === 0) return [];

  const gameIds = favs.map(f => f.gameId);
  const foundGames = await Promise.all(gameIds.map(id => getGameById(id)));
  return foundGames.filter((g): g is Game => Boolean(g && g.status === "approved"));
}
