# Ferriqa - Agent Development Guidelines

This guide is for agentic coding assistants working on the Ferriqa codebase. Ferriqa is a modern, modular headless CMS built as a monorepo with cross-runtime support (Bun, Node.js, Deno).

## Repository Structure

```
ferriqa/
├── apps/
│   └── admin-ui/          # SvelteKit admin interface
├── packages/
│   ├── core/              # Core runtime and foundation utilities
│   ├── api/               # API server
│   ├── adapters-db/       # Database adapters
│   ├── client-sdk/        # Client SDK
│   ├── cli/               # CLI tools
│   ├── i18n/              # Internationalization
│   ├── plugins/           # Plugin system
│   └── sdk/               # SDK package
└── docs/                  # Documentation
```

## Build, Lint, and Test Commands

### Root Level (Monorepo)

```bash
# Development - Start all services
bun run dev                # Start all apps/packages with hot reload
npm run dev:all            # Start API and admin UI concurrently

# Individual Services
npm run dev:api            # Start API server only
npm run dev:admin          # Start admin UI only

# Testing
npm run test               # Run all tests across all runtimes
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:cross-runtime # Cross-runtime compatibility tests
npm run test:coverage      # Run tests with coverage report

# Runtime-Specific Tests
npm run test:bun           # Run tests with Bun test runner
npm run test:node          # Run tests with Node.js test runner
npm run test:deno          # Run tests with Deno test runner

# Running a Single Test File
# For Bun (primary runtime):
bun test packages/core/src/__tests__/unit/cache.test.ts

# For Node.js:
node --import tsx --test packages/core/src/__tests__/unit/cache.test.ts

# For Deno:
deno test --allow-read --allow-env --allow-write packages/core/src/__tests__/unit/cache.test.ts

# Linting and Formatting
npm run lint               # Run oxlint (fast linter)
npm run format             # Format code with Prettier
npm run check              # Run both Prettier check and oxlint

# Core Package Type Checking
cd packages/core && npm run typecheck    # TypeScript type checking
```

### Admin UI (apps/admin-ui/)

```bash
# Development
npm run dev                # Start SvelteKit dev server (http://localhost:5173)
npm run build              # Build for production
npm run preview            # Preview production build

# Type Checking
npm run check              # Run svelte-check once
npm run check:watch        # Run svelte-check in watch mode

# i18n (Paraglide)
npm run paraglide:compile  # Compile messages/*.json to src/lib/paraglide/
npm run paraglide:watch    # Watch mode for translations

# E2E Testing
npm run test:e2e           # Run Playwright tests
npm run test:e2e:ui        # Run tests with UI
npm run test:e2e:debug     # Debug mode
npm run test:e2e:chromium  # Run on Chromium only
```

## Code Style Guidelines

### TypeScript Configuration

- **Target**: ESNext
- **Module**: ESNext with bundler resolution
- **Strict Mode**: Enabled (`strict: true`)
- **Path Aliases**: `@ferriqa/*` → `./packages/*/src`
- **Import Extensions**: `.ts` extensions required for ESM bundler resolution

### Import Conventions

```typescript
// ✅ GOOD - Named exports from barrel files
import { isBun, isDeno, FerriqaError } from "@ferriqa/core";
import type { FieldDefinition } from "$lib/components/blueprint/types";

// ✅ GOOD - Type-only imports
import type { Blueprint } from "./types.ts";
import type { ErrorLogEntry } from "./types.ts";

// ❌ AVOID - Default exports (use named exports instead)
// export default class MyClass { }  // Don't do this

// ✅ GOOD - Re-export patterns
export * from "./runtime.ts";
export { SomeClass, someFunction } from "./module.ts";

// ✅ GOOD - i18n imports in admin UI
import * as m from "$lib/paraglide/messages.js";
```

### File Naming Conventions

- **Source files**: `camelCase.ts` (e.g., `errorLogger.ts`, `cache.ts`)
- **Test files**: `*.test.ts` (e.g., `cache.test.ts`, `hooks.test.ts`)
- **Type definition files**: `types.ts` or `*.types.ts`
- **Svelte components**: `PascalCase.svelte` (e.g., `TextField.svelte`, `ContentEditor.svelte`)
- **Barrel files**: `index.ts`

### Code Organization

```typescript
// 1. File header JSDoc comment (if module-level)
/**
 * @ferriqa/core - Cache System
 *
 * In-memory caching with TTL and LRU eviction
 */

// 2. Imports (standard library first, then third-party, then internal)
import { describe, it, expect } from "@ferriqa/core/testing";
import type { FieldDefinition } from "./types.ts";

// 3. Type definitions
interface CacheOptions {
  maxSize: number;
  defaultTTL: number;
}

// 4. Constants
const DEFAULT_MAX_SIZE = 1000;

// 5. Classes/Functions
export class Cache { ... }
export function createCache() { ... }

// 6. Exports
export { Cache, createCache };
```

### Error Handling

