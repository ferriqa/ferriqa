import type { Blueprint } from "./types.ts";

export interface BlueprintTemplate {
  id: string;
  name: string;
  description: string;
  category: "content" | "ecommerce" | "media" | "system";
  icon: string;
  blueprint: Omit<Blueprint, "id">;
}

// Blog Template
export const blogTemplate: BlueprintTemplate = {
  id: "blog",
  name: "Blog Post",
  description: "Standard blog post with title, content, author, and tags",
  category: "content",
  icon: "FileText",
  blueprint: {
    name: "Blog Post",
    slug: "blog-post",
    description: "Blog post content type",
    fields: [
      {
        id: "title",
        name: "Title",
        key: "title",
        type: "text",
        required: true,
        description: "Post title",
        ui: {
          width: "full",
          placeholder: "Enter post title",
        },
        validation: {
          minLength: 5,
          maxLength: 200,
        },
      },
      {
        id: "slug",
        name: "Slug",
        key: "slug",
        type: "slug",
        required: true,
        description: "URL-friendly identifier",
        options: {
          sourceField: "title",
        },
        ui: {
          width: "half",
        },
      },
      {
        id: "excerpt",
        name: "Excerpt",
        key: "excerpt",
        type: "textarea",
        required: false,
        description: "Short summary of the post",
        ui: {
          width: "full",
          placeholder: "Brief description...",
        },
        validation: {
          maxLength: 500,
        },
      },
      {
        id: "content",
        name: "Content",
        key: "content",
        type: "richtext",
        required: true,
        description: "Main post content",
        ui: {
          width: "full",
          placeholder: "Write your content here...",
        },
      },
      {
        id: "featured_image",
        name: "Featured Image",
        key: "featured_image",
        type: "media",
        required: false,
        description: "Main post image",
        options: {
          media: {
            multiple: false,
            accept: ["image/*"],
          },
        },
        ui: {
          width: "half",
        },
      },
      {
        id: "author",
        name: "Author",
        key: "author",
        type: "relation",
        required: true,
        description: "Post author",
        options: {
          relation: {
            blueprintId: "",
            type: "many-to-many",
          },
        },
        ui: {
          width: "half",
        },
      },
      {
        id: "category",
        name: "Category",
        key: "category",
        type: "select",
        required: true,
        description: "Post category",
        options: {
          choices: ["Technology", "Lifestyle", "Travel", "Food", "Business"],
        },
        ui: {
          width: "half",
        },
      },
      {
        id: "tags",
        name: "Tags",
        key: "tags",
        type: "multiselect",
        required: false,
        description: "Post tags",
        options: {
          choices: [],
        },
        ui: {
          width: "half",
        },
      },
      {
        id: "published_at",
        name: "Published At",
        key: "published_at",
        type: "datetime",
        required: false,
        description: "Publication date and time",
        ui: {
          width: "half",
        },
      },
      {
        id: "is_featured",
        name: "Featured Post",
        key: "is_featured",
        type: "boolean",
        required: false,
        description: "Mark as featured",
        ui: {
          width: "half",
        },
      },
    ],
    settings: {
      draftMode: true,
      versioning: true,
      defaultStatus: "draft",
    },
  },
};

// Product Template
export const productTemplate: BlueprintTemplate = {
  id: "product",
  name: "Product",
  description: "E-commerce product with variants, pricing, and inventory",
  category: "ecommerce",
  icon: "Package",
  blueprint: {
    name: "Product",
    slug: "product",
    description: "E-commerce product",
    fields: [
      {
        id: "name",
        name: "Product Name",
        key: "name",
        type: "text",
        required: true,
        ui: {
          width: "full",
        },
        validation: {
          maxLength: 200,
        },
      },
      {
        id: "sku",
        name: "SKU",
        key: "sku",
        type: "text",
        required: true,
        unique: true,
        ui: {
          width: "half",
        },
      },
      {
        id: "description",
        name: "Description",
        key: "description",
        type: "richtext",
        required: true,
        ui: {
          width: "full",
        },
      },
      {
        id: "short_description",
        name: "Short Description",
        key: "short_description",
        type: "textarea",
        required: false,
        ui: {
          width: "full",
        },
        validation: {
          maxLength: 300,
        },
      },
      {
        id: "price",
        name: "Price",
        key: "price",
        type: "number",
        required: true,
        ui: {
          width: "half",
        },
        validation: {
          min: 0,
        },
      },
      {
        id: "sale_price",
        name: "Sale Price",
        key: "sale_price",
        type: "number",
        required: false,
        ui: {
          width: "half",
        },
        validation: {
          min: 0,
        },
      },
      {
        id: "images",
        name: "Product Images",
        key: "images",
        type: "media",
        required: false,
        options: {
          media: {
            multiple: true,
            accept: ["image/*"],
          },
        },
        ui: {
          width: "full",
        },
        validation: {
          maxItems: 10,
        },
      },
      {
        id: "category",
        name: "Category",
        key: "category",
        type: "relation",
        required: true,
        options: {
          relation: {
            blueprintId: "",
            type: "one-to-many",
          },
        },
        ui: {
          width: "half",
        },
      },
      {
        id: "stock_quantity",
        name: "Stock Quantity",
        key: "stock_quantity",
        type: "number",
        required: true,
        ui: {
          width: "half",
        },
        validation: {
          min: 0,
        },
      },
      {
        id: "weight",
        name: "Weight (kg)",
        key: "weight",
        type: "number",
        required: false,
        ui: {
          width: "half",
        },
        validation: {
          min: 0,
        },
      },
      {
        id: "is_active",
        name: "Active",
        key: "is_active",
        type: "boolean",
        required: false,
        ui: {
          width: "half",
        },
      },
    ],
    settings: {
      draftMode: true,
      versioning: true,
      defaultStatus: "draft",
    },
  },
};

