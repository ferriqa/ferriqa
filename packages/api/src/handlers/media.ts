/**
 * @ferriqa/api - Media Handlers
 */

import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { MediaService } from "../media/service.ts";

export const mediaListHandler =
  (service: MediaService) => async (c: Context) => {
    const { page = "1", limit = "25" } = c.req.query();

    const result = await service.list(parseInt(page), parseInt(limit));

    return c.json({
      data: result.data,
      pagination: result.pagination,
    });
  };

export const mediaUploadHandler =
  (service: MediaService) => async (c: Context) => {
    // Hono handles formData parsing
    const formData = await c.req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      throw new HTTPException(400, { message: "No file provided" });
    }

    const userId = c.get("userId");
    const media = await service.upload(file, userId);

    return c.json({ data: media }, 201);
  };

export const mediaGetHandler =
  (service: MediaService) => async (c: Context) => {
    const id = c.req.param("id");
    const media = await service.getById(id);

    if (!media) {
      throw new HTTPException(404, { message: "Media not found" });
    }

    return c.json({ data: media });
  };

export const mediaDeleteHandler =
  (service: MediaService) => async (c: Context) => {
    const id = c.req.param("id");

    try {
      await service.delete(id);
      return c.body(null, 204);
    } catch (error) {
      if (error instanceof Error && error.message === "Media not found") {
        throw new HTTPException(404, { message: "Media not found" });
      }
      throw error;
    }
  };
