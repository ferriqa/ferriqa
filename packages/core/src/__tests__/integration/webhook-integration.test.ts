/**
 * @ferriqa/core - Webhook Integration Tests
 *
 * Tests the full integration between Content/Blueprint services and the Webhook system.
 * Based on Task 5.4: Integration Tests
 */

import { test } from "@cross/test";
import { assertStrictEquals, assertExists } from "@std/assert";
import { MockDatabaseAdapter } from "../../testing/mocks.ts";
import { HookRegistry } from "../../hooks/registry.ts";
import { ValidationEngine } from "../../validation/engine.ts";
import { globalFieldRegistry } from "../../fields/registry.ts";
import { SlugManager } from "../../slug/manager.ts";
import { ContentService } from "../../content/service.ts";
import { BlueprintService } from "../../blueprint/service.ts";
import { WebhookService } from "../../webhooks/service.ts";

interface WebhookTestContext {
  db: MockDatabaseAdapter;
  hooks: HookRegistry;
  webhookService: WebhookService;
  contentService: ContentService;
  blueprintService: BlueprintService;
  originalFetch: typeof fetch;
}

async function setupWebhookTest(): Promise<WebhookTestContext> {
  const db = new MockDatabaseAdapter();
  await db.connect();

  const hooks = new HookRegistry();

  const webhookService = new WebhookService({
    db,
    hookRegistry: hooks,
    queueIntervalMs: 10,
  });

  const validationEngine = new ValidationEngine(globalFieldRegistry);
  const slugManager = new SlugManager(db);

  const contentService = new ContentService({
    db,
    hookRegistry: hooks,
    validationEngine,
    slugManager,
    webhookService,
  });

  const blueprintService = new BlueprintService({
    db,
    webhookService,
  });

  const originalFetch = global.fetch;

  global.fetch = (async () =>
    new Response("OK", { status: 200 })) as unknown as typeof fetch;

  await blueprintService.create({
    id: "page",
    name: "Page",
    slug: "page",
    fields: [
      {
        id: crypto.randomUUID(),
        key: "title",
        name: "Title",
        type: "text",
        required: true,
      },
    ],
    settings: {
      displayField: "title",
      defaultStatus: "draft",
      draftMode: true,
      versioning: true,
      apiAccess: "public",
      cacheEnabled: true,
    },
  });

  return {
    db,
    hooks,
    webhookService,
    contentService,
    blueprintService,
    originalFetch,
  };
}

async function cleanupWebhookTest(context: WebhookTestContext): Promise<void> {
  await context.webhookService.destroy();
  await new Promise((resolve) => setTimeout(resolve, 100));
  global.fetch = context.originalFetch;
  await context.db.close();
}

