/**
 * Blueprint Handlers
 *
 * RESTful API handlers for Blueprint CRUD operations
 * Based on roadmap 3.1 - RESTful Endpoints Implementation
 */

import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type {
  BlueprintService,
  CreateBlueprintInput,
  UpdateBlueprintInput,
} from "@ferriqa/core/blueprint";

export function blueprintListHandler(blueprintService: BlueprintService) {
  return async (c: Context) => {
    const { page, limit, search } = c.req.query();

    const result = await blueprintService.query({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
    });

    c.header("X-Total-Count", String(result.pagination.total));
    c.header("X-Page-Count", String(result.pagination.totalPages));

    return c.json({ data: result.data, pagination: result.pagination });
  };
}

export function blueprintGetHandler(blueprintService: BlueprintService) {
  return async (c: Context) => {
    const { id } = c.req.param();

    const blueprint = await blueprintService.getById(id);

    if (!blueprint) {
      throw new HTTPException(404, { message: "Blueprint not found" });
    }

    return c.json({ data: blueprint });
  };
}

export function blueprintCreateHandler(blueprintService: BlueprintService) {
  return async (c: Context) => {
    const body = (await c.req.json()) as CreateBlueprintInput;

    const result = await blueprintService.create(body);

    return c.json({ data: result }, 201);
  };
}

export function blueprintUpdateHandler(blueprintService: BlueprintService) {
  return async (c: Context) => {
    const { id } = c.req.param();
    const body = (await c.req.json()) as UpdateBlueprintInput;

    const result = await blueprintService.update(id, body);

    return c.json({ data: result });
  };
}

export function blueprintDeleteHandler(blueprintService: BlueprintService) {
  return async (c: Context) => {
    const { id } = c.req.param();

    await blueprintService.delete(id);

    return c.body(null, 204);
  };
}
