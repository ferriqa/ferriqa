import type { Page, Route } from "@playwright/test";
import {
  testBlueprint,
  articleBlueprint,
  allBlueprints,
  testContentItems,
  testUsers,
  testMediaFiles,
  testWebhooks,
  testApiKeys,
  testPlugins,
  type TestUser,
  type TestWebhook,
  type TestApiKey,
} from "./fixtures";
import type { Blueprint } from "../../src/lib/components/blueprint/types";
import type { ContentItem } from "../../src/lib/components/content/types";
import type { MediaFile } from "../../src/lib/components/media/types";

/**
 * Setup API mocks for a test page
 */
export async function setupApiMocks(page: Page) {
  // Mock all API requests
  await page.route("/api/**", async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;
    const method = request.method();

    console.log(`[Mock] ${method} ${pathname}`);

    // Blueprint API routes
    if (pathname.startsWith("/api/blueprints")) {
      return handleBlueprintRoute(route, pathname, method);
    }

    // Content API routes
    if (pathname.startsWith("/api/v1/contents")) {
      return handleContentRoute(route, pathname, method, url);
    }

    // Users API routes
    if (pathname.startsWith("/api/v1/users")) {
      return handleUsersRoute(route, pathname, method, url);
    }

    // Media API routes
    if (pathname.startsWith("/api/media")) {
      return handleMediaRoute(route, pathname, method, url);
    }

    // Webhook API routes
    if (pathname.startsWith("/api/v1/webhooks")) {
      return handleWebhookRoute(route, pathname, method, url);
    }

    // API Key routes
    if (pathname.startsWith("/api/v1/api-keys")) {
      return handleApiKeysRoute(route, pathname, method, url);
    }

    // Plugin routes
    if (pathname.startsWith("/api/v1/plugins")) {
      return handlePluginsRoute(route, pathname, method, url);
    }

    // If no match, continue to actual server
    await route.continue();
  });
}

async function handleBlueprintRoute(
  route: Route,
  pathname: string,
  method: string,
) {
  // GET /api/blueprints - List all blueprints
  if (pathname === "/api/blueprints" && method === "GET") {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: allBlueprints,
        meta: {
          total: allBlueprints.length,
          page: 1,
          limit: 50,
          totalPages: 1,
        },
      }),
    });
  }

  // GET /api/blueprints/:id - Get single blueprint
  const blueprintMatch = pathname.match(/^\/api\/blueprints\/([^/]+)$/);
  if (blueprintMatch && method === "GET") {
    const id = blueprintMatch[1];
    const blueprint = allBlueprints.find((b) => b.id === id);

    if (blueprint) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: true,
          data: blueprint,
        }),
      });
    } else {
      return route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Blueprint not found",
        }),
      });
    }
  }

  // POST /api/blueprints - Create blueprint
  if (pathname === "/api/blueprints" && method === "POST") {
    const body = await route.request().postDataJSON();
    const newBlueprint = {
      id: `blueprint-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: newBlueprint,
      }),
    });
  }

  // If no match, continue
  await route.continue();
}

async function handleContentRoute(
  route: Route,
  pathname: string,
  method: string,
  url: URL,
) {
  // GET /api/v1/contents - List contents
  if (pathname === "/api/v1/contents" && method === "GET") {
    const search = url.searchParams.get("search")?.toLowerCase();
    const blueprintId = url.searchParams.get("blueprintId");
    const status = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "25");

    let filtered = [...testContentItems];

    if (search) {
      filtered = filtered.filter(
        (c) =>
          JSON.stringify(c.data).toLowerCase().includes(search) ||
          c.slug.toLowerCase().includes(search),
      );
    }

    if (blueprintId) {
      filtered = filtered.filter((c) => c.blueprintId === blueprintId);
    }

    if (status) {
      filtered = filtered.filter((c) => c.status === status);
    }

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: filtered,
        meta: {
          total: filtered.length,
          page,
          limit,
          totalPages: Math.ceil(filtered.length / limit),
        },
      }),
    });
  }

  // POST /api/v1/contents - Create content
  if (pathname === "/api/v1/contents" && method === "POST") {
    const body = await route.request().postDataJSON();
    const newContent: ContentItem = {
      id: `content-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return route.fulfill({
      status: 201,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: newContent,
      }),
    });
  }

  // GET /api/v1/contents/:id - Get single content
  const contentGetMatch = pathname.match(/^\/api\/v1\/contents\/([^/]+)$/);
  if (contentGetMatch && method === "GET") {
    const id = contentGetMatch[1];
    const content = testContentItems.find((c) => c.id === id);

    if (content) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: true,
          data: content,
        }),
      });
    } else {
      return route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Content not found",
        }),
      });
    }
  }

  // PUT /api/v1/contents/:id - Update content
  if (contentGetMatch && method === "PUT") {
    const body = await route.request().postDataJSON();
    const id = contentGetMatch[1];

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: {
          id,
          ...body,
          updatedAt: new Date().toISOString(),
        },
      }),
    });
  }

  // DELETE /api/v1/contents/:id - Delete content
  if (contentGetMatch && method === "DELETE") {
    return route.fulfill({
      status: 204,
    });
  }

  // POST /api/v1/contents/:id/publish - Publish content
  const publishMatch = pathname.match(
    /^\/api\/v1\/contents\/([^/]+)\/publish$/,
  );
  if (publishMatch && method === "POST") {
    const id = publishMatch[1];

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: {
          id,
          status: "published",
          updatedAt: new Date().toISOString(),
        },
      }),
    });
  }

  // POST /api/v1/contents/:id/unpublish - Unpublish content
  const unpublishMatch = pathname.match(
    /^\/api\/v1\/contents\/([^/]+)\/unpublish$/,
  );
  if (unpublishMatch && method === "POST") {
    const id = unpublishMatch[1];

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: {
          id,
          status: "draft",
          updatedAt: new Date().toISOString(),
        },
      }),
    });
  }

  // If no match, continue
  await route.continue();
}

