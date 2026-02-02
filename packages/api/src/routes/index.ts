import type { Hono } from "hono";
import type { Context } from "hono";
import {
  v1Routes,
  setupBlueprintRoutes,
  setupContentRoutes,
  setupMediaRoutes,
  setupWebhookRoutes,
  setupAuthRoutes,
} from "./v1/index.ts";
import {
  blueprintListHandler,
  blueprintGetHandler,
  blueprintCreateHandler,
  blueprintUpdateHandler,
  blueprintDeleteHandler,
  contentListHandler,
  contentGetHandler,
  contentBySlugHandler,
  contentCreateHandler,
  contentUpdateHandler,
  contentDeleteHandler,
  contentPublishHandler,
  contentUnpublishHandler,
  contentVersionsHandler,
  contentRollbackHandler,
  mediaListHandler,
  mediaUploadHandler,
  mediaGetHandler,
  mediaDeleteHandler,
  webhookListHandler,
  webhookCreateHandler,
  webhookUpdateHandler,
  webhookDeleteHandler,
  webhookTestHandler,
  webhookDeliveriesHandler,
} from "../handlers/mocks";
import {
  authLoginHandler,
  authLogoutHandler,
  authRefreshHandler,
  userMeHandler,
} from "../handlers/auth";

export function setupRoutes(app: Hono): void {
  app.get("/health", (c: Context) =>
    c.json({ status: "ok", timestamp: Date.now() }),
  );

  setupBlueprintRoutes(
    blueprintListHandler(),
    blueprintGetHandler(),
    blueprintCreateHandler(),
    blueprintUpdateHandler(),
    blueprintDeleteHandler(),
  );

  setupContentRoutes(
    contentListHandler(),
    contentGetHandler(),
    contentBySlugHandler(),
    contentCreateHandler(),
    contentUpdateHandler(),
    contentDeleteHandler(),
    contentPublishHandler(),
    contentUnpublishHandler(),
    contentVersionsHandler(),
    contentRollbackHandler(),
  );

  setupMediaRoutes(
    mediaListHandler(),
    mediaUploadHandler(),
    mediaGetHandler(),
    mediaDeleteHandler(),
  );

  setupWebhookRoutes(
    webhookListHandler(),
    webhookCreateHandler(),
    webhookUpdateHandler(),
    webhookDeleteHandler(),
    webhookTestHandler(),
    webhookDeliveriesHandler(),
  );

  setupAuthRoutes(
    userMeHandler(),
    authLoginHandler(),
    authLogoutHandler(),
    authRefreshHandler(),
  );

  app.route("/api/v1", v1Routes);
  app.route("/api", v1Routes);
}
