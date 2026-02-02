import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";
import { requirePermission } from "../../middleware/permissions";

export const v1Routes = new Hono();

export function setupBlueprintRoutes(
  blueprintList: any,
  blueprintGet: any,
  blueprintCreate: any,
  blueprintUpdate: any,
  blueprintDelete: any,
) {
  v1Routes.get(
    "/blueprints",
    authMiddleware(),
    requirePermission("blueprint:read"),
    blueprintList,
  );
  v1Routes.get(
    "/blueprints/:id",
    authMiddleware(),
    requirePermission("blueprint:read"),
    blueprintGet,
  );
  v1Routes.post(
    "/blueprints",
    authMiddleware(),
    requirePermission("blueprint:create"),
    blueprintCreate,
  );
  v1Routes.put(
    "/blueprints/:id",
    authMiddleware(),
    requirePermission("blueprint:update"),
    blueprintUpdate,
  );
  v1Routes.delete(
    "/blueprints/:id",
    authMiddleware(),
    requirePermission("blueprint:delete"),
    blueprintDelete,
  );
}

export function setupContentRoutes(
  contentList: any,
  contentGet: any,
  contentBySlug: any,
  contentCreate: any,
  contentUpdate: any,
  contentDelete: any,
  contentPublish: any,
  contentUnpublish: any,
  contentVersions: any,
  contentRollback: any,
) {
  v1Routes.get(
    "/contents",
    authMiddleware(),
    requirePermission("content:read"),
    contentList,
  );
  v1Routes.get(
    "/contents/:id",
    authMiddleware(),
    requirePermission("content:read"),
    contentGet,
  );
  v1Routes.get(
    "/contents/by-slug/:slug",
    authMiddleware(),
    requirePermission("content:read"),
    contentBySlug,
  );
  v1Routes.post(
    "/contents",
    authMiddleware(),
    requirePermission("content:create"),
    contentCreate,
  );
  v1Routes.put(
    "/contents/:id",
    authMiddleware(),
    requirePermission("content:update"),
    contentUpdate,
  );
  v1Routes.delete(
    "/contents/:id",
    authMiddleware(),
    requirePermission("content:delete"),
    contentDelete,
  );
  v1Routes.post(
    "/contents/:id/publish",
    authMiddleware(),
    requirePermission("content:publish"),
    contentPublish,
  );
  v1Routes.post(
    "/contents/:id/unpublish",
    authMiddleware(),
    requirePermission("content:unpublish"),
    contentUnpublish,
  );
  v1Routes.get(
    "/contents/:id/versions",
    authMiddleware(),
    requirePermission("content:read"),
    contentVersions,
  );
  v1Routes.post(
    "/contents/:id/rollback/:versionId",
    authMiddleware(),
    requirePermission("content:rollback"),
    contentRollback,
  );
}

export function setupMediaRoutes(
  mediaList: any,
  mediaUpload: any,
  mediaGet: any,
  mediaDelete: any,
) {
  v1Routes.get(
    "/media",
    authMiddleware(),
    requirePermission("media:read"),
    mediaList,
  );
  v1Routes.post(
    "/media",
    authMiddleware(),
    requirePermission("media:create"),
    mediaUpload,
  );
  v1Routes.get(
    "/media/:id",
    authMiddleware(),
    requirePermission("media:read"),
    mediaGet,
  );
  v1Routes.delete(
    "/media/:id",
    authMiddleware(),
    requirePermission("media:delete"),
    mediaDelete,
  );
}

export function setupWebhookRoutes(
  webhookList: any,
  webhookCreate: any,
  webhookUpdate: any,
  webhookDelete: any,
  webhookTest: any,
  webhookDeliveries: any,
) {
  v1Routes.get(
    "/webhooks",
    authMiddleware(),
    requirePermission("webhook:read"),
    webhookList,
  );
  v1Routes.post(
    "/webhooks",
    authMiddleware(),
    requirePermission("webhook:create"),
    webhookCreate,
  );
  v1Routes.put(
    "/webhooks/:id",
    authMiddleware(),
    requirePermission("webhook:update"),
    webhookUpdate,
  );
  v1Routes.delete(
    "/webhooks/:id",
    authMiddleware(),
    requirePermission("webhook:delete"),
    webhookDelete,
  );
  v1Routes.post(
    "/webhooks/:id/test",
    authMiddleware(),
    requirePermission("webhook:update"),
    webhookTest,
  );
  v1Routes.get(
    "/webhooks/:id/deliveries",
    authMiddleware(),
    requirePermission("webhook:read"),
    webhookDeliveries,
  );
}

export function setupAuthRoutes(
  userMe: any,
  authLogin: any,
  authLogout: any,
  authRefresh: any,
) {
  v1Routes.get("/users/me", authMiddleware(), userMe);
  v1Routes.post("/auth/login", authLogin);
  v1Routes.post("/auth/logout", authLogout);
  v1Routes.post("/auth/refresh", authRefresh);
}
