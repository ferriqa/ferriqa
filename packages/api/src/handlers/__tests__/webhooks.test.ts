/**
 * @ferriqa/api - Webhook Handler Unit Tests
 *
 * Based on Task 5.3: API Handler Tests
 */

import { describe, it, expect, createMockFn } from "@ferriqa/core/testing";
import { Hono } from "hono";
import type { Context, Next } from "hono";
import { setupWebhookRoutes } from "../../routes/v1/index.ts";
import {
    webhookListHandler,
    webhookGetHandler,
    webhookCreateHandler,
    webhookUpdateHandler,
    webhookDeleteHandler,
    webhookTestHandler,
    webhookDeliveriesHandler,
} from "../webhooks.ts";

// Mock WebhookService
const createMockService = () => {
    const query = createMockFn<any>();
    const getById = createMockFn<any>();
    const create = createMockFn<any>();
    const update = createMockFn<any>();
    const deleteFn = createMockFn<any>();
    const test = createMockFn<any>();
    const getDeliveries = createMockFn<any>();

    return {
        query: (...args: any[]) => query.call(...args),
        getById: (...args: any[]) => getById.call(...args),
        create: (...args: any[]) => create.call(...args),
        update: (...args: any[]) => update.call(...args),
        delete: (...args: any[]) => deleteFn.call(...args),
        test: (...args: any[]) => test.call(...args),
        getDeliveries: (...args: any[]) => getDeliveries.call(...args),
        mocks: {
            query,
            getById,
            create,
            update,
            delete: deleteFn,
            test,
            getDeliveries,
        },
    };
};

describe("Webhook Handlers", () => {
    it("webhookListHandler should return paginated webhooks", async () => {
        const service = createMockService();
        const handler = webhookListHandler(service as any);

        const mockData = {
            data: [{ id: 1, name: "Test" }],
            pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
        };
        service.mocks.query.mockReturnValue(Promise.resolve(mockData));

        const app = new Hono();
        app.get("/webhooks", handler);

        const res = await app.request("/webhooks?page=1&limit=10");

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data).toHaveLength(1);
        expect(json.pagination.total).toBe(1);
        expect(service.mocks.query.getCallCount()).toBe(1);
    });

    it("webhookGetHandler should return a webhook", async () => {
        const service = createMockService();
        const handler = webhookGetHandler(service as any);

        const mockWebhook = { id: 1, name: "Test" };
        service.mocks.getById.mockReturnValue(Promise.resolve(mockWebhook));

        const app = new Hono();
        app.get("/webhooks/:id", handler);

        const res = await app.request("/webhooks/1");

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data.id).toBe(1);
        expect(service.mocks.getById.getCallCount()).toBe(1);
    });

    it("webhookGetHandler should return 404 if not found", async () => {
        const service = createMockService();
        const handler = webhookGetHandler(service as any);

        service.mocks.getById.mockReturnValue(Promise.resolve(null));

        const app = new Hono();
        app.get("/webhooks/:id", handler);

        const res = await app.request("/webhooks/999");

        expect(res.status).toBe(404);
    });

    it("webhookCreateHandler should create a webhook", async () => {
        const service = createMockService();
        const handler = webhookCreateHandler(service as any);

        const mockCreated = { id: 1, name: "New Webhook" };
        service.mocks.create.mockReturnValue(Promise.resolve(mockCreated));

        const app = new Hono();
        app.use("*", async (c, next) => {
            (c as any).set("userId", 1);
            await next();
        });
        app.post("/webhooks", handler);

        const res = await app.request("/webhooks", {
            method: "POST",
            body: JSON.stringify({
                name: "New Webhook",
                url: "https://example.com/hook",
                events: ["content.created"],
                secret: "secure-secret-key-123456",
            }),
            headers: { "Content-Type": "application/json" },
        });

        expect(res.status).toBe(201);
        const json = await res.json();
        expect(json.data.name).toBe("New Webhook");
        expect(service.mocks.create.getCallCount()).toBe(1);
    });

    it("webhookUpdateHandler should update a webhook", async () => {
        const service = createMockService();
        const handler = webhookUpdateHandler(service as any);

        const mockUpdated = { id: 1, name: "Updated" };
        service.mocks.update.mockReturnValue(Promise.resolve(mockUpdated));

        const app = new Hono();
        app.put("/webhooks/:id", handler);

        const res = await app.request("/webhooks/1", {
            method: "PUT",
            body: JSON.stringify({ name: "Updated" }),
            headers: { "Content-Type": "application/json" },
        });

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data.name).toBe("Updated");
    });

    it("webhookDeleteHandler should delete a webhook", async () => {
        const service = createMockService();
        const handler = webhookDeleteHandler(service as any);

        service.mocks.delete.mockReturnValue(Promise.resolve());

        const app = new Hono();
        app.delete("/webhooks/:id", handler);

        const res = await app.request("/webhooks/1", { method: "DELETE" });

        expect(res.status).toBe(204);
        expect(service.mocks.delete.getCallCount()).toBe(1);
    });

    it("webhookTestHandler should test a webhook", async () => {
        const service = createMockService();
        const handler = webhookTestHandler(service as any);

        const mockResult = { success: true, statusCode: 200 };
        service.mocks.test.mockReturnValue(Promise.resolve(mockResult));

        const app = new Hono();
        app.post("/webhooks/:id/test", handler);

        const res = await app.request("/webhooks/1/test", {
            method: "POST",
            body: JSON.stringify({ event: "content.created" }),
            headers: { "Content-Type": "application/json" },
        });

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data.success).toBe(true);
    });

    it("webhookDeliveriesHandler should return deliveries", async () => {
        const service = createMockService();
        const handler = webhookDeliveriesHandler(service as any);

        service.mocks.getById.mockReturnValue(Promise.resolve({ id: 1 }));
        const mockDeliveries = {
            data: [{ id: "del-1", success: true }],
            pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
        };
        service.mocks.getDeliveries.mockReturnValue(Promise.resolve(mockDeliveries));

        const app = new Hono();
        app.get("/webhooks/:id/deliveries", handler);

        const res = await app.request("/webhooks/1/deliveries");

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.data).toHaveLength(1);
        expect(service.mocks.getDeliveries.getCallCount()).toBe(1);
    });
});
