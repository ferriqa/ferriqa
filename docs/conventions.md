# Ferriqa Coding Standards

> **Naming conventions, code style and best practices**

---

## 🏷 Naming Conventions

### Package Names

| Type             | Format             | Example                |
| ---------------- | ------------------ | ---------------------- |
| **Organization** | `@ferriqa/*`       | `@ferriqa/core`        |
| **Package**      | `kebab-case`       | `@ferriqa/adapters-db` |
| **Plugin**       | `ferriqa-plugin-*` | `ferriqa-plugin-seo`   |
| **Application**  | `ferriqa-*`        | `ferriqa-admin`        |

### File and Folder Names

| Location         | Format                 | Example                   |
| ---------------- | ---------------------- | ------------------------- |
| **Source files** | `kebab-case.ts`        | `content-service.ts`      |
| **Test files**   | `*.test.ts`            | `content-service.test.ts` |
| **Folders**      | `kebab-case`           | `blueprint-engine/`       |
| **Config files** | `kebab-case`           | `tsconfig.json`           |
| **Constants**    | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT`         |

### Database Naming

| Element                | Format                   | Example                        |
| ---------------------- | ------------------------ | ------------------------------ |
| **Tables**             | `snake_case` (plural)    | `blueprints`, `contents`       |
| **Columns**            | `snake_case`             | `created_at`, `blueprint_id`   |
| **Foreign keys**       | `{table}_id`             | `user_id`, `content_id`        |
| **Indexes**            | `idx_{table}_{column}`   | `idx_contents_slug`            |
| **Unique constraints** | `uniq_{table}_{columns}` | `uniq_contents_blueprint_slug` |

**Example Table Structure**:

```sql
CREATE TABLE contents (
  id INTEGER PRIMARY KEY,
  blueprint_id INTEGER NOT NULL,
  user_id INTEGER,
  slug TEXT NOT NULL,
  data JSON NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  FOREIGN KEY (blueprint_id) REFERENCES blueprints(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(blueprint_id, slug)
);

CREATE INDEX idx_contents_blueprint ON contents(blueprint_id);
CREATE INDEX idx_contents_user ON contents(user_id);
```

### API Endpoint Naming

| Pattern     | Example                             | Description    |
| ----------- | ----------------------------------- | -------------- |
| **List**    | `GET /api/v1/blueprints`            | All records    |
| **Get**     | `GET /api/v1/blueprints/:id`        | Single record  |
| **Create**  | `POST /api/v1/blueprints`           | New record     |
| **Update**  | `PUT /api/v1/blueprints/:id`        | Full update    |
| **Partial** | `PATCH /api/v1/blueprints/:id`      | Partial update |
| **Delete**  | `DELETE /api/v1/blueprints/:id`     | Delete         |
| **Action**  | `POST /api/v1/contents/:id/publish` | Custom action  |
| **Nested**  | `GET /api/v1/contents/:id/versions` | Sub-resources  |

**Query Parameters**:

| Parameter      | Format                     | Example                      |
| -------------- | -------------------------- | ---------------------------- |
| **Filters**    | `filters[{field}]={value}` | `?filters[status]=published` |
| **Sort**       | `sort={field}:{direction}` | `?sort=created_at:desc`      |
| **Pagination** | `page={n}&limit={n}`       | `?page=1&limit=25`           |
| **Fields**     | `fields={field1},{field2}` | `?fields=title,slug`         |
| **Populate**   | `populate={relation}`      | `?populate=author,category`  |
| **Search**     | `q={query}`                | `?q=hello+world`             |

### TypeScript Naming

| Element        | Format                       | Example                             |
| -------------- | ---------------------------- | ----------------------------------- |
| **Interfaces** | `PascalCase`                 | `Blueprint`, `Content`              |
| **Types**      | `PascalCase`                 | `FieldType`, `Permission`           |
| **Enums**      | `PascalCase`                 | `ContentStatus`, `UserRole`         |
| **Classes**    | `PascalCase`                 | `ContentService`, `DatabaseAdapter` |
| **Functions**  | `camelCase`                  | `createContent`, `validateField`    |
| **Variables**  | `camelCase`                  | `contentList`, `isPublished`        |
| **Constants**  | `SCREAMING_SNAKE_CASE`       | `DEFAULT_PAGE_SIZE`                 |
| **Private**    | `_camelCase`                 | `_internalMethod()`                 |
| **Generics**   | `T`, `K`, `V` or descriptive | `T`, `ResponseType`                 |

**Example TypeScript**:

```typescript
// Interface
interface Content {
  id: string;
  blueprintId: string;
  slug: string;
  data: Record<string, unknown>;
  createdAt: Date;
}

// Type
type FieldType = "text" | "number" | "boolean" | "relation";

// Enum
enum ContentStatus {
  Draft = "draft",
  Published = "published",
  Archived = "archived",
}

// Class
class ContentService {
  private _database: DatabaseAdapter;

  async createContent(blueprintId: string, data: unknown): Promise<Content> {
    // Implementation
  }
}

// Function
function validateContentData(
  data: unknown,
  blueprint: Blueprint,
): ValidationResult {
  // Implementation
}

// Constants
const DEFAULT_PAGE_SIZE = 25;
const MAX_RETRY_ATTEMPTS = 3;
```

---

## 🎨 Code Style

### TypeScript Rules

#### Strict Mode

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

#### Import/Export

```typescript
// ❌ Bad - Wildcard imports
import * as utils from "./utils";

// ✅ Good - Named imports
import { validateContent, formatDate } from "./utils";

// ✅ Good - Default export for main class
import ContentService from "./content-service";

// ✅ Good - Re-exports
export { ContentService, validateContent } from "./content";
export type { Content, Blueprint } from "./types";
```

#### Type Definitions

```typescript
// ❌ Bad - using any
function processData(data: any): any {
  return data.value;
}

// ✅ Good - Explicit types
function processData<T extends { value: unknown }>(data: T): T["value"] {
  return data.value;
}

// ✅ Good - Unknown + Type Guard
function processData(data: unknown): string {
  if (typeof data === "string") {
    return data;
  }
  throw new Error("Expected string");
}

// ✅ Good - Interface over Type for objects
interface UserConfig {
  name: string;
  age: number;
}

// ✅ Good - Type for unions
type Status = "active" | "inactive" | "pending";
```

#### Functions

```typescript
// ✅ Good - Explicit return type
async function fetchContent(id: string): Promise<Content | null> {
  // Implementation
}

// ✅ Good - Options object pattern (3+ parameters)
interface CreateContentOptions {
  blueprintId: string;
  data: unknown;
  userId?: string;
  publish?: boolean;
}

async function createContent(options: CreateContentOptions): Promise<Content> {
  // Implementation
}

// ❌ Bad - Too many parameters
async function createContent(
  blueprintId: string,
  data: unknown,
  userId: string,
  publish: boolean,
): Promise<Content> {
  // Implementation
}

// ✅ Good - Arrow functions for callbacks
const items = contents.map((content) => content.id);

// ✅ Good - Async/await over callbacks
const content = await fetchContent("123");

// ❌ Bad - Callback hell
fetchContent("123", (err, content) => {
  if (err) {
    /* handle */
  }
  // ...
});
```

#### Error Handling

```typescript
// ✅ Good - Custom error classes
class ValidationError extends Error {
  constructor(
    message: string,
    public errors: ValidationIssue[],
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

// ✅ Good - Try-catch with specific errors
try {
  const content = await contentService.create(data);
} catch (error) {
  if (error instanceof ValidationError) {
    return c.json({ errors: error.errors }, 400);
  }
  if (error instanceof NotFoundError) {
    return c.json({ error: error.message }, 404);
  }
  throw error; // Re-throw unknown errors
}

// ✅ Good - Early returns
function validateContent(content: unknown): ValidationResult {
  if (!content) {
    return { valid: false, error: "Content is required" };
  }

  if (typeof content !== "object") {
    return { valid: false, error: "Content must be an object" };
  }

  // Continue validation...
  return { valid: true };
}
```

---

## 🧪 Test Standards

### Test File Structure

```
package/
└── src/
    ├── content/
    │   ├── service.ts
    │   └── service.test.ts          # Side by side
    └── validation/
        ├── engine.ts
        └── engine.test.ts
```

### Test Naming

```typescript
// describe block - component/feature name
describe("ContentService", () => {
  // Test case - should + expected behavior
  it("should create content with valid data", async () => {
    // Test
  });

  it("should throw ValidationError with invalid data", async () => {
    // Test
  });

  // Grouped tests
  describe("when content exists", () => {
    it("should update content successfully", async () => {
      // Test
    });
  });

  describe("when content does not exist", () => {
    it("should throw NotFoundError", async () => {
      // Test
    });
  });
});
```

### Test Best Practices

```typescript
// ✅ Good - Arrange, Act, Assert
describe("ContentService", () => {
  it("should create content with valid data", async () => {
    // Arrange
    const blueprint = createMockBlueprint();
    const data = { title: "Test" };

    // Act
    const content = await contentService.create(blueprint.id, data);

    // Assert
    expect(content).toBeDefined();
    expect(content.data.title).toBe("Test");
  });
});

// ✅ Good - Test isolation
beforeEach(() => {
  // Reset state
  database.clear();
});

// ✅ Good - Descriptive assertions
expect(result).toHaveLength(3);
expect(content).toMatchObject({ title: "Test" });
expect(() => validate("")).toThrow(ValidationError);
```

---

## 📝 Documentation

### JSDoc Standards

````typescript
/**
 * Creates a new content item based on the provided blueprint.
 *
 * @param blueprintId - The ID of the blueprint to use
 * @param data - The content data matching the blueprint schema
 * @param userId - Optional ID of the user creating the content
 * @returns The created content item
 * @throws {ValidationError} If the data doesn't match the blueprint schema
 * @throws {NotFoundError} If the blueprint doesn't exist
 *
 * @example
 * ```typescript
 * const content = await createContent('blueprint-123', {
 *   title: 'Hello World',
 *   body: 'Content here...'
 * }, 'user-456');
 * ```
 */
async function createContent(
  blueprintId: string,
  data: unknown,
  userId?: string,
): Promise<Content> {
  // Implementation
}

/**
 * Interface representing a content blueprint (content type definition).
 */
interface Blueprint {
  /** Unique identifier */
  id: string;

  /** Human-readable name */
  name: string;

  /** URL-friendly unique identifier */
  slug: string;

  /** Field definitions for this content type */
  fields: FieldDefinition[];
}
````

### README Template

```markdown
# @ferriqa/package-name

Brief description of the package.

## Installation

\`\`\`bash
bun add @ferriqa/package-name
\`\`\`

## Usage

\`\`\`typescript
import { something } from '@ferriqa/package-name';

// Example usage
\`\`\`

## API

### functionName(param)

Description of the function.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)
```

---

## 🔧 Git Standards

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting, missing semi colons, etc.)
- `refactor`: Code refactor (not a feat or fix)
- `test`: Test added/updated
- `chore`: Build, tooling, dependencies

**Scopes**:

- `core`: @ferriqa/core
- `db`: @ferriqa/adapters-db
- `api`: @ferriqa/api
- `cli`: @ferriqa/cli
- `admin`: apps/admin-ui
- `sdk`: @ferriqa/sdk
- `deps`: Dependencies

**Examples**:

```
feat(core): add validation engine for content types

Implements Zod-based validation for blueprint fields.
Supports custom validators and async validation.

Closes #123
```

```
fix(db): handle SQLite JSON1 extension absence

Fallback to text column with manual JSON parse when
SQLite version is older than 3.38.

Fixes #456
```

```
docs(api): add webhook system documentation

Adds detailed documentation for webhook configuration,
delivery, and retry logic.
```

### Branch Strategy

| Branch      | Purpose                 | Pattern                      |
| ----------- | ----------------------- | ---------------------------- |
| `main`      | Production code         | -                            |
| `develop`   | Development integration | -                            |
| `feature/*` | New features            | `feature/content-versioning` |
| `fix/*`     | Bug fixes               | `fix/db-adapter-connection`  |
| `docs/*`    | Documentation           | `docs/api-webhooks`          |

### Pull Request Template

```markdown
## Summary

Brief description of changes

## Changes

- Change 1
- Change 2

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

---

## 🎯 Best Practices Summary

### Do's ✅

- [ ] Strict TypeScript mode always on
- [ ] Explicit return types on functions
- [ ] Null/undefined checks (strictNullChecks)
- [ ] Custom error classes
- [ ] Early returns
- [ ] Options object pattern (3+ parameters)
- [ ] Explicit imports/exports
- [ ] JSDoc for public APIs
- [ ] Descriptive test names
- [ ] Isolated tests

### Don'ts ❌

- [ ] Use `any` type (exceptional cases only)
- [ ] Use `console.log` in production code
- [ ] Magic numbers (use constants)
- [ ] Deep nesting (>3 levels)
- [ ] Callback hell (use async/await)
- [ ] Expose internal methods in public API
- [ ] Comment-out code (delete or keep in git)
- [ ] Implicit returns (use explicit return)
- [ ] Hardcoded values (use config)

---

## ⚡ Svelte & SvelteKit Conventions

### Svelte 5 Runes

```svelte
<script lang="ts">
  // ✅ Good - Svelte 5 runes
  let count = $state(0);
  let doubled = $derived(count * 2);

  function increment() {
    count += 1;
  }

  // Props (destructured with $props)
  interface Props {
    title: string;
    count?: number;
    onClick?: () => void;
  }

  let { title, count = 0, onClick }: Props = $props();

  // Snippets for children
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<!-- ❌ Bad - Old Svelte 4 syntax -->
<script>
  export let title;
  export let count = 0;
</script>
```

### Component Structure

```svelte
<script lang="ts">
  // 1. Imports (alphabetical)
  import type { SomeType } from '$lib/types';
  import { someFunction } from '$lib/utils';
  import SomeComponent from './SomeComponent.svelte';

  // 2. Types/Interfaces
  interface Props {
    // ...
  }

  // 3. Props destructuring
  let { prop1, prop2 = defaultValue, ...rest }: Props = $props();

  // 4. State (use $state)
  let isOpen = $state(false);

  // 5. Derived (use $derived)
  let displayValue = $derived(value.toUpperCase());

  // 6. Effects (use $effect)
  $effect(() => {
    // side effects
  });

  // 7. Event handlers
  function handleClick() {
    // ...
  }
</script>

<!-- Template -->
<div class="container">
  <!-- Content -->
</div>

<style>
  /* Scoped styles if needed */
</style>
```

### Props Pattern

```svelte
// ✅ Good - Explicit props interface
interface Props {
  title: string;
  items: Item[];
  onSelect?: (item: Item) => void;
  variant?: 'primary' | 'secondary';
}

let {
  title,
  items,
  onSelect,
  variant = 'primary'
}: Props = $props();

// ✅ Good - Use $bindable for two-way binding
let value = $bindable('');

// ❌ Bad - Implicit any
let { data } = $props();
```

### Event Handling

```svelte
<script lang="ts">
  // ✅ Good - Named event handlers
  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    // ...
  }

  // ✅ Good - Callback props
  interface Props {
    onChange?: (value: string) => void;
  }

  let { onChange }: Props = $props();

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    onChange?.(target.value);
  }
