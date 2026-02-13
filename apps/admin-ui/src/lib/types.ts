// Shared types across the application
// NOTE: Keep in sync with API schema
// LSP NOTE: BlueprintSummary is for listing pages, Blueprint (from lib/components/blueprint/types.ts) is for builder

export interface BlueprintField {
  name: string;
  type: string;
}

export interface BlueprintSettings {
  draftMode: boolean;
  versioning: boolean;
  apiAccess: "public" | "authenticated" | "private";
}

// NOTE: Renamed from Blueprint to BlueprintSummary to avoid conflict with lib/components/blueprint/types.ts
// This type is used for blueprint listing (API response with metadata)
export interface BlueprintSummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
  fields: BlueprintField[];
  settings: BlueprintSettings;
  createdAt: string;
  updatedAt: string;
  contentCount?: number;
}

export interface PageData {
  blueprints: BlueprintSummary[];
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor" | "viewer";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
