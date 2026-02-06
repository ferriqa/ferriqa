# @ferriqa/sdk

Ferriqa SDK - Type-safe API client for Ferriqa Headless CMS

## 🚀 Getting Started

```bash
npm install @ferriqa/sdk
```

## 📚 Usage

### Initialize Client

```typescript
import { FerriqaClient } from "@ferriqa/sdk";

const client = new FerriqaClient({
  baseUrl: "http://localhost:3000",
  apiKey: "your-api-key", // or
  accessToken: "your-jwt-token",
});
```

### Authentication

```typescript
// Login
const tokens = await client.auth.login({
  email: "admin@example.com",
  password: "password",
});

// Check auth status
if (client.isAuthenticated()) {
  const user = await client.auth.me();
}

// Restore session
client.restoreSession(savedTokens);
```

### Content Operations

```typescript
// List content
const posts = await client.contents("posts").list({
  page: 1,
  limit: 10,
  sort: "createdAt",
  order: "desc",
});

// Get single item
const post = await client.contents("posts").get("hello-world");

// Create content
const newPost = await client.contents("posts").create({
  slug: "my-post",
  data: {
    title: "My Post",
    content: "Hello World!",
  },
  status: "draft",
});

// Update content
const updated = await client.contents("posts").update("my-post", {
  data: {
    title: "Updated Title",
  },
});

// Delete content
await client.contents("posts").delete("my-post");

// Publish/Unpublish
await client.contents("posts").publish("my-post");
await client.contents("posts").unpublish("my-post");
```

### Blueprint Management

```typescript
// List blueprints
const blueprints = await client.blueprints.list();

// Get blueprint
const blueprint = await client.blueprints.get("posts");

// Create blueprint
const newBlueprint = await client.blueprints.create({
  name: "Products",
  slug: "products",
  fields: [
    { id: "1", name: "Title", key: "title", type: "text", required: true },
    { id: "2", name: "Price", key: "price", type: "number", required: true },
  ],
});
```

### Media Operations

```typescript
// Upload file
const file = document.getElementById("file-input").files[0];
const media = await client.media.upload(file, "my-image.jpg");

// List media
const files = await client.media.list();

// Delete media
await client.media.delete(media.id);
```

## 🛠 Configuration

```typescript
interface SDKConfig {
  baseUrl: string; // API base URL
  apiKey?: string; // API key for authentication
  accessToken?: string; // JWT access token
  headers?: Record<string, string>; // Custom headers
  timeout?: number; // Request timeout (ms)
  retries?: number; // Max retry attempts
}
```

## 🧪 Error Handling

```typescript
import { SDKRequestError } from "@ferriqa/sdk";

try {
  await client.contents("posts").get("non-existent");
} catch (error) {
  if (error instanceof SDKRequestError) {
    console.log(error.status); // 404
    console.log(error.code); // 'NOT_FOUND'
    console.log(error.message); // 'Content not found'
  }
}
```

## 📖 TypeScript Support

Full TypeScript support with generated types:

```typescript
import type { ContentItem, Blueprint, User } from "@ferriqa/sdk";

const post: ContentItem = await client.contents("posts").get("hello");
```

## 📄 License

MIT © Ferriqa Team
