import { Hono, Context, Next } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { setupRoutes } from "./routes/index.ts";
import { initPlugins } from "./plugins/index.ts";

function getEnvVar(name: string): string | undefined {
  try {
    if (typeof process !== "undefined" && process.env) {
      return process.env[name];
    }
    // @ts-ignore - Deno not available in all runtimes
    if (typeof Deno !== "undefined") {
      // @ts-ignore
      return (globalThis as any).Deno.env.get(name);
    }
  } catch {
    // Environment variables not available
  }
  return undefined;
}

const config = {
  allowedOrigins: (
    getEnvVar("ALLOWED_ORIGINS") ||
    "http://localhost:3000,http://localhost:5173"
  ).split(","),
};

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export function rateLimitMiddleware() {
  const store = new Map<string, RateLimitRecord>();
  const windowMs = 60000;
  const maxRequests = 100;

  function cleanup() {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }

  setInterval(cleanup, 60000);

  return async (c: Context, next: Next) => {
    const ip =
      c.req.header("cf-connecting-ip") ||
      c.req.header("x-real-ip") ||
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const now = Date.now();

    let record = store.get(ip);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      store.set(ip, record);
    }

    record.count++;

    if (record.count > maxRequests) {
      return c.json({ error: "Too many requests" }, 429);
    }

    await next();
  };
}

export function securityHeaders() {
  return async (c: Context, next: Next) => {
    await next();

    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("X-XSS-Protection", "1; mode=block");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  };
}

export async function createServer(): Promise<Hono> {
  const app = new Hono();

  app.use("*", logger());
  app.use("*", prettyJSON());
  app.use(
    "*",
    cors({
      origin: config.allowedOrigins,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "X-API-Key"],
      exposeHeaders: ["X-Total-Count", "X-Page-Count"],
      credentials: true,
    }),
  );

  app.use("*", rateLimitMiddleware());
  app.use("*", securityHeaders());

  // Initialize Plugins
  // In a real app, this config would come from a file or DB
  const pluginsConfig = ["seo"];
  try {
    const result = await initPlugins(pluginsConfig);
    if (result.failed.length > 0) {
      console.warn(
        `[Plugins] Warning: ${result.failed.length} plugins failed to initialize.`,
      );
    }
  } catch (err) {
    console.error(
      "[Plugins] Critical failure during plugin initialization:",
      err,
    );
  }

  setupRoutes(app);

  app.notFound((c: Context) => {
    return c.json(
      { error: "Not Found", message: "The requested resource was not found" },
      404,
    );
  });

  app.onError((err: Error, c: Context) => {
    console.error("Server error:", err);
    return c.json(
      { error: "Internal Server Error", message: err.message },
      500,
    );
  });

  return app;
}