```typescript
// ✅ GOOD - Use FerriqaError base class
import { FerriqaError, ErrorCode } from "@ferriqa/core/errors";

throw new FerriqaError(ErrorCode.VALIDATION_FAILED, "Invalid input data", {
  statusCode: 400,
  metadata: { field: "email", value: input },
});

// ✅ GOOD - Use specialized error classes
import {
  FerriqaValidationError,
  FerriqaDatabaseError,
} from "@ferriqa/core/errors";

throw new FerriqaValidationError(
  ErrorCode.INVALID_EMAIL,
  "Email format is invalid",
  { field: "email" },
);

// ✅ GOOD - Error chaining
throw new FerriqaError(
  ErrorCode.DATABASE_QUERY_FAILED,
  "Failed to fetch content",
  { cause: originalError },
);

// ✅ GOOD - Validate dates before comparing
const timestamp = new Date(data.updatedAt).getTime();
if (isNaN(timestamp)) {
  throw new FerriqaError(ErrorCode.INVALID_DATE, "Invalid date format");
}
```

### Svelte 5 Component Conventions

```svelte
<script lang="ts">
  // ✅ Use Svelte 5 runes
  interface Props {
    blueprint: Blueprint;
    onSave: (item: ContentItem) => void;
  }

  let { blueprint, onSave }: Props = $props();

  // Reactive state with $state
  let isLoading = $state(true);
  let error = $state<string | null>(null);

  // Derived values with $derived
  const inputType = $derived(field.type === "email" ? "email" : "text");
  const charCount = $derived(String(value).length);

  // Two-way binding with $bindable
  let { value = $bindable("") }: Props = $props();

  // Lifecycle
  import { onMount } from "svelte";
  onMount(() => { loadData(); });
</script>

{#if isLoading}
  <LoadingSpinner />
{:else if error}
  <ErrorMessage {error} />
{:else}
  <main>{content}</main>
{/if}
```

### JSDoc Documentation

````typescript
/**
 * Creates a new cache instance with the specified options
 * @param name - Unique identifier for this cache
 * @param options - Cache configuration options
 * @returns A configured Cache instance
 * @example
 * ```ts
 * const cache = createCache("api-cache", { maxSize: 1000 });
 * ```
 */
export function createCache<T>(
  name: string,
  options?: Partial<CacheOptions>,
): Cache<T> {
  // ...
}
````

### Constants and Enums

```typescript
// ✅ GOOD - UPPER_SNAKE_CASE for constants
const DEFAULT_TTL = 60000;
const MAX_CACHE_SIZE = 10000;

// ✅ GOOD - PascalCase for enums
enum ErrorCode {
  VALIDATION_FAILED = "VALIDATION_FAILED",
  DATABASE_ERROR = "DATABASE_ERROR",
  NOT_FOUND = "NOT_FOUND",
}

// ✅ GOOD - Constants objects
export const DEFAULT_BLUEPRINTS = {
  users: { ... },
  media: { ... },
} as const;
```

### Testing Patterns

```typescript
// ✅ GOOD - Use describe/it from @ferriqa/core/testing
import { describe, it, expect, runTests } from "@ferriqa/core/testing";

describe("Cache", () => {
  it("should set and get values", () => {
    const cache = new Cache<string>({
      maxSize: 100,
      defaultTTL: 1000,
      name: "test",
    });
    cache.set("key1", "value1");
    expect(cache.get("key1")).toBe("value1");
    cache.dispose(); // Always clean up
  });

  // Always call runTests() at the end
});
runTests();
```

### Formatting (Prettier)

- **Plugin**: `prettier-plugin-tailwindcss` for Tailwind CSS class sorting
- **Config**: See `apps/admin-ui/.prettierrc`
- **Run**: `npm run format` to auto-format all files

### Type Safety

```typescript
// ✅ GOOD - Strict type checking
// Don't use `any` - use `unknown` with type guards
function processValue(value: unknown) {
  if (typeof value === "string") {
    return value.toUpperCase();
  }
  throw new FerriqaError(ErrorCode.INVALID_TYPE, "Expected string");
}

// ✅ GOOD - Type assertions with validation
const blueprint = data as Blueprint;
if (!blueprint.id || !blueprint.fields) {
  throw new FerriqaError(
    ErrorCode.INVALID_BLUEPRINT,
    "Invalid blueprint structure",
  );
}
```

### Important Paths and Aliases

**Core Package**:

- `@ferriqa/core` → `packages/core/src/index.ts`
- `@ferriqa/core/testing` → `packages/core/src/testing/index.ts`

**Admin UI (SvelteKit)**:

- `$lib` → `apps/admin-ui/src/lib/`
- `$lib/paraglide/*` → `apps/admin-ui/src/lib/paraglide/*` (auto-generated)
- `$lib/components/blueprint/*` → Blueprint components
- `$lib/components/content/*` → Content editing components

## Common Issues & Solutions

### Paraglide i18n (Admin UI)

If you see errors like `Cannot find module '$lib/paraglide/*'`:

1. Run `npm run paraglide:compile` to generate type declarations
2. Restart TypeScript server in your editor

### Blueprint Type Conflicts

- `BlueprintSummary` (in `apps/admin-ui/src/lib/types.ts`): Used for listing pages
- `Blueprint` (in `apps/admin-ui/src/lib/components/blueprint/types.ts`): Used for builder

### Cross-Runtime Testing

Tests should pass in Bun, Node.js, and Deno. Use `@cross/test` and `@std/assert` for cross-runtime compatibility.

## After Code Changes

Always run these before considering work complete:

```bash
npm run lint               # Check for linting errors
npm run check              # Prettier + oxlint
npm run test               # Run all tests
# For core package changes: cd packages/core && npm run typecheck
```
