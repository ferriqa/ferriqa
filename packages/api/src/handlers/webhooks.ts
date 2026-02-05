/**
 * Webhook Handlers
 *
 * RESTful API handlers for Webhook CRUD operations
 * Based on roadmap - Webhook Implementation Plan
 */

import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type {
  WebhookService,
  CreateWebhookRequest,
  UpdateWebhookRequest,
} from "@ferriqa/core/webhooks";
import {
  WebhookCreateSchema,
  WebhookUpdateSchema,
  WebhookTestSchema,
  WebhookQuerySchema,
  WebhookDeliveryQuerySchema,
} from "./validators/webhooks";
import { validateWebhookId } from "./validators/common";

export function webhookListHandler(webhookService: WebhookService) {
  return async (c: Context) => {
    const queryResult = WebhookQuerySchema.safeParse(c.req.query());

    if (!queryResult.success) {
      throw new HTTPException(400, {
        message: "Invalid query parameters",
        cause: queryResult.error,
      });
    }

    const { page, limit, event, isActive } = queryResult.data;

    const result = await webhookService.query({
      page,
      limit,
      event,
      isActive,
    });

    c.header("X-Total-Count", String(result.pagination.total));
    c.header("X-Page-Count", String(result.pagination.totalPages));

    return c.json({
      data: result.data,
      pagination: result.pagination,
    });
  };
}

export function webhookGetHandler(webhookService: WebhookService) {
  return async (c: Context) => {
    const { id } = c.req.param();
    const webhookId = validateWebhookId(id);

    const webhook = await webhookService.getById(webhookId);

    if (!webhook) {
      throw new HTTPException(404, { message: "Webhook not found" });
    }

    return c.json({ data: webhook });
  };
}

export function webhookCreateHandler(webhookService: WebhookService) {
  return async (c: Context) => {
    const bodyResult = WebhookCreateSchema.safeParse(await c.req.json());

    if (!bodyResult.success) {
      throw new HTTPException(400, {
        message: "Invalid request body",
        cause: bodyResult.error,
      });
    }

    const userId = c.get("userId");
    if (!userId) {
      throw new HTTPException(401, {
        message: "Unauthorized - user ID required",
      });
    }

    /**
     * Build create data from validated input
     * Zod schema (WebhookCreateSchema) already validates all fields including
     * headers as Record<string, string>, so the type is guaranteed at runtime.
     * The explicit CreateWebhookRequest type provides compile-time safety.
     */
    const createData: CreateWebhookRequest = {
      name: bodyResult.data.name,
      url: bodyResult.data.url,
      events: bodyResult.data.events,
      ...(bodyResult.data.headers && {
        headers: bodyResult.data.headers,
      }),
      ...(bodyResult.data.secret && { secret: bodyResult.data.secret }),
      ...(bodyResult.data.isActive !== undefined && {
        isActive: bodyResult.data.isActive,
      }),
    };
    const webhook = await webhookService.create(createData, userId);

    return c.json({ data: webhook }, 201);
  };
}

export function webhookUpdateHandler(webhookService: WebhookService) {
  return async (c: Context) => {
    const { id } = c.req.param();
    const webhookId = validateWebhookId(id);

    const bodyResult = WebhookUpdateSchema.safeParse(await c.req.json());

    if (!bodyResult.success) {
      throw new HTTPException(400, {
        message: "Invalid request body",
        cause: bodyResult.error,
      });
    }

    /**
     * Build update data from validated input
     * Zod validation (WebhookUpdateSchema) already guarantees all fields match
     * UpdateWebhookRequest types. The Partial<> type ensures we only send fields
     * that were actually provided in the request.
     * Note: All fields in UpdateWebhookRequest are optional, so Partial<> has same shape.
     * Secret can be explicitly set to null to delete it.
     */
    const updateData: Partial<UpdateWebhookRequest> = {};
    if (bodyResult.data.name !== undefined) {
      updateData.name = bodyResult.data.name;
    }
    if (bodyResult.data.url !== undefined) {
      updateData.url = bodyResult.data.url;
    }
    if (bodyResult.data.events) {
      updateData.events = bodyResult.data.events;
    }
    if (bodyResult.data.headers !== undefined) {
      updateData.headers = bodyResult.data.headers;
    }
    if ("secret" in bodyResult.data) {
      updateData.secret = bodyResult.data.secret;
    }
    if (bodyResult.data.isActive !== undefined) {
      updateData.isActive = bodyResult.data.isActive;
    }

    const webhook = await webhookService.update(webhookId, updateData);

    return c.json({ data: webhook });
  };
}

export function webhookDeleteHandler(webhookService: WebhookService) {
  return async (c: Context) => {
    const { id } = c.req.param();
    const webhookId = validateWebhookId(id);

    await webhookService.delete(webhookId);

    return c.body(null, 204);
  };
}

export function webhookTestHandler(webhookService: WebhookService) {
  return async (c: Context) => {
    const { id } = c.req.param();
    const webhookId = validateWebhookId(id);

    const bodyResult = WebhookTestSchema.safeParse(await c.req.json());

    if (!bodyResult.success) {
      throw new HTTPException(400, {
        message: "Invalid request body",
        cause: bodyResult.error,
      });
    }

    const { event, data } = bodyResult.data;
    const result = await webhookService.test(webhookId, event, data);

    return c.json({ data: result }, 200);
  };
}

export function webhookDeliveriesHandler(webhookService: WebhookService) {
  return async (c: Context) => {
    const { id } = c.req.param();
    const webhookId = validateWebhookId(id);

    const webhook = await webhookService.getById(webhookId);
    if (!webhook) {
      throw new HTTPException(404, { message: "Webhook not found" });
    }

    const queryResult = WebhookDeliveryQuerySchema.safeParse(c.req.query());

    if (!queryResult.success) {
      throw new HTTPException(400, {
        message: "Invalid query parameters",
        cause: queryResult.error,
      });
    }

    const { page, limit } = queryResult.data;

    const result = await webhookService.getDeliveries(webhookId, {
      page,
      limit,
    });

    c.header("X-Total-Count", String(result.pagination.total));
    c.header("X-Page-Count", String(result.pagination.totalPages));

    return c.json({
      data: result.data,
      pagination: result.pagination,
    });
  };
}