// Page Template
export const pageTemplate: BlueprintTemplate = {
  id: "page",
  name: "Page",
  description: "Static page like About, Contact, or custom landing pages",
  category: "content",
  icon: "Layout",
  blueprint: {
    name: "Page",
    slug: "page",
    description: "Static page content",
    fields: [
      {
        id: "title",
        name: "Page Title",
        key: "title",
        type: "text",
        required: true,
        ui: {
          width: "full",
        },
      },
      {
        id: "slug",
        name: "URL Slug",
        key: "slug",
        type: "slug",
        required: true,
        options: {
          sourceField: "title",
        },
        ui: {
          width: "half",
        },
      },
      {
        id: "meta_title",
        name: "Meta Title",
        key: "meta_title",
        type: "text",
        required: false,
        ui: {
          width: "full",
        },
        validation: {
          maxLength: 60,
        },
      },
      {
        id: "meta_description",
        name: "Meta Description",
        key: "meta_description",
        type: "textarea",
        required: false,
        ui: {
          width: "full",
        },
        validation: {
          maxLength: 160,
        },
      },
      {
        id: "content",
        name: "Page Content",
        key: "content",
        type: "richtext",
        required: true,
        ui: {
          width: "full",
        },
      },
      {
        id: "featured_image",
        name: "Featured Image",
        key: "featured_image",
        type: "media",
        required: false,
        options: {
          media: {
            multiple: false,
            accept: ["image/*"],
          },
        },
        ui: {
          width: "half",
        },
      },
      {
        id: "template",
        name: "Page Template",
        key: "template",
        type: "select",
        required: false,
        options: {
          choices: ["Default", "Full Width", "Landing Page", "Sidebar"],
        },
        ui: {
          width: "half",
        },
      },
      {
        id: "is_published",
        name: "Published",
        key: "is_published",
        type: "boolean",
        required: false,
        ui: {
          width: "half",
        },
      },
    ],
    settings: {
      draftMode: true,
      versioning: true,
      defaultStatus: "draft",
    },
  },
};

// User Profile Template
export const userProfileTemplate: BlueprintTemplate = {
  id: "user-profile",
  name: "User Profile",
  description: "Extended user profile with bio, avatar, and social links",
  category: "system",
  icon: "User",
  blueprint: {
    name: "User Profile",
    slug: "user-profile",
    description: "Extended user profile",
    fields: [
      {
        id: "user",
        name: "User",
        key: "user",
        type: "relation",
        required: true,
        description: "Linked user account",
        options: {
          relation: {
            blueprintId: "",
            type: "one-to-one",
          },
        },
        ui: {
          width: "half",
        },
      },
      {
        id: "avatar",
        name: "Avatar",
        key: "avatar",
        type: "media",
        required: false,
        options: {
          media: {
            multiple: false,
            accept: ["image/*"],
          },
        },
        ui: {
          width: "half",
        },
      },
      {
        id: "bio",
        name: "Bio",
        key: "bio",
        type: "textarea",
        required: false,
        ui: {
          width: "full",
        },
        validation: {
          maxLength: 500,
        },
      },
      {
        id: "website",
        name: "Website",
        key: "website",
        type: "url",
        required: false,
        ui: {
          width: "half",
        },
      },
      {
        id: "twitter",
        name: "Twitter",
        key: "twitter",
        type: "text",
        required: false,
        ui: {
          width: "half",
        },
      },
      {
        id: "github",
        name: "GitHub",
        key: "github",
        type: "text",
        required: false,
        ui: {
          width: "half",
        },
      },
      {
        id: "linkedin",
        name: "LinkedIn",
        key: "linkedin",
        type: "url",
        required: false,
        ui: {
          width: "half",
        },
      },
      {
        id: "location",
        name: "Location",
        key: "location",
        type: "text",
        required: false,
        ui: {
          width: "half",
        },
      },
      {
        id: "company",
        name: "Company",
        key: "company",
        type: "text",
        required: false,
        ui: {
          width: "half",
        },
      },
      {
        id: "job_title",
        name: "Job Title",
        key: "job_title",
        type: "text",
        required: false,
        ui: {
          width: "half",
        },
      },
    ],
    settings: {
      draftMode: false,
      versioning: false,
      defaultStatus: "published",
    },
  },
};

