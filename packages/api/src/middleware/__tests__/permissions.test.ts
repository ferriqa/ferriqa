import { describe, test, expect } from "bun:test";
import { Hono } from "hono";
import type { Context, Next } from "hono";
import { requirePermission } from "../permissions";

describe("RBAC Middleware Integration", () => {
  test("requirePermission returns 401 without auth", async () => {
    const app = new Hono();

    app.get("/test", requirePermission("content:read"), (c: Context) => {
      return c.json({ message: "success" });
    });

    const res = await app.request("/test");

    expect(res.status).toBe(401);
  });

  test("requirePermission returns 403 with wrong permission", async () => {
    const app = new Hono();

    app.use("*", async (c: Context, next: Next) => {
      c.set("userRole", "viewer");
      await next();
    });

    app.get("/test", requirePermission("content:create"), (c: Context) => {
      return c.json({ message: "success" });
    });

    const res = await app.request("/test");

    expect(res.status).toBe(403);
  });

  test("requirePermission passes with correct permission", async () => {
    const app = new Hono();

    app.use("*", async (c: Context, next: Next) => {
      c.set("userRole", "editor");
      await next();
    });

    app.get("/test", requirePermission("content:read"), (c: Context) => {
      return c.json({ message: "success" });
    });

    const res = await app.request("/test");

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toBe("success");
  });

  test("requirePermission passes with admin role", async () => {
    const app = new Hono();

    app.use("*", async (c: Context, next: Next) => {
      c.set("userRole", "admin");
      await next();
    });

    app.get("/test", requirePermission("content:delete"), (c: Context) => {
      return c.json({ message: "success" });
    });

    const res = await app.request("/test");

    expect(res.status).toBe(200);
  });
});
