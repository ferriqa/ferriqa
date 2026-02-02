import { Hono } from "hono";

export const v1Routes = new Hono();

export function setupBlueprintRoutes(
  blueprintList: any,
  blueprintGet: any,
  blueprintCreate: any,
  blueprintUpdate: any,
  blueprintDelete: any,
) {
  v1Routes.get("/blueprints", blueprintList);
  v1Routes.get("/blueprints/:id", blueprintGet);
  v1Routes.post("/blueprints", blueprintCreate);
  v1Routes.put("/blueprints/:id", blueprintUpdate);
  v1Routes.delete("/blueprints/:id", blueprintDelete);
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
  v1Routes.get("/contents", contentList);
  v1Routes.get("/contents/:id", contentGet);
  v1Routes.get("/contents/by-slug/:slug", contentBySlug);
  v1Routes.post("/contents", contentCreate);
  v1Routes.put("/contents/:id", contentUpdate);
  v1Routes.delete("/contents/:id", contentDelete);
  v1Routes.post("/contents/:id/publish", contentPublish);
  v1Routes.post("/contents/:id/unpublish", contentUnpublish);
  v1Routes.get("/contents/:id/versions", contentVersions);
  v1Routes.post("/contents/:id/rollback/:versionId", contentRollback);
}

export function setupMediaRoutes(
  mediaList: any,
  mediaUpload: any,
  mediaGet: any,
  mediaDelete: any,
) {
  v1Routes.get("/media", mediaList);
  v1Routes.post("/media", mediaUpload);
  v1Routes.get("/media/:id", mediaGet);
  v1Routes.delete("/media/:id", mediaDelete);
}

export function setupWebhookRoutes(
  webhookList: any,
  webhookCreate: any,
  webhookUpdate: any,
  webhookDelete: any,
  webhookTest: any,
  webhookDeliveries: any,
) {
  v1Routes.get("/webhooks", webhookList);
  v1Routes.post("/webhooks", webhookCreate);
  v1Routes.put("/webhooks/:id", webhookUpdate);
  v1Routes.delete("/webhooks/:id", webhookDelete);
  v1Routes.post("/webhooks/:id/test", webhookTest);
  v1Routes.get("/webhooks/:id/deliveries", webhookDeliveries);
}

export function setupAuthRoutes(
  userMe: any,
  authLogin: any,
  authLogout: any,
  authRefresh: any,
) {
  v1Routes.get("/users/me", userMe);
  v1Routes.post("/auth/login", authLogin);
  v1Routes.post("/auth/logout", authLogout);
  v1Routes.post("/auth/refresh", authRefresh);
}
