import type { Blueprint } from "../../src/lib/components/blueprint/types";
import type { ContentItem } from "../../src/lib/components/content/types";
import type { MediaFile } from "../../src/lib/components/media/types";

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
    },
    {
      id: "field-5",
      key: "category",
      name: "Category",
      type: "select",
      required: false,
      options: {
        choices: ["option1", "option2", "option3"],
      },
    },
    {
      id: "field-6",
      key: "tags",
      name: "Tags",
      type: "multiselect",
      required: false,
      options: {
        choices: ["tag1", "tag2", "tag3"],
      },
    },
    {
      id: "field-7",
      key: "publishDate",
      name: "Publish Date",
      type: "date",
      required: false,
    },
  ],
  settings: {
    draftMode: true,
    versioning: true,
    defaultStatus: "draft",
  },
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
    },
    {
      id: "field-article-2",
      key: "body",
      name: "Body",
      type: "textarea",
      required: true,
    },
  ],
  settings: {
    draftMode: true,
    versioning: true,
    defaultStatus: "draft",
  },
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

// User types
export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor" | "viewer";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mock users for testing
export const testUsers: TestUser[] = [
  {
    id: "user-admin",
    email: "admin@ferriqa.dev",
    name: "Admin User",
    role: "admin",
    isActive: true,
    createdAt: "2026-01-16T10:00:00Z",
    updatedAt: "2026-01-16T10:00:00Z",
  },
  {
    id: "user-editor",
    email: "editor@ferriqa.dev",
    name: "Editor User",
    role: "editor",
    isActive: true,
    createdAt: "2026-01-26T10:00:00Z",
    updatedAt: "2026-01-26T10:00:00Z",
  },
  {
    id: "user-viewer",
    email: "viewer@ferriqa.dev",
    name: "Viewer User",
    role: "viewer",
    isActive: true,
    createdAt: "2026-02-05T10:00:00Z",
    updatedAt: "2026-02-05T10:00:00Z",
  },
];

export const testMediaFiles: MediaFile[] = [
  {
    id: 1,
    filename: "hero-image.png",
    originalName: "hero-image.png",
    mimeType: "image/png",
    size: 245760,
    url: "/uploads/hero-image.png",
    thumbnailUrl: "/uploads/thumbs/hero-image.png",
    width: 1920,
    height: 1080,
    alt: "Hero image",
    caption: "Main hero banner",
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-01-15T10:00:00Z",
  },
  {
    id: 2,
    filename: "product-photo.jpg",
    originalName: "product-photo.jpg",
    mimeType: "image/jpeg",
    size: 153600,
    url: "/uploads/product-photo.jpg",
    thumbnailUrl: "/uploads/thumbs/product-photo.jpg",
    width: 800,
    height: 600,
    alt: "Product photo",
    createdAt: "2026-01-20T14:30:00Z",
    updatedAt: "2026-01-20T14:30:00Z",
  },
  {
    id: 3,
    filename: "intro-video.mp4",
    originalName: "intro-video.mp4",
    mimeType: "video/mp4",
    size: 15728640,
    url: "/uploads/intro-video.mp4",
    thumbnailUrl: "/uploads/thumbs/intro-video.jpg",
    width: 1920,
    height: 1080,
    createdAt: "2026-01-25T09:00:00Z",
    updatedAt: "2026-01-25T09:00:00Z",
  },
  {
    id: 4,
    filename: "document.pdf",
    originalName: "document.pdf",
    mimeType: "application/pdf",
    size: 524288,
    url: "/uploads/document.pdf",
    createdAt: "2026-02-01T11:00:00Z",
    updatedAt: "2026-02-01T11:00:00Z",
  },
  {
    id: 5,
    filename: "background-music.mp3",
    originalName: "background-music.mp3",
    mimeType: "audio/mpeg",
    size: 4194304,
    url: "/uploads/background-music.mp3",
    createdAt: "2026-02-05T16:00:00Z",
    updatedAt: "2026-02-05T16:00:00Z",
  },
];

export interface TestWebhook {
  id: number;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  headers?: Record<string, string>;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TestApiKey {
  id: string;
  name: string;
  key?: string;
  prefix: string;
  permissions: string[];
  rateLimit: number;
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const testApiKeys: TestApiKey[] = [
  {
    id: "apikey-1",
    name: "Production Key",
    prefix: "prod_abc123",
    permissions: ["content:read", "content:write"],
    rateLimit: 1000,
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
  },
  {
    id: "apikey-2",
    name: "Development Key",
    prefix: "dev_xyz789",
    permissions: ["content:read", "content:write", "content:delete"],
    rateLimit: 500,
    createdAt: "2026-02-10T14:00:00Z",
    updatedAt: "2026-02-10T14:00:00Z",
  },
];

export const testWebhooks: TestWebhook[] = [
  {
    id: 1,
    name: "Content Webhook",
    url: "https://example.com/webhooks/content",
    events: ["content.created", "content.updated"],
    isActive: true,
    createdAt: "2026-02-15T10:00:00Z",
  },
  {
    id: 2,
    name: "Media Webhook",
    url: "https://api.example.com/hooks/media",
    events: ["media.uploaded", "media.deleted"],
    secret: "secret-123",
    isActive: false,
    createdAt: "2026-02-10T08:00:00Z",
  },
];

export interface TestPlugin {
  id: string;
  name: string;
  description?: string;
  version: string;
  author?: string;
  isEnabled: boolean;
  config: Record<string, unknown>;
}

export const testPlugins: TestPlugin[] = [
  {
    id: "plugin-1",
    name: "SEO Optimizer",
    description: "Automatically optimizes content for search engines",
    version: "2.1.0",
    author: "Ferriqa Team",
    isEnabled: true,
    config: {
      metaTags: true,
      sitemap: true,
      robots: true,
    },
  },
  {
    id: "plugin-2",
    name: "Analytics",
    description: "Track user engagement and content performance",
    version: "1.5.3",
    author: "Ferriqa Team",
    isEnabled: true,
    config: {
      trackingId: "UA-123456789",
      anonymizeIp: true,
    },
  },
  {
    id: "plugin-3",
    name: "Image Optimizer",
    description: "Compress and optimize images automatically on upload",
    version: "3.0.1",
    author: "Third Party",
    isEnabled: false,
    config: {
      quality: 85,
      format: "webp",
    },
  },
];
