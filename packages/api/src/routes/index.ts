import { Hono, Context } from "hono";
import { v1Routes } from "./v1/index.ts";

export function setupRoutes(app: Hono): void {
  app.get("/health", (c: Context) =>
    c.json({ status: "ok", timestamp: Date.now() }),
  );

  app.route("/api/v1", v1Routes);
  app.route("/api", v1Routes);
}
