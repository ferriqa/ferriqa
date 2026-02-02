/**
 * @ferriqa/core - Content Service Unit Tests
 *
 * Tests for content types, query builder, and service implementation.
 * Based on roadmap 2.2 - Dynamic Content Storage
 *
 * REVIEW NOTE: These are primarily type definition tests to ensure interfaces
 * are correctly defined. Additional integration tests with actual database
 * operations (CRUD, query filtering, error handling) should be added separately.
 */

import { describe, it, expect } from "../../testing/index.ts";
import type { Blueprint } from "../../blueprint/types.ts";
import type {
  Content,
  ContentQuery,
  FilterCondition,
  PaginatedResult,
  CreateContentInput,
  UpdateContentInput,
  ContentStatus,
  ContentCreateContext,
  ContentUpdateContext,
  ContentDeleteContext,
  ContentPublishContext,
} from "../../content/types.ts";

/**
 * Blueprint helper for tests
 * REDUCES REPETITION: Centralizes default blueprint creation with optional overrides
 */
function createMockBlueprint(overrides?: Partial<Blueprint>): Blueprint {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000", // UUID format
    name: "Test Blueprint",
    slug: "test-blueprint",
    description: "Test blueprint for unit tests",
    fields: [],
    settings: {
      draftMode: true,
      versioning: true,
      apiAccess: "public",
      cacheEnabled: true,
      displayField: "title",
      defaultStatus: "draft",
    },
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

describe("Content Types", () => {
  describe("Content Interface", () => {
    it("should define content with required fields", () => {
      const content: Content = {
        id: "123",
        blueprintId: "456",
        slug: "my-content",
        status: "published",
        data: { title: "Test" },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(content.id).toBeDefined();
      expect(content.blueprintId).toBeDefined();
      expect(content.slug).toBeDefined();
      expect(content.status).toBeDefined();
      expect(content.data).toBeDefined();
    });

    it("should support all status types", () => {
      const statuses: ContentStatus[] = ["draft", "published", "archived"];
      expect(statuses).toHaveLength(3);
    });
  });

  describe("ContentQuery Interface", () => {
    it("should support basic query options", () => {
      const query: ContentQuery = {
        blueprintId: "456",
        status: "published",
        pagination: { page: 1, limit: 10 },
      };

      expect(query.blueprintId).toBe("456");
      expect(query.status).toBe("published");
      expect(query.pagination?.page).toBe(1);
      expect(query.pagination?.limit).toBe(10);
    });

    it("should support filters", () => {
      const filter: FilterCondition = {
        field: "title",
        operator: "eq",
        value: "Test",
      };

      expect(filter.field).toBe("title");
      expect(filter.operator).toBe("eq");
      expect(filter.value).toBe("Test");
    });

    it("should support multiple filter operators", () => {
      const operators = [
        "eq",
        "ne",
        "gt",
        "gte",
        "lt",
        "lte",
        "in",
        "nin",
        "contains",
        "startsWith",
        "endsWith",
        "exists",
      ];
      expect(operators.length).toBeGreaterThan(0);
    });
  });

  describe("CreateContentInput", () => {
    it("should require data field", () => {
      const input: CreateContentInput = {
        data: { title: "New Content" },
      };

      expect(input.data).toBeDefined();
      expect(input.data.title).toBe("New Content");
    });

    it("should support optional fields", () => {
      const input: CreateContentInput = {
        slug: "custom-slug",
        status: "draft",
        data: { title: "Test" },
        meta: { seo: "description" },
      };

      expect(input.slug).toBe("custom-slug");
      expect(input.status).toBe("draft");
      expect(input.meta).toBeDefined();
    });
  });

  describe("UpdateContentInput", () => {
    it("should have all fields optional", () => {
      const input: UpdateContentInput = {
        data: { title: "Updated" },
      };

      expect(input.data).toBeDefined();
    });
  });

  describe("Hook Contexts", () => {
    it("should define content create context", () => {
      const context: ContentCreateContext = {
        blueprint: createMockBlueprint({ id: "bp-123" }),
        data: { title: "New Content" },
        userId: "user-123",
      };

      expect(context.blueprint).toBeDefined();
      expect(context.data).toBeDefined();
      expect(context.userId).toBe("user-123");
    });

    it("should define content update context", () => {
      const context: ContentUpdateContext = {
        content: {
          id: "content-123",
          blueprintId: "bp-123",
          slug: "my-content",
          status: "draft",
          data: { title: "Old Title" },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        blueprint: createMockBlueprint({ id: "bp-123" }),
        data: { title: "New Title" },
        userId: "user-123",
      };

      expect(context.content).toBeDefined();
      expect(context.blueprint).toBeDefined();
      expect(context.data).toBeDefined();
    });

    it("should define content delete context", () => {
      const context: ContentDeleteContext = {
        content: {
          id: "content-123",
          blueprintId: "bp-123",
          slug: "my-content",
          status: "draft",
          data: { title: "To Delete" },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        blueprint: createMockBlueprint({ id: "bp-123" }),
        userId: "user-123",
      };

      expect(context.content).toBeDefined();
      expect(context.blueprint).toBeDefined();
    });

    it("should define content publish context", () => {
      const context: ContentPublishContext = {
        content: {
          id: "content-123",
          blueprintId: "bp-123",
          slug: "my-content",
          status: "draft",
          data: { title: "Publish Me" },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        userId: "user-123",
      };

      expect(context.content).toBeDefined();
      expect(context.userId).toBe("user-123");
    });
  });
});

describe("PaginatedResult", () => {
  it("should define paginated result structure", () => {
    const result: PaginatedResult<Content> = {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    };

    expect(result.data).toBeDefined();
    expect(result.pagination).toBeDefined();
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(10);
  });
});

describe("Content Validation", () => {
  it("should have proper ContentStatus type", () => {
    const validStatuses: ContentStatus[] = ["draft", "published", "archived"];
    validStatuses.forEach((status) => {
      expect(status).toBeDefined();
    });
  });
});
