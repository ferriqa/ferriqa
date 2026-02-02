/**
 * Content Handlers
 *
 * RESTful API handlers for Content CRUD operations
 * Based on roadmap 3.1 - RESTful Endpoints Implementation
 */

import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentService } from "@ferriqa/core/content";
import type {
  CreateContentInput,
  UpdateContentInput,
} from "@ferriqa/core/content";
import { parseQuery } from "../utils/query-parser";

export function contentListHandler(contentService: ContentService) {
  return async (c: Context) => {
    const query = parseQuery(c.req.query());
    const blueprint = c.req.query("blueprint");
    const status = c.req.query("status");

    const result = await contentService.query({
      blueprintId: blueprint,
      status: status as any,
      filters: query.filters,
      sort: query.sort,
      populate: query.populate,
      fields: query.fields,
      pagination: query.pagination,
    });

    c.header("X-Total-Count", String(result.pagination.total));
    c.header("X-Page-Count", String(result.pagination.totalPages));

    return c.json({ data: result.data, pagination: result.pagination });
  };
}

export function contentGetHandler(contentService: ContentService) {
  return async (c: Context) => {
    const { id } = c.req.param();

    const content = await contentService.getById(id);

    if (!content) {
      throw new HTTPException(404, { message: "Content not found" });
    }

    return c.json({ data: content });
  };
}

export function contentBySlugHandler(contentService: ContentService) {
  return async (c: Context) => {
    const { slug } = c.req.param();
    const blueprint = c.req.query("blueprint");

    if (!blueprint) {
      throw new HTTPException(400, {
        message: "Blueprint query parameter is required",
      });
    }

    const content = await contentService.getBySlug(blueprint, slug);

    if (!content) {
      throw new HTTPException(404, { message: "Content not found" });
    }

    return c.json({ data: content });
  };
}

export function contentCreateHandler(contentService: ContentService) {
  return async (c: Context) => {
    const body = (await c.req.json()) as CreateContentInput & {
      blueprintId: string;
    };
    const userId = c.get("userId");

    try {
      const content = await contentService.create(
        body.blueprintId,
        {
          data: body.data,
          slug: body.slug,
          status: body.status,
          meta: body.meta,
        },
        userId,
      );

      return c.json({ data: content }, 201);
    } catch (error: any) {
      if (error.message?.includes("Validation failed")) {
        throw new HTTPException(400, {
          message: "Validation failed",
          res: c.json({ errors: error.errors }),
        });
      }
      throw error;
    }
  };
}

export function contentUpdateHandler(contentService: ContentService) {
  return async (c: Context) => {
    const { id } = c.req.param();
    const body = (await c.req.json()) as UpdateContentInput;
    const userId = c.get("userId");

    try {
      const content = await contentService.update(id, body, userId);

      return c.json({ data: content });
    } catch (error: any) {
      if (error.message?.includes("Validation failed")) {
        throw new HTTPException(400, {
          message: "Validation failed",
          res: c.json({ errors: error.errors }),
        });
      }
      throw error;
    }
  };
}

export function contentDeleteHandler(contentService: ContentService) {
  return async (c: Context) => {
    const { id } = c.req.param();
    const userId = c.get("userId");

    await contentService.delete(id, userId);

    return c.body(null, 204);
  };
}

export function contentPublishHandler(contentService: ContentService) {
  return async (c: Context) => {
    const { id } = c.req.param();
    const userId = c.get("userId");

    try {
      const content = await contentService.publish(id, userId);

      return c.json({ data: content });
    } catch (error: any) {
      throw new HTTPException(400, { message: error.message });
    }
  };
}

export function contentUnpublishHandler(contentService: ContentService) {
  return async (c: Context) => {
    const { id } = c.req.param();
    const userId = c.get("userId");

    try {
      const content = await contentService.unpublish(id, userId);

      return c.json({ data: content });
    } catch (error: any) {
      throw new HTTPException(400, { message: error.message });
    }
  };
}

export function contentVersionsHandler(contentService: ContentService) {
  return async (c: Context) => {
    const { id } = c.req.param();

    const versions = await contentService.getVersions(id);

    return c.json({ data: versions });
  };
}

export function contentRollbackHandler(contentService: ContentService) {
  return async (c: Context) => {
    const { id, versionId } = c.req.param();
    const userId = c.get("userId");

    try {
      const content = await contentService.rollback(id, versionId, userId);

      return c.json({ data: content });
    } catch (error: any) {
      throw new HTTPException(400, { message: error.message });
    }
  };
}