</script>

<input oninput={handleInput} />
```

### Store Usage

```typescript
// ✅ Good - Svelte 5 runes stores
import { writable } from "svelte/store";

function createCounter() {
  let count = $state(0);

  return {
    get count() {
      return count;
    },
    increment() {
      count += 1;
    },
    decrement() {
      count -= 1;
    },
  };
}

// ✅ Good - Using $state in components
let count = $state(0);
```

### i18n (Paraglide)

```svelte
<script lang="ts">
  import * as m from '$lib/paraglide/messages';
</script>

<!-- ✅ Good - Use message function -->
<h1>{m.welcome_title()}</h1>

<!-- ✅ Good - With parameters -->
<p>{m.items_count({ count: 5 })}</p>
```

### CSS & Tailwind

```svelte
<!-- ✅ Good - Tailwind classes -->
<div class="flex items-center gap-4 p-4">

<!-- ✅ Good - Conditional classes with cn utility -->
<div class={cn('base-class', condition && 'conditional-class')}>

<!-- ❌ Bad - Inline styles -->
<div style="color: red;">
```

### API Service Structure

```typescript
// apps/admin-ui/src/lib/services/contentApi.ts
const API_BASE_URL = "/api/v1";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getContents(): Promise<ApiResponse<Content[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/contents`);
    if (!response.ok) throw new Error("Failed");
    return { success: true, data: await response.json() };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Component Folder Structure

```
lib/
├── components/
│   ├── ui/              # Base UI components
│   │   ├── button/
│   │   ├── input/
│   │   └── ...
│   ├── forms/           # Form components
│   ├── layout/          # Layout components
│   └── content/          # Content-specific components
├── services/             # API services
├── stores/               # Svelte stores
├── utils/                # Utility functions
└── types/                # Shared types
```

---

## 📚 References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

---

_Last updated: February 2026_
