import type { PageServerLoad } from "./$types";
// NOTE: BlueprintSummary type is shared in $lib/types.ts to avoid duplication
// LSP NOTE: Using relative path import for server-side TypeScript compatibility
import type { BlueprintSummary } from "../../lib/types.js";

// Mock data - replace with API call later

const MOCK_BLUEPRINTS: BlueprintSummary[] = [
  {
    id: "1",
    name: "Blog Posts",
    slug: "blog-posts",
    description: "Blog yazıları için içerik tipi",
    fields: [
      { name: "Title", type: "text" },
      { name: "Content", type: "richtext" },
      { name: "Featured Image", type: "media" },
      { name: "Publish Date", type: "datetime" },
    ],
    settings: {
      draftMode: true,
      versioning: true,
      apiAccess: "public",
    },
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-07T14:30:00Z",
    contentCount: 24,
  },
  {
    id: "2",
    name: "Products",
    slug: "products",
    description: "E-ticaret ürünleri",
    fields: [
      { name: "Product Name", type: "text" },
      { name: "Price", type: "number" },
      { name: "Description", type: "textarea" },
      { name: "Gallery", type: "media" },
      { name: "Category", type: "relation" },
    ],
    settings: {
      draftMode: true,
      versioning: false,
      apiAccess: "public",
    },
    createdAt: "2026-02-02T09:00:00Z",
    updatedAt: "2026-02-06T16:20:00Z",
    contentCount: 156,
  },
  {
    id: "3",
    name: "Pages",
    slug: "pages",
    description: "Statik sayfalar (About, Contact, vb.)",
    fields: [
      { name: "Title", type: "text" },
      { name: "Content", type: "richtext" },
      { name: "Slug", type: "slug" },
    ],
    settings: {
      draftMode: false,
      versioning: true,
      apiAccess: "public",
    },
    createdAt: "2026-02-03T08:00:00Z",
    updatedAt: "2026-02-05T11:45:00Z",
    contentCount: 8,
  },
  {
    id: "4",
    name: "Team Members",
    slug: "team-members",
    description: "Ekip üyeleri",
    fields: [
      { name: "Name", type: "text" },
      { name: "Role", type: "text" },
      { name: "Bio", type: "textarea" },
      { name: "Photo", type: "media" },
      { name: "Email", type: "email" },
    ],
    settings: {
      draftMode: false,
      versioning: false,
      apiAccess: "public",
    },
    createdAt: "2026-02-04T07:00:00Z",
    updatedAt: "2026-02-04T07:00:00Z",
    contentCount: 12,
  },
];

export const load: PageServerLoad = async () => {
  // TODO: Replace with actual API call
  // const response = await fetch('http://localhost:3000/api/blueprints', {
  //   headers: { 'Authorization': `Bearer ${token}` }
  // });
  // const blueprints = await response.json();

  return {
    blueprints: MOCK_BLUEPRINTS,
  };
};
