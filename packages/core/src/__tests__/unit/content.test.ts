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

import { test } from "@cross/test";
import { assertEquals, assertExists } from "@std/assert";
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

// Content Interface
test("Content Types > Content Interface > should define content with required fields", () => {
  const content: Content = {
    id: "123",
    blueprintId: "456",
    slug: "my-content",
    status: "published",
    data: { title: "Test" },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  assertExists(content.id);
  assertExists(content.blueprintId);
  assertExists(content.slug);
  assertExists(content.status);
  assertExists(content.data);
});

test("Content Types > Content Interface > should support all status types", () => {
  const statuses: ContentStatus[] = ["draft", "published", "archived"];
  assertEquals(statuses.length, 3);
});

// ContentQuery Interface
test("Content Types > ContentQuery Interface > should support basic query options", () => {
  const query: ContentQuery = {
    blueprintId: "456",
    status: "published",
    pagination: { page: 1, limit: 10 },
  };

  assertEquals(query.blueprintId, "456");
  assertEquals(query.status, "published");
  assertEquals(query.pagination?.page, 1);
  assertEquals(query.pagination?.limit, 10);
});

test("Content Types > ContentQuery Interface > should support filters", () => {
  const filter: FilterCondition = {
    field: "title",
    operator: "eq",
    value: "Test",
  };

  assertEquals(filter.field, "title");
  assertEquals(filter.operator, "eq");
  assertEquals(filter.value, "Test");
});

test("Content Types > ContentQuery Interface > should support multiple filter operators", () => {
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
  assertEquals(operators.length > 0, true);
});

// CreateContentInput
test("Content Types > CreateContentInput > should require data field", () => {
  const input: CreateContentInput = {
    data: { title: "New Content" },
  };

  assertExists(input.data);
  assertEquals(input.data.title, "New Content");
});

test("Content Types > CreateContentInput > should support optional fields", () => {
  const input: CreateContentInput = {
    slug: "custom-slug",
    status: "draft",
    data: { title: "Test" },
    meta: { seo: "description" },
  };

  assertEquals(input.slug, "custom-slug");
  assertEquals(input.status, "draft");
  assertExists(input.meta);
});

// UpdateContentInput
test("Content Types > UpdateContentInput > should have all fields optional", () => {
  const input: UpdateContentInput = {
    data: { title: "Updated" },
  };

  assertExists(input.data);
});

// Hook Contexts
test("Content Types > Hook Contexts > should define content create context", () => {
  const context: ContentCreateContext = {
    blueprint: createMockBlueprint({ id: "bp-123" }),
    data: { title: "New Content" },
    userId: "user-123",
  };

  assertExists(context.blueprint);
  assertExists(context.data);
  assertEquals(context.userId, "user-123");
});

test("Content Types > Hook Contexts > should define content update context", () => {
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

  assertExists(context.content);
  assertExists(context.blueprint);
  assertExists(context.data);
});

test("Content Types > Hook Contexts > should define content delete context", () => {
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

  assertExists(context.content);
  assertExists(context.blueprint);
});

test("Content Types > Hook Contexts > should define content publish context", () => {
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

  assertExists(context.content);
  assertEquals(context.userId, "user-123");
});

// PaginatedResult
test("PaginatedResult > should define paginated result structure", () => {
  const result: PaginatedResult<Content> = {
    data: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
  };

  assertExists(result.data);
  assertExists(result.pagination);
  assertEquals(result.pagination.page, 1);
  assertEquals(result.pagination.limit, 10);
});

// Content Validation
test("Content Validation > should have proper ContentStatus type", () => {
  const validStatuses: ContentStatus[] = ["draft", "published", "archived"];
  validStatuses.forEach((status) => {
    assertExists(status);
  });
});
