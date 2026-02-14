# Ferriqa Architecture Summary

> **Project architecture and technology stack overview**

---

## 🏗 System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Web App   │  │ Mobile App  │  │   Other     │              │
│  │  (React,    │  │  (iOS,      │  │  (IoT,      │              │
│  │   Vue, etc) │  │   Android)  │  │   Desktop)  │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          └────────────────┴────────────────┘
                            │
                    ┌──────▼──────┐
                    │  REST API   │
                    │  (/api/v1)  │
                    └──────┬──────┘
                            │
           ┌────────────────┼────────────────┐
           │                │                │
     ┌─────▼─────┐   ┌─────▼─────┐   ┌──────▼──────┐
     │  API Layer│   │ Webhooks  │   │   Auth      │
     │  (Hono)   │   │  System   │   │  (JWT)      │
     └─────┬─────┘   └───────────┘   └─────────────┘
           │
     ┌─────▼─────────────────────────────────────┐
     │          CORE ENGINE (@ferriqa/core)       │
     │  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
     │  │ Content  │  │ Blueprint│  │ Relations│ │
     │  │ Service  │  │ Engine   │  │ System   │ │
     │  └──────────┘  └──────────┘  └──────────┘ │
     │  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
     │  │ Version  │  │  Hooks   │  │ Validation│ │
     │  │ Control  │  │ System   │  │ Engine   │ │
     │  └──────────┘  └──────────┘  └──────────┘ │
     └─────┬─────────────────────────────────────┘
           │
     ┌─────▼─────────────────────────────────────┐
     │     DATABASE ADAPTER (@ferriqa/adapters-db)│
     │         ┌──────────────────┐              │
     │         │  Drizzle ORM     │              │
     │         │  (SQLite + JSON) │              │
     │         └────────┬─────────┘              │
     │                  │                        │
     │    ┌─────────────┼─────────────┐         │
     │    │             │             │         │
     │ ┌──▼──┐     ┌───▼───┐    ┌───▼───┐      │
     │ │Bun  │     │ Node  │    │ Deno  │      │
     │ │SQLite│    │better-│    │SQLite │      │
     │ │      │    │sqlite3│    │       │      │
     │ └──────┘    └───────┘    └───────┘      │
     └───────────────────────────────────────────┘
           │
     ┌─────▼─────┐
     │  SQLite   │
     │ Database  │
     │  (JSON1)  │
     └───────────┘