async function handleUsersRoute(
  route: Route,
  pathname: string,
  method: string,
  url: URL,
) {
  const userMatch = pathname.match(/^\/api\/v1\/users(?:\/(.+))?$/);

  // GET /api/v1/users - List all users
  if (pathname === "/api/v1/users" && method === "GET") {
    const search = url.searchParams.get("search")?.toLowerCase();
    const role = url.searchParams.get("role");
    const isActive = url.searchParams.get("isActive");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "25");

    let filtered = [...testUsers];

    if (search) {
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search),
      );
    }

    if (role) {
      filtered = filtered.filter((u) => u.role === role);
    }

    if (isActive !== null && isActive !== undefined) {
      filtered = filtered.filter((u) => u.isActive === (isActive === "true"));
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: {
          data: paginated,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      }),
    });
  }

  // POST /api/v1/users - Create user
  if (pathname === "/api/v1/users" && method === "POST") {
    const body = await route.request().postDataJSON();
    const newUser: TestUser = {
      id: `user-${Date.now()}`,
      email: body.email,
      name: body.name,
      role: body.role || "viewer",
      isActive: body.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return route.fulfill({
      status: 201,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: newUser,
      }),
    });
  }

  // GET /api/users/:id - Get single user
  if (userMatch && method === "GET") {
    const id = userMatch[1];
    const user = testUsers.find((u) => u.id === id);

    if (user) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: true,
          data: user,
        }),
      });
    } else {
      return route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "User not found",
        }),
      });
    }
  }

  // PUT /api/users/:id - Update user
  if (userMatch && method === "PUT") {
    const id = userMatch[1];
    const body = await route.request().postDataJSON();
    const userIndex = testUsers.findIndex((u) => u.id === id);

    if (userIndex >= 0) {
      const updatedUser: TestUser = {
        ...testUsers[userIndex],
        ...body,
        id,
        updatedAt: new Date().toISOString(),
      };

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: true,
          data: updatedUser,
        }),
      });
    } else {
      return route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "User not found",
        }),
      });
    }
  }

  // DELETE /api/users/:id - Delete user
  if (userMatch && method === "DELETE") {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
      }),
    });
  }

  // If no match, continue
  await route.continue();
}

