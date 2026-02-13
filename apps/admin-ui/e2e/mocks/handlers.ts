import type { Page, Route } from "@playwright/test";
import {
  testBlueprint,
  articleBlueprint,
  allBlueprints,
  testContentItems,
} from "./fixtures";
import type { Blueprint } from "../../src/lib/components/blueprint/types";
import type { ContentItem } from "../../src/lib/components/content/types";

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
  const blueprintMatch = pathname.match(/^\/api\/blueprints\/([^\/]+)$/);
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
  const contentGetMatch = pathname.match(/^\/api\/v1\/contents\/([^\/]+)$/);
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
    /^\/api\/v1\/contents\/([^\/]+)\/publish$/,
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
    /^\/api\/v1\/contents\/([^\/]+)\/unpublish$/,
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

export { testBlueprint, articleBlueprint, allBlueprints, testContentItems };