// Gallery Template
export const galleryTemplate: BlueprintTemplate = {
  id: "gallery",
  name: "Gallery",
  description: "Image gallery with titles and descriptions",
  category: "media",
  icon: "Image",
  blueprint: {
    name: "Gallery",
    slug: "gallery",
    description: "Image gallery",
    fields: [
      {
        id: "title",
        name: "Gallery Title",
        key: "title",
        type: "text",
        required: true,
        ui: {
          width: "full",
        },
      },
      {
        id: "slug",
        name: "Slug",
        key: "slug",
        type: "slug",
        required: true,
        options: {
          sourceField: "title",
        },
        ui: {
          width: "half",
        },
      },
      {
        id: "description",
        name: "Description",
        key: "description",
        type: "textarea",
        required: false,
        ui: {
          width: "full",
        },
      },
      {
        id: "images",
        name: "Gallery Images",
        key: "images",
        type: "media",
        required: true,
        options: {
          media: {
            multiple: true,
            accept: ["image/*"],
          },
        },
        ui: {
          width: "full",
        },
      },
      {
        id: "layout",
        name: "Layout",
        key: "layout",
        type: "select",
        required: false,
        options: {
          choices: ["Grid", "Masonry", "Carousel", "Slider"],
        },
        ui: {
          width: "half",
        },
      },
      {
        id: "is_public",
        name: "Public",
        key: "is_public",
        type: "boolean",
        required: false,
        ui: {
          width: "half",
        },
      },
    ],
    settings: {
      draftMode: true,
      versioning: true,
      defaultStatus: "draft",
    },
  },
};

// Event Template
export const eventTemplate: BlueprintTemplate = {
  id: "event",
  name: "Event",
  description: "Event with date, location, and registration",
  category: "content",
  icon: "Calendar",
  blueprint: {
    name: "Event",
    slug: "event",
    description: "Event information",
    fields: [
      {
        id: "title",
        name: "Event Title",
        key: "title",
        type: "text",
        required: true,
        ui: {
          width: "full",
        },
      },
      {
        id: "slug",
        name: "Slug",
        key: "slug",
        type: "slug",
        required: true,
        options: {
          sourceField: "title",
        },
        ui: {
          width: "half",
        },
      },
      {
        id: "description",
        name: "Description",
        key: "description",
        type: "richtext",
        required: true,
        ui: {
          width: "full",
        },
      },
      {
        id: "start_date",
        name: "Start Date & Time",
        key: "start_date",
        type: "datetime",
        required: true,
        ui: {
          width: "half",
        },
      },
      {
        id: "end_date",
        name: "End Date & Time",
        key: "end_date",
        type: "datetime",
        required: false,
        ui: {
          width: "half",
        },
      },
      {
        id: "location",
        name: "Location",
        key: "location",
        type: "text",
        required: true,
        ui: {
          width: "full",
        },
      },
      {
        id: "virtual_event_url",
        name: "Virtual Event URL",
        key: "virtual_event_url",
        type: "url",
        required: false,
        ui: {
          width: "full",
        },
      },
      {
        id: "max_attendees",
        name: "Max Attendees",
        key: "max_attendees",
        type: "number",
        required: false,
        ui: {
          width: "half",
        },
        validation: {
          min: 1,
        },
      },
      {
        id: "image",
        name: "Event Image",
        key: "image",
        type: "media",
        required: false,
        options: {
          media: {
            multiple: false,
            accept: ["image/*"],
          },
        },
        ui: {
          width: "half",
        },
      },
      {
        id: "is_registration_open",
        name: "Registration Open",
        key: "is_registration_open",
        type: "boolean",
        required: false,
        ui: {
          width: "half",
        },
      },
    ],
    settings: {
      draftMode: true,
      versioning: true,
      defaultStatus: "draft",
    },
  },
};

// Export all templates
export const BLUEPRINT_TEMPLATES: BlueprintTemplate[] = [
  blogTemplate,
  productTemplate,
  pageTemplate,
  userProfileTemplate,
  galleryTemplate,
  eventTemplate,
];

// Get template by ID
export function getTemplate(id: string): BlueprintTemplate | undefined {
  return BLUEPRINT_TEMPLATES.find((t) => t.id === id);
}

// Get templates by category
export function getTemplatesByCategory(
  category: BlueprintTemplate["category"],
): BlueprintTemplate[] {
  return BLUEPRINT_TEMPLATES.filter((t) => t.category === category);
}

// Create blueprint from template
export function createBlueprintFromTemplate(
  templateId: string,
  customName?: string,
): Omit<Blueprint, "id"> | null {
  const template = getTemplate(templateId);
  if (!template) return null;

  const blueprint = JSON.parse(JSON.stringify(template.blueprint));

  if (customName) {
    blueprint.name = customName;
    blueprint.slug = customName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");
  }

  // Generate new IDs for fields
  blueprint.fields = blueprint.fields.map((field: { id: string }) => ({
    ...field,
    id: crypto.randomUUID(),
  }));

  return blueprint;
}