async function handleMediaRoute(
  route: Route,
  pathname: string,
  method: string,
  url: URL,
) {
  const mediaMatch = pathname.match(/^\/api\/media(?:\/(\d+))?$/);

  // GET /api/media - List all media
  if (pathname === "/api/media" && method === "GET") {
    const search = url.searchParams.get("search")?.toLowerCase();
    const type = url.searchParams.get("type");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "24");

    let filtered = [...testMediaFiles];

    if (search) {
      filtered = filtered.filter(
        (m) =>
          m.filename.toLowerCase().includes(search) ||
          m.originalName.toLowerCase().includes(search),
      );
    }

    if (type && type !== "all") {
      filtered = filtered.filter((m) => {
        if (type === "image") return m.mimeType.startsWith("image/");
        if (type === "video") return m.mimeType.startsWith("video/");
        if (type === "audio") return m.mimeType.startsWith("audio/");
        if (type === "document")
          return (
            !m.mimeType.startsWith("image/") &&
            !m.mimeType.startsWith("video/") &&
            !m.mimeType.startsWith("audio/")
          );
        return true;
      });
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: paginated,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      }),
    });
  }

  // POST /api/media - Upload media
  if (pathname === "/api/media" && method === "POST") {
    const newMedia: MediaFile = {
      id: Math.floor(Math.random() * 10000) + 100,
      filename: `uploaded-${Date.now()}.png`,
      originalName: "uploaded-file.png",
      mimeType: "image/png",
      size: 102400,
      url: `/uploads/uploaded-${Date.now()}.png`,
      thumbnailUrl: `/uploads/thumbs/uploaded-${Date.now()}.png`,
      width: 800,
      height: 600,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return route.fulfill({
      status: 201,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: newMedia,
      }),
    });
  }

  // GET /api/media/:id - Get single media
  if (mediaMatch && mediaMatch[1] && method === "GET") {
    const id = parseInt(mediaMatch[1]);
    const media = testMediaFiles.find((m) => m.id === id);

    if (media) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: true,
          data: media,
        }),
      });
    } else {
      return route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "Media not found",
        }),
      });
    }
  }

  // PUT /api/media/:id - Update media metadata
  if (mediaMatch && mediaMatch[1] && method === "PUT") {
    const id = parseInt(mediaMatch[1]);
    const body = await route.request().postDataJSON();
    const media = testMediaFiles.find((m) => m.id === id);

    if (media) {
      const updatedMedia: MediaFile = {
        ...media,
        ...body,
        id,
        updatedAt: new Date().toISOString(),
      };
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: true,
          data: updatedMedia,
        }),
      });
    } else {
      return route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "Media not found",
        }),
      });
    }
  }

  // DELETE /api/media/:id - Delete media
  if (mediaMatch && mediaMatch[1] && method === "DELETE") {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
      }),
    });
  }

  // If no match, continue
  await route.continue();
}

async function handleWebhookRoute(
  route: Route,
  pathname: string,
  method: string,
  url: URL,
) {
  const webhookIdMatch = pathname.match(
    /^\/api\/v1\/webhooks\/(\d+)(?:\/(\w+))?$/,
  );

  // GET /api/v1/webhooks - List all webhooks
  if (pathname === "/api/v1/webhooks" && method === "GET") {
    const search = url.searchParams.get("search")?.toLowerCase();
    const event = url.searchParams.get("event");
    const isActive = url.searchParams.get("isActive");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "25");

    let filtered = [...testWebhooks];

    if (search) {
      filtered = filtered.filter(
        (w: TestWebhook) =>
          w.name.toLowerCase().includes(search) ||
          w.url.toLowerCase().includes(search),
      );
    }

    if (event) {
      filtered = filtered.filter((w: TestWebhook) => w.events.includes(event));
    }

    if (isActive !== null && isActive !== undefined) {
      filtered = filtered.filter(
        (w: TestWebhook) => w.isActive === (isActive === "true"),
      );
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: {
          data: paginated,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      }),
    });
  }

  // POST /api/v1/webhooks - Create webhook
  if (pathname === "/api/v1/webhooks" && method === "POST") {
    const body = await route.request().postDataJSON();
    const newWebhook: TestWebhook = {
      id: Math.floor(Math.random() * 10000) + 100,
      name: body.name,
      url: body.url,
      events: body.events || [],
      secret: body.secret,
      headers: body.headers,
      isActive: body.isActive ?? true,
      createdAt: new Date().toISOString(),
    };

    return route.fulfill({
      status: 201,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: newWebhook,
      }),
    });
  }

  // GET /api/v1/webhooks/:id - Get single webhook
  if (webhookIdMatch && webhookIdMatch[2] === undefined && method === "GET") {
    const id = parseInt(webhookIdMatch[1]);
    const webhook = testWebhooks.find((w: TestWebhook) => w.id === id);

    if (webhook) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: true,
          data: webhook,
        }),
      });
    } else {
      return route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Webhook not found",
        }),
      });
    }
  }

  // PUT /api/v1/webhooks/:id - Update webhook
  if (webhookIdMatch && webhookIdMatch[2] === undefined && method === "PUT") {
    const id = parseInt(webhookIdMatch[1]);
    const body = await route.request().postDataJSON();
    const webhookIndex = testWebhooks.findIndex(
      (w: TestWebhook) => w.id === id,
    );

    if (webhookIndex >= 0) {
      const updatedWebhook: TestWebhook = {
        ...testWebhooks[webhookIndex],
        ...body,
        id,
        updatedAt: new Date().toISOString(),
      };

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: true,
          data: updatedWebhook,
        }),
      });
    } else {
      return route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Webhook not found",
        }),
      });
    }
  }

  // DELETE /api/v1/webhooks/:id - Delete webhook
  if (
    webhookIdMatch &&
    webhookIdMatch[2] === undefined &&
    method === "DELETE"
  ) {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
      }),
    });
  }

  // POST /api/v1/webhooks/:id/test - Test webhook
  if (webhookIdMatch && webhookIdMatch[2] === "test" && method === "POST") {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: {
          success: true,
          statusCode: 200,
          duration: 150,
        },
      }),
    });
  }

  // GET /api/v1/webhooks/:id/deliveries - Get deliveries
  if (
    webhookIdMatch &&
    webhookIdMatch[2] === "deliveries" &&
    method === "GET"
  ) {
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "25");

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: {
          data: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        },
      }),
    });
  }

  // If no match, continue
  await route.continue();
}

