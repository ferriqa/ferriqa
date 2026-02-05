/**
 * @ferriqa/core - Webhook Integration Tests
 *
 * Tests the full integration between Content/Blueprint services and the Webhook system.
 * Based on Task 5.4: Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll, runTests } from "../../testing/index.ts";
import { MockDatabaseAdapter } from "../../testing/mocks.ts";
import { HookRegistry } from "../../hooks/registry.ts";
import { ValidationEngine } from "../../validation/engine.ts";
import { globalFieldRegistry } from "../../fields/registry.ts";
import { SlugManager } from "../../slug/manager.ts";
import { ContentService } from "../../content/service.ts";
import { BlueprintService } from "../../blueprint/service.ts";
import { WebhookService } from "../../webhooks/service.ts";

describe("Webhook Integration", () => {
    let db: MockDatabaseAdapter;
    let hooks: HookRegistry;
    let webhookService: WebhookService;
    let contentService: ContentService;
    let blueprintService: BlueprintService;

    const originalFetch = global.fetch;

    beforeAll(async () => {
        db = new MockDatabaseAdapter();
        await db.connect();

        hooks = new HookRegistry();
        webhookService = new WebhookService({ db, hookRegistry: hooks, queueIntervalMs: 10 });

        const validationEngine = new ValidationEngine(globalFieldRegistry);
        const slugManager = new SlugManager(db);

        contentService = new ContentService({
            db,
            hookRegistry: hooks,
            validationEngine,
            slugManager,
            webhookService,
        });

        blueprintService = new BlueprintService({
            db,
            webhookService,
        });

        // Mock fetch for all tests
        global.fetch = (async () => new Response("OK", { status: 200 })) as unknown as typeof fetch;
    });

    afterAll(async () => {
        webhookService.destroy();
        await db.close();
        global.fetch = originalFetch;
    });

    it("should dispatch webhook when content is created", async () => {
        // 1. Create a blueprint
        const blueprint = await blueprintService.create({
            id: "page",
            name: "Page",
            slug: "page",
            fields: [{
                id: crypto.randomUUID(),
                key: "title",
                name: "Title",
                type: "text",
                required: true
            }],
            settings: {
                displayField: "title",
                defaultStatus: "draft",
                draftMode: true,
                versioning: true,
                apiAccess: "public",
                cacheEnabled: true
            }
        });

        // 2. Create a webhook for content.created
        const webhook = await webhookService.create({
            name: "Content Hook",
            url: "https://example.com/on-create",
            events: ["content.created"],
            isActive: true
        });

        // 3. Create content
        await contentService.create("page", {
            data: { title: "Hello World" }
        });

        // 4. Wait for queue processing
        await new Promise(resolve => setTimeout(resolve, 50));

        // 5. Check if delivery was logged
        const deliveries = await webhookService.getDeliveries(webhook.id);
        expect(deliveries.data.length).toBe(1);
        expect(deliveries.data[0].event).toBe("content.created");
        expect(deliveries.data[0].success).toBe(true);
    });

    it("should dispatch webhook when content is updated", async () => {
        const webhook = await webhookService.create({
            name: "Update Hook",
            url: "https://example.com/on-update-content",
            events: ["content.updated"],
            isActive: true
        });

        const content = await contentService.create("page", {
            data: { title: "Original Title" }
        });

        await contentService.update(content.id, {
            data: { title: "Updated Title" }
        });

        await new Promise(resolve => setTimeout(resolve, 50));

        const deliveries = await webhookService.getDeliveries(webhook.id);
        expect(deliveries.data.length).toBe(1);
        expect(deliveries.data[0].event).toBe("content.updated");
    });

    it("should dispatch webhook when content is deleted", async () => {
        const webhook = await webhookService.create({
            name: "Delete Hook",
            url: "https://example.com/on-delete-content",
            events: ["content.deleted"],
            isActive: true
        });

        const content = await contentService.create("page", {
            data: { title: "To be deleted" }
        });

        await contentService.delete(content.id);

        await new Promise(resolve => setTimeout(resolve, 50));

        const deliveries = await webhookService.getDeliveries(webhook.id);
        expect(deliveries.data.length).toBe(1);
        expect(deliveries.data[0].event).toBe("content.deleted");
    });

    it("should dispatch webhook when blueprint is created", async () => {
        const webhook = await webhookService.create({
            name: "Blueprint Hook",
            url: "https://example.com/on-bp-create",
            events: ["blueprint.created"],
            isActive: true
        });

        await blueprintService.create({
            id: "new-bp",
            name: "New BP",
            slug: "new-bp",
            fields: [],
            settings: {
                displayField: "id",
                defaultStatus: "draft",
                draftMode: true,
                versioning: false,
                apiAccess: "public",
                cacheEnabled: false
            }
        });

        await new Promise(resolve => setTimeout(resolve, 50));

        const deliveries = await webhookService.getDeliveries(webhook.id);
        expect(deliveries.data.length).toBe(1);
        expect(deliveries.data[0].event).toBe("blueprint.created");
    });

    it("should apply webhook:beforeSend filter to modify payload", async () => {
        const webhook = await webhookService.create({
            name: "Filter Hook",
            url: "https://example.com/on-filter-test",
            events: ["content.created"],
            isActive: true
        });

        // Register filter to add a custom field to all webhook payloads
        hooks.addFilter("webhook:beforeSend", (payload: any) => {
            return {
                ...payload,
                customField: "intercepted"
            };
        });

        let capturedPayload: any = null;
        const testFetch = (async (url: string, init: any) => {
            capturedPayload = JSON.parse(init.body);
            return new Response("OK", { status: 200 });
        }) as unknown as typeof fetch;

        const original = global.fetch;
        global.fetch = testFetch;

        try {
            await contentService.create("page", {
                data: { title: "Filtered Content" }
            });

            await new Promise(resolve => setTimeout(resolve, 50));

            expect(capturedPayload).not.toBeNull();
            expect(capturedPayload.customField).toBe("intercepted");
        } finally {
            global.fetch = original;
        }
    });

    it("should emit webhook:afterSend hook with result", async () => {
        const webhook = await webhookService.create({
            name: "Action Hook",
            url: "https://example.com/on-action-hook",
            events: ["content.created"],
            isActive: true
        });

        let actionReceived = false;
        hooks.on("webhook:afterSend", (context: any) => {
            if (context.webhook.id === webhook.id) {
                actionReceived = true;
            }
        });

        await contentService.create("page", {
            data: { title: "Action Content" }
        });

        await new Promise(resolve => setTimeout(resolve, 50));

        expect(actionReceived).toBe(true);
    });

    it("should dispatch webhook when blueprint is updated", async () => {
        const webhook = await webhookService.create({
            name: "BP Update Hook",
            url: "https://example.com/on-bp-update",
            events: ["blueprint.updated"],
            isActive: true
        });

        const blueprint = await blueprintService.create({
            id: "bp-to-update",
            name: "Original Name",
            slug: "original-slug",
            fields: [],
            settings: { displayField: "id", defaultStatus: "draft", draftMode: true, versioning: false, apiAccess: "public", cacheEnabled: false }
        });

        await blueprintService.update(blueprint.id, {
            name: "Updated Name"
        });

        await new Promise(resolve => setTimeout(resolve, 50));

        const deliveries = await webhookService.getDeliveries(webhook.id);
        expect(deliveries.data.length).toBe(1);
        expect(deliveries.data[0].event).toBe("blueprint.updated");
    });

    it("should dispatch webhook when blueprint is deleted", async () => {
        const webhook = await webhookService.create({
            name: "BP Delete Hook",
            url: "https://example.com/on-bp-delete",
            events: ["blueprint.deleted"],
            isActive: true
        });

        const blueprint = await blueprintService.create({
            id: "bp-to-delete",
            name: "To Be Deleted",
            slug: "to-be-deleted",
            fields: [],
            settings: { displayField: "id", defaultStatus: "draft", draftMode: true, versioning: false, apiAccess: "public", cacheEnabled: false }
        });

        await blueprintService.delete(blueprint.id);

        await new Promise(resolve => setTimeout(resolve, 50));

        const deliveries = await webhookService.getDeliveries(webhook.id);
        expect(deliveries.data.length).toBe(1);
        expect(deliveries.data[0].event).toBe("blueprint.deleted");
    });

    it("should dispatch webhook when content is published", async () => {
        const webhook = await webhookService.create({
            name: "Publish Hook",
            url: "https://example.com/on-publish",
            events: ["content.published"],
            isActive: true
        });

        const content = await contentService.create("page", {
            data: { title: "Draft Content" }
        });

        await contentService.publish(content.id);

        await new Promise(resolve => setTimeout(resolve, 50));

        const deliveries = await webhookService.getDeliveries(webhook.id);
        expect(deliveries.data.length).toBe(1);
        expect(deliveries.data[0].event).toBe("content.published");
    });

    it("should dispatch webhook when content is unpublished", async () => {
        const webhook = await webhookService.create({
            name: "Unpublish Hook",
            url: "https://example.com/on-unpublish",
            events: ["content.unpublished"],
            isActive: true
        });

        const content = await contentService.create("page", {
            data: { title: "Published Content" }
        });

        await contentService.publish(content.id);
        await contentService.unpublish(content.id);

        await new Promise(resolve => setTimeout(resolve, 100));

        const deliveries = await webhookService.getDeliveries(webhook.id);
        expect(deliveries.data.length).toBe(1);
        expect(deliveries.data[0].event).toBe("content.unpublished");
    });
});

runTests();
