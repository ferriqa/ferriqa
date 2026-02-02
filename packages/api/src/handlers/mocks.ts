/**
 * Mock Handlers
 *
 * Temporary mock handlers for all endpoints
 * These return mock data and will be replaced with real implementations
 */

import type { Context } from "hono";

const MOCK_BLUEPRINTS = [
  {
    id: "bp-1",
    name: "Blog Posts",
    slug: "posts",
    description: "Blog posts",
    fields: [],
    settings: {
      draftMode: true,
      versioning: true,
      apiAccess: "public",
      cacheEnabled: true,
      displayField: "title",
      defaultStatus: "draft",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const MOCK_CONTENTS: Array<{
  id: string;
  blueprintId: string;
  slug: string;
  status: string;
  data: Record<string, unknown>;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}> = [
  {
    id: "c-1",
    blueprintId: "bp-1",
    slug: "first-post",
    status: "published",
    data: { title: "First Post", content: "Hello world" },
    publishedAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function blueprintListHandler() {
  return async (c: Context) => {
    const { page = "1", limit = "25", search } = c.req.query();
    let data = [...MOCK_BLUEPRINTS];

    if (search) {
      data = data.filter(
        (bp) =>
          bp.name.toLowerCase().includes(search.toLowerCase()) ||
          bp.description?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const start = (pageNum - 1) * limitNum;
    const paginated = data.slice(start, start + limitNum);

    c.header("X-Total-Count", String(data.length));
    c.header("X-Page-Count", String(Math.ceil(data.length / limitNum)));

    return c.json({
      data: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: data.length,
        totalPages: Math.ceil(data.length / limitNum),
      },
    });
  };
}

export function blueprintGetHandler() {
  return async (c: Context) => {
    const { id } = c.req.param();
    const blueprint = MOCK_BLUEPRINTS.find((bp) => bp.id === id);

    if (!blueprint) {
      return c.json(
        { error: "Not Found", message: "Blueprint not found" },
        404,
      );
    }

    return c.json({ data: blueprint });
  };
}

export function blueprintCreateHandler() {
  return async (c: Context) => {
    const body = await c.req.json();
    const newBlueprint = {
      id: `bp-${Date.now()}`,
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    MOCK_BLUEPRINTS.push(newBlueprint);
    return c.json({ data: newBlueprint }, 201);
  };
}

export function blueprintUpdateHandler() {
  return async (c: Context) => {
    const { id } = c.req.param();
    const body = await c.req.json();
    const index = MOCK_BLUEPRINTS.findIndex((bp) => bp.id === id);

    if (index === -1) {
      return c.json(
        { error: "Not Found", message: "Blueprint not found" },
        404,
      );
    }

    MOCK_BLUEPRINTS[index] = {
      ...MOCK_BLUEPRINTS[index],
      ...body,
      updatedAt: new Date(),
    };

    return c.json({ data: MOCK_BLUEPRINTS[index] });
  };
}

export function blueprintDeleteHandler() {
  return async (c: Context) => {
    const { id } = c.req.param();
    const index = MOCK_BLUEPRINTS.findIndex((bp) => bp.id === id);

    if (index === -1) {
      return c.json(
        { error: "Not Found", message: "Blueprint not found" },
        404,
      );
    }

    MOCK_BLUEPRINTS.splice(index, 1);
    return c.body(null, 204);
  };
}

export function contentListHandler() {
  return async (c: Context) => {
    const { page = "1", limit = "25", blueprint, status } = c.req.query();
    let data = [...MOCK_CONTENTS];

    if (blueprint) {
      data = data.filter((c) => c.blueprintId === blueprint);
    }

    if (status) {
      data = data.filter((c) => c.status === status);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const start = (pageNum - 1) * limitNum;
    const paginated = data.slice(start, start + limitNum);

    c.header("X-Total-Count", String(data.length));
    c.header("X-Page-Count", String(Math.ceil(data.length / limitNum)));

    return c.json({
      data: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: data.length,
        totalPages: Math.ceil(data.length / limitNum),
      },
    });
  };
}

export function contentGetHandler() {
  return async (c: Context) => {
    const { id } = c.req.param();
    const content = MOCK_CONTENTS.find((c) => c.id === id);

    if (!content) {
      return c.json({ error: "Not Found", message: "Content not found" }, 404);
    }

    return c.json({ data: content });
  };
}

export function contentBySlugHandler() {
  return async (c: Context) => {
    const { slug } = c.req.param();
    const blueprint = c.req.query("blueprint");

    if (!blueprint) {
      return c.json(
        {
          error: "Bad Request",
          message: "Blueprint query parameter is required",
        },
        400,
      );
    }

    const content = MOCK_CONTENTS.find(
      (c) => c.slug === slug && c.blueprintId === blueprint,
    );

    if (!content) {
      return c.json({ error: "Not Found", message: "Content not found" }, 404);
    }

    return c.json({ data: content });
  };
}

export function contentCreateHandler() {
  return async (c: Context) => {
    const body = await c.req.json();
    const newContent = {
      id: `c-${Date.now()}`,
      blueprintId: body.blueprintId,
      slug: body.slug || `content-${Date.now()}`,
      status: body.status || "draft",
      data: body.data || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    MOCK_CONTENTS.push(newContent);
    return c.json({ data: newContent }, 201);
  };
}

export function contentUpdateHandler() {
  return async (c: Context) => {
    const { id } = c.req.param();
    const body = await c.req.json();
    const index = MOCK_CONTENTS.findIndex((c) => c.id === id);

    if (index === -1) {
      return c.json({ error: "Not Found", message: "Content not found" }, 404);
    }

    const existing = MOCK_CONTENTS[index];

    MOCK_CONTENTS[index] = {
      ...existing,
      slug: body.slug ?? existing.slug,
      status: body.status ?? existing.status,
      data: body.data ?? existing.data,
      updatedAt: new Date(),
    };

    return c.json({ data: MOCK_CONTENTS[index] });
  };
}

export function contentDeleteHandler() {
  return async (c: Context) => {
    const { id } = c.req.param();
    const index = MOCK_CONTENTS.findIndex((c) => c.id === id);

    if (index === -1) {
      return c.json({ error: "Not Found", message: "Content not found" }, 404);
    }

    MOCK_CONTENTS.splice(index, 1);
    return c.body(null, 204);
  };
}

export function contentPublishHandler() {
  return async (c: Context) => {
    const { id } = c.req.param();
    const content = MOCK_CONTENTS.find((c) => c.id === id);

    if (!content) {
      return c.json({ error: "Not Found", message: "Content not found" }, 404);
    }

    content.status = "published";
    content.publishedAt = new Date();
    content.updatedAt = new Date();

    return c.json({ data: content });
  };
}

export function contentUnpublishHandler() {
  return async (c: Context) => {
    const { id } = c.req.param();
    const content = MOCK_CONTENTS.find((c) => c.id === id);

    if (!content) {
      return c.json({ error: "Not Found", message: "Content not found" }, 404);
    }

    content.status = "draft";
    content.updatedAt = new Date();

    return c.json({ data: content });
  };
}

export function contentVersionsHandler() {
  return async (c: Context) => {
    return c.json({ data: [] });
  };
}

export function contentRollbackHandler() {
  return async (c: Context) => {
    const { id } = c.req.param();
    const content = MOCK_CONTENTS.find((c) => c.id === id);

    if (!content) {
      return c.json({ error: "Not Found", message: "Content not found" }, 404);
    }

    return c.json({ data: content });
  };
}

export function mediaListHandler() {
  return async (c: Context) => {
    return c.json({
      data: [],
      pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
    });
  };
}

export function mediaUploadHandler() {
  return async (c: Context) => {
    return c.json({ data: { id: "mock", url: "/uploads/mock.jpg" } }, 201);
  };
}

export function mediaGetHandler() {
  return async (c: Context) => {
    const { id } = c.req.param();
    return c.json({ data: { id, url: `/uploads/${id}.jpg` } });
  };
}

export function mediaDeleteHandler() {
  return async (c: Context) => {
    return c.body(null, 204);
  };
}

export function webhookListHandler() {
  return async (c: Context) => {
    return c.json({
      data: [],
      pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
    });
  };
}

export function webhookCreateHandler() {
  return async (c: Context) => {
    return c.json({ data: { id: "mock", name: "Test Webhook" } }, 201);
  };
}

export function webhookUpdateHandler() {
  return async (c: Context) => {
    const { id } = c.req.param();
    return c.json({ data: { id, name: "Updated Webhook" } });
  };
}

export function webhookDeleteHandler() {
  return async (c: Context) => {
    return c.body(null, 204);
  };
}

export function webhookTestHandler() {
  return async (c: Context) => {
    return c.json({ message: "Test webhook triggered" });
  };
}

export function webhookDeliveriesHandler() {
  return async (c: Context) => {
    return c.json({
      data: [],
      pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
    });
  };
}

export function userMeHandler() {
  return async (c: Context) => {
    return c.json({ data: { id: "user-1", email: "user@example.com" } });
  };
}

export function authLoginHandler() {
  return async (c: Context) => {
    return c.json({
      data: { accessToken: "mock-token", refreshToken: "mock-refresh" },
    });
  };
}

export function authLogoutHandler() {
  return async (c: Context) => {
    return c.json({ success: true });
  };
}

export function authRefreshHandler() {
  return async (c: Context) => {
    return c.json({
      data: { accessToken: "new-mock-token", refreshToken: "new-mock-refresh" },
    });
  };
}