/**
 * Mock specific blueprint for testing
 */
export async function mockBlueprint(page: Page, blueprint: Blueprint) {
  await page.route(`/api/blueprints/${blueprint.id}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: blueprint,
      }),
    });
  });
}

/**
 * Mock specific content for testing
 */
export async function mockContent(page: Page, content: ContentItem) {
  await page.route(`/api/v1/contents/${content.id}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: content,
      }),
    });
  });
}

export {
  testBlueprint,
  articleBlueprint,
  allBlueprints,
  testContentItems,
  testUsers,
  testMediaFiles,
  testWebhooks,
};

async function handleApiKeysRoute(
  route: Route,
  pathname: string,
  method: string,
  url: URL,
) {
  // GET /api/v1/api-keys - List API keys
  if (pathname === "/api/v1/api-keys" && method === "GET") {
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "25");

    const total = testApiKeys.length;
    const start = (page - 1) * limit;
    const paginated = testApiKeys.slice(start, start + limit);

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: {
          data: paginated,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      }),
    });
  }

  // POST /api/v1/api-keys - Create API key
  if (pathname === "/api/v1/api-keys" && method === "POST") {
    const body = await route.request().postDataJSON();
    const prefix = "test_" + Math.random().toString(36).substring(2, 8);
    const newKey: TestApiKey = {
      id: `apikey-${Date.now()}`,
      name: body.name,
      key: `${prefix}_full_key_${Math.random().toString(36).substring(2, 15)}`,
      prefix: prefix,
      permissions: body.permissions || ["content:read"],
      rateLimit: body.rateLimit || 100,
      expiresAt: body.expiresInDays
        ? new Date(
            Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000,
          ).toISOString()
        : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return route.fulfill({
      status: 201,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: newKey,
      }),
    });
  }

  // DELETE /api/v1/api-keys/:id - Delete API key
  const apiKeyMatch = pathname.match(/^\/api\/v1\/api-keys\/([^/]+)$/);
  if (apiKeyMatch && method === "DELETE") {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
      }),
    });
  }

  // POST /api/v1/api-keys/:id/rotate - Rotate API key
  const rotateMatch = pathname.match(/^\/api\/v1\/api-keys\/([^/]+)\/rotate$/);
  if (rotateMatch && method === "POST") {
    const id = rotateMatch[1];
    const apiKey = testApiKeys.find((k) => k.id === id);

    if (apiKey) {
      const newPrefix = "rotated_" + Math.random().toString(36).substring(2, 8);
      const rotatedKey = {
        ...apiKey,
        prefix: newPrefix,
        updatedAt: new Date().toISOString(),
      };

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: true,
          data: rotatedKey,
        }),
      });
    } else {
      return route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "API key not found",
        }),
      });
    }
  }

  // If no match, continue
  await route.continue();
}

async function handlePluginsRoute(
  route: Route,
  pathname: string,
  method: string,
  url: URL,
) {
  const pluginMatch = pathname.match(/^\/api\/v1\/plugins(?:\/(.+))?$/);

  if (pathname === "/api/v1/plugins" && method === "GET") {
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "25");

    const total = testPlugins.length;
    const start = (page - 1) * limit;
    const paginated = testPlugins.slice(start, start + limit);

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        data: paginated,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      }),
    });
  }

  if (pluginMatch && pluginMatch[1] && method === "GET") {
    const id = pluginMatch[1];
    const plugin = testPlugins.find((p) => p.id === id);

    if (plugin) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: true,
          data: plugin,
        }),
      });
    } else {
      return route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Plugin not found",
        }),
      });
    }
  }

  await route.continue();
}
