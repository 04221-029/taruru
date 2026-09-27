import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import { hashPassword, verifyPassword } from "./authHelper";
import * as db from "./db";

type CookieCall = {
  name: string;
  value?: string;
  options: Record<string, unknown>;
};

function createMockContext(user: any = null): { ctx: TrpcContext; setCookies: CookieCall[]; clearedCookies: CookieCall[] } {
  const setCookies: CookieCall[] = [];
  const clearedCookies: CookieCall[] = [];

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        setCookies.push({ name, value, options });
      },
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, setCookies, clearedCookies };
}

describe("Password Auth Helpers", () => {
  it("hashes and correctly verifies passwords", () => {
    const raw = "SecretPassword123!";
    const hash = hashPassword(raw);
    expect(hash).toContain(":");
    expect(verifyPassword(raw, hash)).toBe(true);
    expect(verifyPassword("WrongPassword", hash)).toBe(false);
  });
});

describe("appRouter Features", () => {
  it("public games list can be fetched", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const res = await caller.games.list({ limit: 10, offset: 0 });
    expect(res).toBeDefined();
    expect(Array.isArray(res.items)).toBe(true);
    expect(typeof res.total).toBe("number");
  });

  it("admin procedures are blocked for normal users", async () => {
    const normalUser = {
      id: 999,
      openId: "test_user",
      username: "test_user",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "password",
      role: "user" as const,
      avatarUrl: null,
      bio: null,
      passwordHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const { ctx } = createMockContext(normalUser);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.listUsers()).rejects.toThrow();
  });

  it("admin procedures succeed for admin users", async () => {
    const adminUser = {
      id: 1,
      openId: "admin_user",
      username: "admin",
      name: "Admin User",
      email: "admin@example.com",
      loginMethod: "password",
      role: "admin" as const,
      avatarUrl: null,
      bio: null,
      passwordHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const users = await caller.admin.listUsers();
    expect(Array.isArray(users)).toBe(true);
  });
});
