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
} from "../handlers/blueprints";
import {
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
} from "../handlers/contents";
import {
  mediaListHandler,
  mediaUploadHandler,
  mediaGetHandler,
  mediaDeleteHandler,
} from "../handlers/mocks";
import {
  webhookListHandler,
  webhookGetHandler,
  webhookCreateHandler,
  webhookUpdateHandler,
  webhookDeleteHandler,
  webhookTestHandler,
  webhookDeliveriesHandler,
} from "../handlers/webhooks";
import { webhookService } from "../webhook-service";
import { blueprintService } from "../blueprint-service";
import { contentService } from "../content-service";
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
    blueprintListHandler(blueprintService),
    blueprintGetHandler(blueprintService),
    blueprintCreateHandler(blueprintService),
    blueprintUpdateHandler(blueprintService),
    blueprintDeleteHandler(blueprintService),
  );

  setupContentRoutes(
    contentListHandler(contentService),
    contentGetHandler(contentService),
    contentBySlugHandler(contentService),
    contentCreateHandler(contentService),
    contentUpdateHandler(contentService),
    contentDeleteHandler(contentService),
    contentPublishHandler(contentService),
    contentUnpublishHandler(contentService),
    contentVersionsHandler(contentService),
    contentRollbackHandler(contentService),
  );

  setupMediaRoutes(
    mediaListHandler(),
    mediaUploadHandler(),
    mediaGetHandler(),
    mediaDeleteHandler(),
  );

  setupWebhookRoutes(
    webhookListHandler(webhookService),
    webhookGetHandler(webhookService),
    webhookCreateHandler(webhookService),
    webhookUpdateHandler(webhookService),
    webhookDeleteHandler(webhookService),
    webhookTestHandler(webhookService),
    webhookDeliveriesHandler(webhookService),
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
