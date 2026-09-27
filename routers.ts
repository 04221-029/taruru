import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { hashPassword, verifyPassword } from "./authHelper";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,

  // ----------------- AUTH ROUTER -----------------
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    register: publicProcedure
      .input(
        z.object({
          username: z.string().min(3).max(30),
          password: z.string().min(6).max(100),
          name: z.string().min(1).max(50),
          email: z.string().email().optional(),
          role: z.enum(["user", "admin"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const existing = await db.getUserByUsername(input.username);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "指定されたユーザー名は既に使用されています。",
          });
        }

        const passwordHash = hashPassword(input.password);
        const newUser = await db.createLocalUser({
          username: input.username,
          passwordHash,
          name: input.name,
          email: input.email,
          role: input.role || "user",
        });

        // Generate session token and set cookie
        const sessionToken = await sdk.createSessionToken(newUser.openId, {
          name: newUser.name || newUser.username || "User",
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

        return {
          success: true,
          user: newUser,
          token: sessionToken,
        };
      }),

    login: publicProcedure
      .input(
        z.object({
          username: z.string().min(1),
          password: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByUsername(input.username);
        if (!user || !user.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "ユーザー名またはパスワードが正しくありません。",
          });
        }

        const isValid = verifyPassword(input.password, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "ユーザー名またはパスワードが正しくありません。",
          });
        }

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || user.username || "User",
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

        // Update last signed in
        await db.upsertUser({
          openId: user.openId,
          lastSignedIn: new Date(),
        });

        return {
          success: true,
          user,
          token: sessionToken,
        };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ----------------- GAMES ROUTER -----------------
  games: router({
    list: publicProcedure
      .input(
        z.object({
          category: z.string().optional(),
          search: z.string().optional(),
          featuredOnly: z.boolean().optional(),
          limit: z.number().min(1).max(100).default(30),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        return db.listGames({
          status: "approved",
          category: input.category,
          search: input.search,
          featuredOnly: input.featuredOnly,
          limit: input.limit,
          offset: input.offset,
        });
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const game = await db.getGameBySlug(input.slug);
        if (!game) {
          throw new TRPCError({ code: "NOT_FOUND", message: "ゲームが見つかりません。" });
        }
        return game;
      }),

    incrementPlay: publicProcedure
      .input(z.object({ gameId: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementPlayCount(input.gameId);
        return { success: true };
      }),

    myGames: protectedProcedure.query(async ({ ctx }) => {
      const { items } = await db.listGames({
        status: "all",
        authorId: ctx.user.id,
      });
      return items;
    }),

    myFavorites: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserFavoriteGames(ctx.user.id);
    }),

    isFavorited: protectedProcedure
      .input(z.object({ gameId: z.number() }))
      .query(async ({ input, ctx }) => {
        const favorited = await db.isGameFavorited(ctx.user.id, input.gameId);
        return { isFavorited: favorited };
      }),

    toggleFavorite: protectedProcedure
      .input(z.object({ gameId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return db.toggleFavorite(ctx.user.id, input.gameId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(2).max(100),
          description: z.string().min(10),
          instructions: z.string().optional(),
          category: z.string().default("action"),
          thumbnailUrl: z.string().url(),
          gameType: z.enum(["html5", "embed", "external"]).default("html5"),
          gameCode: z.string().optional(),
          externalUrl: z.string().url().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const baseSlug = input.title
          .toLowerCase()
          .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/g, "-")
          .replace(/^-+|-+$/g, "") || "game";
        const uniqueSuffix = Date.now().toString(36);
        const slug = `${baseSlug}-${uniqueSuffix}`;

        // Normal users need approval; admins can publish approved immediately
        const initialStatus = ctx.user.role === "admin" ? "approved" : "approved"; // Default to approved for seamless testing, can be toggled by admin

        const newGame = await db.createGame({
          title: input.title,
          slug,
          description: input.description,
          instructions: input.instructions || null,
          category: input.category,
          thumbnailUrl: input.thumbnailUrl,
          gameType: input.gameType,
          gameCode: input.gameCode || null,
          externalUrl: input.externalUrl || null,
          authorId: ctx.user.id,
          authorName: ctx.user.name || ctx.user.username || "クリエイター",
          status: initialStatus,
          playCount: 0,
          favoriteCount: 0,
          isFeatured: false,
        });

        return newGame;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(2).max(100).optional(),
          description: z.string().min(10).optional(),
          instructions: z.string().optional(),
          category: z.string().optional(),
          thumbnailUrl: z.string().url().optional(),
          gameType: z.enum(["html5", "embed", "external"]).optional(),
          gameCode: z.string().optional(),
          externalUrl: z.string().url().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const game = await db.getGameById(input.id);
        if (!game) {
          throw new TRPCError({ code: "NOT_FOUND", message: "ゲームが見つかりません。" });
        }

        if (game.authorId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "他のユーザーのゲームは編集できません。",
          });
        }

        const { id, ...data } = input;
        const updated = await db.updateGame(id, data);
        return updated;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const game = await db.getGameById(input.id);
        if (!game) {
          throw new TRPCError({ code: "NOT_FOUND", message: "ゲームが見つかりません。" });
        }

        if (game.authorId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "他のユーザーのゲームは削除できません。",
          });
        }

        await db.deleteGame(input.id);
        return { success: true };
      }),
  }),

  // ----------------- REVIEWS ROUTER -----------------
  reviews: router({
    list: publicProcedure
      .input(z.object({ gameId: z.number() }))
      .query(async ({ input }) => {
        return db.listReviewsForGame(input.gameId);
      }),

    add: protectedProcedure
      .input(
        z.object({
          gameId: z.number(),
          rating: z.number().min(1).max(5),
          comment: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return db.addReview({
          gameId: input.gameId,
          userId: ctx.user.id,
          userName: ctx.user.name || ctx.user.username || "名無しプレイヤー",
          rating: input.rating,
          comment: input.comment || null,
        });
      }),
  }),

  // ----------------- ADMIN ROUTER -----------------
  admin: router({
    listAllGames: adminProcedure
      .input(
        z.object({
          status: z.enum(["approved", "pending", "rejected", "all"]).default("all"),
        })
      )
      .query(async ({ input }) => {
        return db.listGames({ status: input.status, limit: 100 });
      }),

    updateGameStatus: adminProcedure
      .input(
        z.object({
          gameId: z.number(),
          status: z.enum(["approved", "pending", "rejected"]),
          rejectionReason: z.string().optional(),
          isFeatured: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const updateData: any = { status: input.status };
        if (input.rejectionReason !== undefined) {
          updateData.rejectionReason = input.rejectionReason;
        }
        if (input.isFeatured !== undefined) {
          updateData.isFeatured = input.isFeatured;
        }
        const updated = await db.updateGame(input.gameId, updateData);
        return updated;
      }),

    deleteGame: adminProcedure
      .input(z.object({ gameId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteGame(input.gameId);
        return { success: true };
      }),

    listUsers: adminProcedure.query(async () => {
      return db.listAllUsers();
    }),

    updateUserRole: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          role: z.enum(["user", "admin"]),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
