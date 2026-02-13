import type { Blueprint } from "../../src/lib/components/blueprint/types";
import type { ContentItem } from "../../src/lib/components/content/types";

// Test Blueprint with all field types
export const testBlueprint: Blueprint = {
  id: "test-blueprint",
  name: "Test Blueprint",
  slug: "test-blueprint",
  description: "A test blueprint for testing purposes",
  fields: [
    {
      id: "field-1",
      key: "title",
      name: "Title",
      type: "text",
      required: true,
      order: 0,
      options: {
        minLength: 3,
        maxLength: 100,
      },
    },
    {
      id: "field-2",
      key: "description",
      name: "Description",
      type: "textarea",
      required: false,
      order: 1,
      options: {
        rows: 4,
      },
    },
    {
      id: "field-3",
      key: "count",
      name: "Count",
      type: "number",
      required: false,
      order: 2,
      options: {
        min: 0,
        max: 100,
      },
    },
    {
      id: "field-4",
      key: "isActive",
      name: "Is Active",
      type: "boolean",
      required: false,
      order: 3,
    },
    {
      id: "field-5",
      key: "category",
      name: "Category",
      type: "select",
      required: false,
      order: 4,
      options: {
        options: [
          { label: "Option 1", value: "option1" },
          { label: "Option 2", value: "option2" },
          { label: "Option 3", value: "option3" },
        ],
      },
    },
    {
      id: "field-6",
      key: "tags",
      name: "Tags",
      type: "multiselect",
      required: false,
      order: 5,
      options: {
        options: [
          { label: "Tag 1", value: "tag1" },
          { label: "Tag 2", value: "tag2" },
          { label: "Tag 3", value: "tag3" },
        ],
      },
    },
    {
      id: "field-7",
      key: "publishDate",
      name: "Publish Date",
      type: "date",
      required: false,
      order: 6,
    },
  ],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

// Second test blueprint
export const articleBlueprint: Blueprint = {
  id: "article-blueprint",
  name: "Article",
  slug: "article",
  description: "Article content type",
  fields: [
    {
      id: "field-article-1",
      key: "title",
      name: "Title",
      type: "text",
      required: true,
      order: 0,
    },
    {
      id: "field-article-2",
      key: "body",
      name: "Body",
      type: "textarea",
      required: true,
      order: 1,
    },
  ],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

// Test content items
export const testContentItems: ContentItem[] = [
  {
    id: "content-1",
    blueprintId: "test-blueprint",
    slug: "test-content-1",
    data: {
      title: "Test Content 1",
      description: "This is a test content item",
      count: 42,
      isActive: true,
      category: "option1",
      tags: ["tag1", "tag2"],
      publishDate: "2024-02-13",
    },
    status: "published",
    createdBy: "user-1",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-02-10T14:30:00Z",
  },
  {
    id: "content-2",
    blueprintId: "article-blueprint",
    slug: "draft-article",
    data: {
      title: "Draft Article",
      body: "This is a draft article that needs work",
    },
    status: "draft",
    createdBy: "user-1",
    createdAt: "2024-02-12T09:00:00Z",
    updatedAt: "2024-02-12T09:00:00Z",
  },
  {
    id: "content-3",
    blueprintId: "test-blueprint",
    slug: "archived-content",
    data: {
      title: "Archived Content",
      description: "This content is archived",
      count: 0,
      isActive: false,
    },
    status: "archived",
    createdBy: "user-2",
    createdAt: "2023-12-01T08:00:00Z",
    updatedAt: "2024-01-20T16:45:00Z",
  },
];

// All blueprints for listing
export const allBlueprints: Blueprint[] = [testBlueprint, articleBlueprint];

// Test user
export const testUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
};