```

---

## 🛠 Technology Stack

### Core Technologies

| Layer              | Technology         | Reason                                   |
| ------------------ | ------------------ | ---------------------------------------- |
| **Runtime**        | Bun, Node.js, Deno | Universal compatibility                  |
| **Monorepo**       | Bun Workspaces     | Native Bun support, fast                 |
| **Language**       | TypeScript 5.3+    | Type safety, modern JS                   |
| **Database**       | SQLite 3.38+       | Embedded, zero-config, JSON support      |
| **ORM**            | Drizzle ORM        | Type-safe, lightweight, SQL-like         |
| **HTTP Framework** | Hono 3.x+          | Universal (works on all runtimes), fast  |
| **Validation**     | Zod                | Runtime type checking, schema validation |

### Developer Tools

| Tool           | Usage                                 |
| -------------- | ------------------------------------- |
| **Oxlint**     | Linting (Rust-based, fast)            |
| **Prettier**   | Code formatting                       |
| **TypeScript** | Type checking                         |
| **Bun**        | Package manager, test runner, bundler |

### Admin UI Stack

| Layer          | Technology                        |
| -------------- | --------------------------------- |
| **Framework**  | SvelteKit 2.x / Svelte 5          |
| **Reactivity** | Svelte 5 Runes ($state, $derived) |
| **Components** | [Preline UI](https://preline.co/) |
| **Styling**    | Tailwind CSS 4.x                  |
| **Icons**      | Lucide Svelte                     |
| **i18n**       | Paraglide JS (inlang)             |

**Preline UI Features**:

- 840+ free components and examples
- Universal framework compatibility (React, Vue, Svelte, HTML)
- Tailwind CSS v4.0+ based
- Built-in themes and dark mode support
- Figma design system included
- Accessible components (WCAG compliant)

---

## 📦 Package Structure

### Monorepo Layout

```
ferriqa/
├── apps/
│   └── admin-ui/              # SvelteKit admin dashboard
├── packages/
│   ├── core/                  # Core engine & business logic
│   │   ├── src/
│   │   │   ├── runtime.ts   # Runtime detection
│   │   │   ├── hooks.ts     # Lifecycle hooks
│   │   │   ├── blueprints/  # Blueprint engine
│   │   │   ├── content/    # Content service
│   │   │   ├── relations/  # Relations system
│   │   │   ├── validation/ # Validation engine
│   │   │   ├── webhooks/    # Webhook system
│   │   │   ├── cache/       # Caching system
│   │   │   └── plugins/     # Plugin system
│   │   └── package.json
│   │
│   ├── adapters-db/          # Database adapters
│   │   ├── src/
│   │   │   ├── schema.ts    # Drizzle schemas
│   │   │   ├── factory.ts   # Adapter factory
│   │   │   ├── adapters/
│   │   │   │   ├── bun.ts   # Bun SQLite
│   │   │   │   ├── node.ts   # better-sqlite3
│   │   │   │   └── deno.ts  # Deno SQLite
│   │   │   └── migrations/  # Migration runner
│   │   └── package.json
│   │
│   ├── api/                  # HTTP API layer
│   │   ├── src/
│   │   │   ├── server.ts   # Hono app setup
│   │   │   ├── routes/     # API routes
│   │   │   ├── middleware/ # Auth, cache, rate limit
│   │   │   ├── auth/       # JWT, API keys, RBAC
│   │   │   ├── webhooks/   # Webhook handlers
│   │   │   ├── media/      # Media management
│   │   │   ├── utils/      # Query parser, helpers
│   │   │   └── handlers/   # Route handlers
│   │   └── package.json
│   │
│   ├── cli/                  # Command line interface
│   │   ├── src/
│   │   │   ├── commands/   # CLI commands (init, dev, db, blueprint)
│   │   │   ├── templates/  # Project templates
│   │   │   └── index.ts    # CLI entry
│   │   └── package.json
│   │
│   ├── sdk/                  # Type-safe API client
│   │   ├── src/
│   │   │   ├── client/    # HTTP client
│   │   │   ├── auth/      # Auth client
│   │   │   └── types/    # TypeScript types
│   │   └── package.json
│   │
│   ├── plugins/             # Built-in plugins
│   │   ├── src/
│   │   │   └── builtins/ # SEO, storage plugins
│   │   └── package.json
│   │
│   └── i18n/                # Internationalization (reserved)
│       └── package.json
│
├── docs/                     # Documentation
│   └── roadmap/              # Development roadmap
│
├── package.json              # Root package (workspaces)
├── bun.lock                  # Bun lockfile
├── deno.json                 # Deno configuration
├── tsconfig.json             # TypeScript config
└── README.md
```

### Package Dependencies

```
@ferriqa/core
    ↓ (workspace)
@ferriqa/adapters-db ← @ferriqa/core
    ↓
@ferriqa/api ← @ferriqa/core, @ferriqa/adapters-db, @ferriqa/plugins

apps/admin-ui ← @ferriqa/sdk

@ferriqa/cli ← @ferriqa/core, @ferriqa/adapters-db

@ferriqa/sdk (standalone)
@ferriqa/plugins ← @ferriqa/core
```

---

## 🔌 Runtime Adaptation

### Runtime Detection

```typescript
// packages/core/src/runtime.ts
export const isBun = typeof Bun !== "undefined";
export const isDeno = typeof Deno !== "undefined";
export const isNode = !isBun && !isDeno && typeof process !== "undefined";

export function getRuntimeInfo() {
  if (isBun) return { name: "Bun", version: Bun.version };
  if (isDeno) return { name: "Deno", version: Deno.version };
  if (isNode) return { name: "Node.js", version: process.version };
  return { name: "Unknown", version: "0.0.0" };
}
```

### Conditional Loading

```typescript
// Database adapter selection
let adapter: DatabaseAdapter;

if (isBun) {
  const { BunSQLiteAdapter } = await import("./adapters/bun");
  adapter = new BunSQLiteAdapter();
} else if (isNode) {
  const { BetterSQLiteAdapter } = await import("./adapters/node");
  adapter = new BetterSQLiteAdapter();
} else if (isDeno) {
  const { DenoSQLiteAdapter } = await import("./adapters/deno");
  adapter = new DenoSQLiteAdapter();
}
```

---

## 🗄 Database Architecture

### Hybrid Storage Model

**Relational Tables**: Metadata, relations, indexes
**JSON Columns**: Flexible content data

```sql
-- Relational structure
CREATE TABLE blueprints (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  fields JSON NOT NULL,        -- Field definitions
  settings JSON,
  created_at INTEGER
);