test("Webhook Integration > Content > should dispatch webhook when content is created", async () => {
  const context = await setupWebhookTest();

  try {
    const webhook = await context.webhookService.create({
      name: "Content Hook",
      url: "https://example.com/on-create",
      events: ["content.created"],
      isActive: true,
    });

    await context.contentService.create("page", {
      data: { title: "Hello World" },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    const deliveries = await context.webhookService.getDeliveries(webhook.id);
    assertStrictEquals(deliveries.data.length, 1);
    assertStrictEquals(deliveries.data[0].event, "content.created");
    assertStrictEquals(deliveries.data[0].success, true);
  } finally {
    await cleanupWebhookTest(context);
  }
});

test("Webhook Integration > Content > should dispatch webhook when content is updated", async () => {
  const context = await setupWebhookTest();

  try {
    const webhook = await context.webhookService.create({
      name: "Update Hook",
      url: "https://example.com/on-update-content",
      events: ["content.updated"],
      isActive: true,
    });

    const content = await context.contentService.create("page", {
      data: { title: "Original Title" },
    });

    await context.contentService.update(content.id, {
      data: { title: "Updated Title" },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    const deliveries = await context.webhookService.getDeliveries(webhook.id);
    assertStrictEquals(deliveries.data.length, 1);
    assertStrictEquals(deliveries.data[0].event, "content.updated");
  } finally {
    await cleanupWebhookTest(context);
  }
});

test("Webhook Integration > Content > should dispatch webhook when content is deleted", async () => {
  const context = await setupWebhookTest();

  try {
    const webhook = await context.webhookService.create({
      name: "Delete Hook",
      url: "https://example.com/on-delete-content",
      events: ["content.deleted"],
      isActive: true,
    });

    const content = await context.contentService.create("page", {
      data: { title: "To be deleted" },
    });

    await context.contentService.delete(content.id);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const deliveries = await context.webhookService.getDeliveries(webhook.id);
    assertStrictEquals(deliveries.data.length, 1);
    assertStrictEquals(deliveries.data[0].event, "content.deleted");
  } finally {
    await cleanupWebhookTest(context);
  }
});

test("Webhook Integration > Blueprint > should dispatch webhook when blueprint is created", async () => {
  const context = await setupWebhookTest();

  try {
    const webhook = await context.webhookService.create({
      name: "Blueprint Hook",
      url: "https://example.com/on-bp-create",
      events: ["blueprint.created"],
      isActive: true,
    });

    await context.blueprintService.create({
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
        cacheEnabled: false,
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    const deliveries = await context.webhookService.getDeliveries(webhook.id);
    assertStrictEquals(deliveries.data.length, 1);
    assertStrictEquals(deliveries.data[0].event, "blueprint.created");
  } finally {
    await cleanupWebhookTest(context);
  }
});

test("Webhook Integration > Filters > should apply webhook:beforeSend filter to modify payload", async () => {
  const context = await setupWebhookTest();

  try {
    await context.webhookService.create({
      name: "Filter Hook",
      url: "https://example.com/on-filter-test",
      events: ["content.created"],
      isActive: true,
    });

    context.hooks.addFilter("webhook:beforeSend", (payload: any) => {
      return {
        ...payload,
        customField: "intercepted",
      };
    });

    let capturedPayload: any = null;
    const testFetch = (async (_url: string, init: any) => {
      capturedPayload = JSON.parse(init.body);
      return new Response("OK", { status: 200 });
    }) as unknown as typeof fetch;

    const original = global.fetch;
    global.fetch = testFetch;

    try {
      await context.contentService.create("page", {
        data: { title: "Filtered Content" },
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      assertExists(capturedPayload);
      assertStrictEquals(capturedPayload.customField, "intercepted");
    } finally {
      global.fetch = original;
    }
  } finally {
    await cleanupWebhookTest(context);
  }
});

test("Webhook Integration > Hooks > should emit webhook:afterSend hook with result", async () => {
  const context = await setupWebhookTest();

  try {
    const webhook = await context.webhookService.create({
      name: "Action Hook",
      url: "https://example.com/on-action-hook",
      events: ["content.created"],
      isActive: true,
    });

    let actionReceived = false;
    context.hooks.on("webhook:afterSend", (context: any) => {
      if (context.webhook.id === webhook.id) {
        actionReceived = true;
      }
    });

    await context.contentService.create("page", {
      data: { title: "Action Content" },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assertStrictEquals(actionReceived, true);
  } finally {
    await cleanupWebhookTest(context);
  }
});

test("Webhook Integration > Blueprint > should dispatch webhook when blueprint is updated", async () => {
  const context = await setupWebhookTest();

  try {
    const webhook = await context.webhookService.create({
      name: "BP Update Hook",
      url: "https://example.com/on-bp-update",
      events: ["blueprint.updated"],
      isActive: true,
    });

    const blueprint = await context.blueprintService.create({
      id: "bp-to-update",
      name: "Original Name",
      slug: "original-slug",
      fields: [],
      settings: {
        displayField: "id",
        defaultStatus: "draft",
        draftMode: true,
        versioning: false,
        apiAccess: "public",
        cacheEnabled: false,
      },
    });

    await context.blueprintService.update(blueprint.id, {
      name: "Updated Name",
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    const deliveries = await context.webhookService.getDeliveries(webhook.id);
    assertStrictEquals(deliveries.data.length, 1);
    assertStrictEquals(deliveries.data[0].event, "blueprint.updated");
  } finally {
    await cleanupWebhookTest(context);
  }
});

test("Webhook Integration > Blueprint > should dispatch webhook when blueprint is deleted", async () => {
  const context = await setupWebhookTest();

  try {
    const webhook = await context.webhookService.create({
      name: "BP Delete Hook",
      url: "https://example.com/on-bp-delete",
      events: ["blueprint.deleted"],
      isActive: true,
    });

    const blueprint = await context.blueprintService.create({
      id: "bp-to-delete",
      name: "To Be Deleted",
      slug: "to-be-deleted",
      fields: [],
      settings: {
        displayField: "id",
        defaultStatus: "draft",
        draftMode: true,
        versioning: false,
        apiAccess: "public",
        cacheEnabled: false,
      },
    });

    await context.blueprintService.delete(blueprint.id);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const deliveries = await context.webhookService.getDeliveries(webhook.id);
    assertStrictEquals(deliveries.data.length, 1);
    assertStrictEquals(deliveries.data[0].event, "blueprint.deleted");
  } finally {
    await cleanupWebhookTest(context);
  }
});

test("Webhook Integration > Content > should dispatch webhook when content is published", async () => {
  const context = await setupWebhookTest();

  try {
    const webhook = await context.webhookService.create({
      name: "Publish Hook",
      url: "https://example.com/on-publish",
      events: ["content.published"],
      isActive: true,
    });

    const content = await context.contentService.create("page", {
      data: { title: "Draft Content" },
    });

    await context.contentService.publish(content.id);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const deliveries = await context.webhookService.getDeliveries(webhook.id);
    assertStrictEquals(deliveries.data.length, 1);
    assertStrictEquals(deliveries.data[0].event, "content.published");
  } finally {
    await cleanupWebhookTest(context);
  }
});

test("Webhook Integration > Content > should dispatch webhook when content is unpublished", async () => {
  const context = await setupWebhookTest();

  try {
    const webhook = await context.webhookService.create({
      name: "Unpublish Hook",
      url: "https://example.com/on-unpublish",
      events: ["content.unpublished"],
      isActive: true,
    });

    const content = await context.contentService.create("page", {
      data: { title: "Published Content" },
    });

    await context.contentService.publish(content.id);
    await context.contentService.unpublish(content.id);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const deliveries = await context.webhookService.getDeliveries(webhook.id);
    assertStrictEquals(deliveries.data.length, 1);
    assertStrictEquals(deliveries.data[0].event, "content.unpublished");
  } finally {
    await cleanupWebhookTest(context);
  }
});