CREATE TABLE contents (
  id INTEGER PRIMARY KEY,
  blueprint_id INTEGER REFERENCES blueprints(id),
  slug TEXT NOT NULL,
  data JSON NOT NULL,          -- Content data (flexible schema)
  meta JSON,                   -- SEO, metadata
  status TEXT DEFAULT 'draft',
  created_at INTEGER,
  updated_at INTEGER,
  UNIQUE(blueprint_id, slug)
);

-- JSON indexing (generated columns)
ALTER TABLE contents ADD COLUMN title TEXT
  GENERATED ALWAYS AS (json_extract(data, '$.title')) STORED;
CREATE INDEX idx_content_title ON contents(title);
```

### Query Strategy

```typescript
// JSON path queries
const posts = await db.query(
  `
  SELECT * FROM contents 
  WHERE blueprint_id = ? 
  AND json_extract(data, '$.status') = 'published'
  AND json_extract(data, '$.tags') LIKE ?
  ORDER BY created_at DESC
  `,
  [postsBlueprintId, "%featured%"],
);
```

---

## 🔐 Security Architecture

### Authentication Flow

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│   Client   │────▶│  /login    │────▶│  Validate  │
│            │     │            │     │  Password  │
└────────────┘     └────────────┘     └──────┬─────┘
     │                                       │
     │         ┌──────────────────────────────┘
     │         │
     │    ┌────▼─────┐     ┌────────────┐
     │◀───│ Generate │◀────│  Create    │
     │    │  JWT     │     │  Session   │
     │    └──────────┘     └────────────┘
     │
┌────▼────┐
│  Store  │
│  Token  │
└─────────┘

Request Flow:
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│   Client   │────▶│  API Call  │────▶│   Verify   │────▶│  Process   │
│ with JWT   │     │ /api/v1/...│     │    JWT     │     │  Request   │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
```

### Security Layers

1. **Network**: HTTPS/TLS, CORS, Rate limiting
2. **Authentication**: JWT tokens, API keys
3. **Authorization**: RBAC, field-level permissions
4. **Input**: Validation (Zod), sanitization
5. **Data**: SQL injection prevention (parameterized queries)
6. **Audit**: Action logging, access tracking

---

## ⚡ Performance Strategies

### Caching Strategy

| Cache Level  | Scope   | TTL    | Invalidation   |
| ------------ | ------- | ------ | -------------- |
| **Memory**   | Runtime | 5-300s | Event-based    |
| **Database** | Query   | -      | Schema changes |
| **CDN**      | Static  | 1h+    | Manual purge   |

### Query Optimization

- JSON indexes with generated columns
- Relation query batching
- Selective field population
- Pagination (cursor-based for large datasets)

---

## 🔧 Extensibility Points

### Hook System

```typescript
// Lifecycle hooks
hookRegistry.on("content:afterCreate", async ({ content }) => {
  // Custom logic
});

hookRegistry.on("content:beforeUpdate", async ({ content, data }) => {
  // Transform data
  return { ...data, modifiedBy: "hook" };
});
```

### Plugin API

```typescript
// Plugin structure
const myPlugin: Plugin = {
  name: "my-plugin",
  version: "1.0.0",
  register(context) {
    context.hooks.on("content:afterCreate", handler);
    context.api.post("/custom-route", routeHandler);
    context.admin.addComponent("sidebar", MyComponent);
  },
};
```

---

## 📋 Technical Specifications

### API Features

- **Format**: JSON
- **Authentication**: JWT Bearer + API Keys
- **Authorization**: RBAC + Field-level permissions
- **Rate Limiting**: 1000 req/min default (in-memory)
- **Pagination**: Offset-based (page/limit)
- **Filtering**: Query parameters with operators
- **Sorting**: Field + direction
- **Population**: Relation expansion
- **Versioning**: URL path (`/api/v1/`)
- **Webhooks**: Async delivery with retry logic
- **Media**: Upload, resize, CDN-ready

### Database Features

- **Engine**: SQLite 3.38+ (JSON1 extension)
- **ORM**: Drizzle
- **Migrations**: Automatic + Manual
- **Connections**: Pooling per runtime
- **Backup**: File-based (SQLite advantage)

### Supported Runtimes

| Runtime | Version | Status    |
| ------- | ------- | --------- |
| Bun     | 1.0+    | Primary   |
| Node.js | 18.x+   | Supported |
| Deno    | 1.40+   | Supported |

---

## 🎯 Architectural Principles

1. **Universal**: Works on all JavaScript runtimes
2. **Modular**: Packages are independent, loosely coupled
3. **Type-Safe**: TypeScript everywhere, runtime validation
4. **Performance**: In-memory caching, efficient queries
5. **Extensible**: Hook-based, plugin-ready
6. **Simple**: Zero-config startup, optional complexity

---

_Last updated: February 2026_
