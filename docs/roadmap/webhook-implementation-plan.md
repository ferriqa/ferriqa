# 🎯 Webhook System Implementation Plan

> **Async Background Delivery + In-Memory Queue + Standard MVP**
>
> **Tahmini Süre**: 6 gün
> **Dosya Sayısı**: ~15 yeni dosya
> **Test Kapsamı**: 50+ test case
> **Başlangıç Tarihi**: 4 Şubat 2026

---

## 📊 Proje Özeti

### Kullanıcı Kararları

- **Delivery Mode**: Async (Background) - Webhooklar arka planda gönderilecek
- **Payload Limit**: Limitsiz - Her boyutu kabul edecek
- **Retry Strategy**: In-Memory Queue - Basit ve hızlı
- **MVP Scope**: Standard MVP - Delivery + logging + retry + test endpoint

### Mevcut Durum

- ✅ Hooks sistemi tamamen çalışıyor
- ✅ Database schema (webhooks & webhook_deliveries tabloları) mevcut
- ✅ API routes yapısı hazır (7 webhook endpoint)
- ✅ Permission sistemi tanımlı
- ✅ Webhook delivery logic (async, non-blocking)
- ✅ Retry sistemi (exponential backoff)
- ✅ Delivery logging (webhook_deliveries tablosu)
- ✅ 62 test passing (31 + 13 + 8 + 10)

---

## 🗓️ GÜN 1-2: Foundation (Database & Types)

### ✅ Task 1.1: Database Schema Expansion

**Dosya**: `packages/adapters-db/src/schema.ts` (ekleme)
**Durum**: ⏳ Bekliyor
**Süre**: 2 saat
**Bağımlılıklar**: Yok

**Eklenecekler**:

```typescript
// webhook_deliveries table
export const webhookDeliveries = sqliteTable("webhook_deliveries", {
  id: text("id").primaryKey(), // UUID
  webhookId: integer("webhook_id").references(() => webhooks.id),
  event: text("event").notNull(),
  statusCode: integer("status_code"),
  success: integer("success", { mode: "boolean" }).notNull().default(false),
  attempt: integer("attempt").notNull().default(1),
  response: text("response"), // Last 1000 chars
  duration: integer("duration"), // ms
  error: text("error"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});
```

**Indexler**:

- `webhook_id` index (delivery history queries için)
- `event` index (event filtering için)
- `created_at` index (timeline queries için)

---

### ✅ Task 1.2: Migration Creation

**Dosya**: `packages/adapters-db/src/migrations/2026_02_04_add_webhook_deliveries.ts`
**Durum**: ⏳ Bekliyor
**Süre**: 1 saat
**Bağımlılıklar**: Task 1.1

```typescript
// UP: Create table with indexes
// DOWN: Drop table
```

---

### ✅ Task 1.3: Webhook Types

**Dosya**: `packages/core/src/webhooks/types.ts` (yeni)
**Durum**: ⏳ Bekliyor
**Süre**: 2 saat
**Bağımlılıklar**: Yok

```typescript
export interface Webhook {
  id: number;
  name: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  secret?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface WebhookDelivery {
  id: string; // UUID
  webhookId: number;
  event: string;
  statusCode?: number;
  success: boolean;
  attempt: number;
  response?: string;
  duration?: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface WebhookDeliveryOptions {
  timeout?: number; // Default: 30000ms
  maxRetries?: number; // Default: 5
  initialDelayMs?: number; // Default: 1000ms
  backoffMultiplier?: number; // Default: 2
}

export interface WebhookPayload<T = unknown> {
  event: string;
  timestamp: number;
  deliveryId: string;
  data: T;
}

export type WebhookEvent =
  | "content.created"
  | "content.updated"
  | "content.deleted"
  | "content.published"
  | "content.unpublished"
  | "blueprint.created"
  | "blueprint.updated"
  | "blueprint.deleted"
  | "media.uploaded"
  | "media.deleted";
```

---

### ✅ Task 1.4: Webhook Service Core

**Dosya**: `packages/core/src/webhooks/service.ts` (yeni)
**Durum**: ⏳ Bekliyor
**Süre**: 5 saat
**Bağımlılıklar**: Task 1.3

**Core Methods**:

```typescript
class WebhookService {
  constructor(
    private db: DatabaseAdapter,
    private hookRegistry: HookRegistry,
  ) {}

  // Main dispatch method (async, non-blocking)
  async dispatch<T>(
    event: WebhookEvent,
    data: T,
    options?: WebhookDeliveryOptions,
  ): Promise<void>; // Returns immediately, queues delivery

  // Find active webhooks for event
  private async findWebhooksForEvent(event: WebhookEvent): Promise<Webhook[]>;

  // Generate HMAC-SHA256 signature
  private generateSignature(payload: string, secret: string): string;

  // Send webhook HTTP request
  private async sendWebhook(
    webhook: Webhook,
    payload: WebhookPayload,
    deliveryId: string,
    options: WebhookDeliveryOptions,
  ): Promise<WebhookDeliveryResult>;
}
```

---

## 🗓️ GÜN 3: Async Queue & Retry Logic

### ✅ Task 2.1: In-Memory Delivery Queue

**Dosya**: `packages/core/src/webhooks/queue.ts` (yeni)
**Durum**: ⏳ Bekliyor
**Süre**: 4 saat
**Bağımlılıklar**: Task 1.4

**Features**:

```typescript
interface WebhookJob {
  id: string;
  webhookId: number;
  event: WebhookEvent;
  payload: WebhookPayload;
  attempt: number;
  maxRetries: number;
  delayMs: number;
  priority: number; // 0=low, 1=normal, 2=high
  scheduledFor: number; // timestamp
}

class WebhookDeliveryQueue {
  private queue: PriorityQueue<WebhookJob>;
  private processing: Set<string> = new Set();
  private timer?: ReturnType<typeof setInterval>;

  // Add job to queue (for immediate execution)
  enqueue(job: WebhookJob): void;

  // Add retry job (scheduled for later)
  scheduleRetry(job: WebhookJob, delayMs: number): void;

  // Process queue (runs every 1s)
  private process(): Promise<void>;

  // Start/stop queue processor
  start(): void;
  stop(): void;

  // Get queue stats
  getStats(): { pending: number; processing: number };
}
```

**Priority Queue Implementation**:

- Use simple array sort (Bun/Node/Deno)
- Priority: 2 (immediate), 1 (normal), 0 (retries)
- Max concurrent jobs: 10 (configurable)

---

### ✅ Task 2.2: Retry Logic with Exponential Backoff

**Dosya**: `packages/core/src/webhooks/retry.ts` (yeni)
**Durum**: ⏳ Bekliyor
**Süre**: 2 saat
**Bağımlılıklar**: Task 2.1

```typescript
class WebhookRetryManager {
  // Calculate next retry delay
  calculateDelay(attempt: number, options: WebhookDeliveryOptions): number {
    const baseDelay = options.initialDelayMs ?? 1000;
    const multiplier = options.backoffMultiplier ?? 2;
    return baseDelay * Math.pow(multiplier, attempt - 1);
  }

  // Should retry?
  shouldRetry(
    statusCode: number | undefined,
    error: Error | undefined,
  ): boolean {
    // Retry on: 5xx, network errors, timeout
    // Don't retry on: 4xx
  }

  // Max retries reached?
  isFinalFailure(attempt: number, maxRetries: number): boolean {
    return attempt >= maxRetries;
  }
}
```

---

### ✅ Task 2.3: Queue Integration with WebhookService

**Dosya**: `packages/core/src/webhooks/service.ts` (güncelleme)
**Durum**: ⏳ Bekliyor
**Süre**: 2 saat
**Bağımlılıklar**: Task 1.4, 2.1, 2.2

```typescript
class WebhookService {
  private queue: WebhookDeliveryQueue;
  private retryManager: WebhookRetryManager;

  constructor() {
    this.queue = new WebhookDeliveryQueue();
    this.retryManager = new WebhookRetryManager();
    this.queue.start(); // Auto-start queue processor
  }

  async dispatch<T>(event: WebhookEvent, data: T): Promise<void> {
    // 1. Find webhooks
    const webhooks = await this.findWebhooksForEvent(event);

    // 2. Queue delivery jobs (async, non-blocking)
    for (const webhook of webhooks) {
      const job: WebhookJob = {
        id: crypto.randomUUID(),
        webhookId: webhook.id,
        event,
        payload: this.buildPayload(event, data),
        attempt: 1,
        maxRetries: 5,
        delayMs: 0,
        priority: 1,
        scheduledFor: Date.now(),
      };

      this.queue.enqueue(job);
    }

    // 3. Return immediately (non-blocking)
  }

  // Process single job (called by queue)
  private async processJob(job: WebhookJob): Promise<void> {
    // 1. Get webhook
    const webhook = await this.getWebhook(job.webhookId);

    // 2. Execute webhook:beforeSend filter
    const transformedPayload = await this.hookRegistry.filter(
      "webhook:beforeSend",
      job.payload,
    );

    // 3. Send HTTP request
    const result = await this.sendWebhook(webhook, transformedPayload, job.id);

    // 4. Log delivery to database
    await this.logDelivery(job, result);

    // 5. Execute webhook:afterSend action
    await this.hookRegistry.emit("webhook:afterSend", {
      webhook,
      payload: transformedPayload,
      result,
    });

    // 6. Handle retry
    if (
      !result.success &&
      this.retryManager.shouldRetry(result.statusCode, result.error)
    ) {
      const delay = this.retryManager.calculateDelay(job.attempt, {});
      this.queue.scheduleRetry({ ...job, attempt: job.attempt + 1 }, delay);
    }
  }

  // Cleanup
  destroy(): void {
    this.queue.stop();
  }
}
```

---

## 🗓️ GÜN 4: API Handlers & Validation

### ✅ Task 3.1: Webhook Validators

**Dosya**: `packages/api/src/handlers/validators/webhooks.ts` (yeni)
**Durum**: ⏳ Bekliyor
**Süre**: 2 saat
**Bağımlılıklar**: Task 1.3

```typescript
import { z } from "zod";

export const WebhookCreateSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().url(),
  events: z
    .array(
      z.enum([
        "content.created",
        "content.updated",
        "content.deleted",
        // ... all events
      ]),
    )
    .min(1),
  headers: z.record(z.string()).optional(),
  secret: z.string().min(16).optional(),
  isActive: z.boolean().optional().default(true),
});

export const WebhookUpdateSchema = WebhookCreateSchema.partial();

export const WebhookTestSchema = z.object({
  event: z.enum([...allEvents]),
  data: z.record(z.unknown()).optional(),
});

export const WebhookQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  event: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});
```

---

### ✅ Task 3.2: Webhook Handlers

**Dosya**: `packages/api/src/handlers/webhooks.ts` (yeni, mock yerine geçecek)
**Durum**: ⏳ Bekliyor
**Süre**: 6 saat
**Bağımlılıklar**: Task 1.4, 3.1

**Handlers**:

1. **GET /api/v1/webhooks** - List webhooks
2. **POST /api/v1/webhooks** - Create webhook
3. **GET /api/v1/webhooks/:id** - Get single webhook
4. **PUT /api/v1/webhooks/:id** - Update webhook
5. **DELETE /api/v1/webhooks/:id** - Delete webhook
6. **POST /api/v1/webhooks/:id/test** - Test webhook
7. **GET /api/v1/webhooks/:id/deliveries** - Get delivery history

---

### ✅ Task 3.3: Update Routes

**Dosya**: `packages/api/src/routes/v1/index.ts` (güncelleme)
**Durum**: ⏳ Bekliyor
**Süre**: 1 saat
**Bağımlılıklar**: Task 3.2

```typescript
// Replace mock handlers with real handlers
import * as webhookHandlers from "../../handlers/webhooks";

v1Routes.get(
  "/webhooks",
  authMiddleware(),
  requirePermission("webhook:read"),
  webhookHandlers.webhookListHandler,
);

// ... all other webhook routes
```

---

## 🗓️ GÜN 5: Service Implementation & Event Integration

### ✅ Task 4.1: WebhookService CRUD Operations

**Dosya**: `packages/core/src/webhooks/service.ts` (devam)
**Durum**: ⏳ Bekliyor
**Süre**: 3 saat
**Bağımlılıklar**: Task 1.4, 2.3

```typescript
class WebhookService {
  // CRUD operations
  async create(data: CreateWebhookRequest, userId?: string): Promise<Webhook>;

  async getById(id: number): Promise<Webhook | null>;

  async query(options: QueryOptions): Promise<PaginatedResult<Webhook>>;

  async update(id: number, data: UpdateWebhookRequest): Promise<Webhook>;

  async delete(id: number): Promise<void>;

  // Test webhook
  async test(
    id: number,
    event: WebhookEvent,
    data: unknown,
  ): Promise<{ deliveryId: string }>;

  // Get delivery history
  async getDeliveries(
    webhookId: number,
    options: QueryOptions,
  ): Promise<PaginatedResult<WebhookDelivery>>;
}
```

---

### ✅ Task 4.2: Event Integration - ContentService

**Dosya**: `packages/core/src/content/service.ts` (güncelleme)
**Durum**: ⏳ Bekliyor
**Süre**: 2 saat
**Bağımlılıklar**: Task 2.3

```typescript
class ContentService {
  constructor(
    private db: DatabaseAdapter,
    private hookRegistry: HookRegistry,
    private webhookService?: WebhookService, // Optional dependency
  ) {}

  async create(...): Promise<Content> {
    // ... existing logic ...

    // Emit hook (existing)
    await this.hookRegistry.emit("content:afterCreate", { content });

    // NEW: Dispatch webhooks (async, non-blocking)
    if (this.webhookService) {
      await this.webhookService.dispatch("content.created", {
        content,
        blueprint,
        userId,
      });
    }

    return content;
  }

  async update(...): Promise<Content> {
    // ... existing logic ...

    await this.hookRegistry.emit("content:afterUpdate", { content });

    if (this.webhookService) {
      await this.webhookService.dispatch("content.updated", {
        content,
        blueprint,
        changes,
        userId,
      });
    }

    return content;
  }

  async delete(...): Promise<void> {
    const content = await this.getById(id);

    await this.hookRegistry.emit("content:afterDelete", { content });

    if (this.webhookService) {
      await this.webhookService.dispatch("content.deleted", {
        content,
        blueprint,
        userId,
      });
    }
  }

  async publish(...): Promise<Content> {
    // ... existing logic ...

    await this.hookRegistry.emit("content:afterPublish", { content });

    if (this.webhookService) {
      await this.webhookService.dispatch("content.published", {
        content,
        blueprint,
        userId,
      });
    }
  }
}
```

---

### ✅ Task 4.3: Event Integration - BlueprintService

**Dosya**: `packages/core/src/blueprint/service.ts` (güncelleme)
**Durum**: ⏳ Bekliyor
**Süre**: 1 saat
**Bağımlılıklar**: Task 2.3

```typescript
// Same pattern: create/update/delete → dispatch webhooks
async create(...) {
  // ...
  if (this.webhookService) {
    await this.webhookService.dispatch("blueprint.created", { blueprint });
  }
}
```

---

## 🗓️ GÜN 6: Testing & Polish

### ✅ Task 5.1: WebhookService Unit Tests

**Dosya**: `packages/core/src/webhooks/__tests__/service.test.ts` (yeni)
**Durum**: ⏳ Bekliyor
**Süre**: 3 saat
**Bağımlılıklar**: Task 1.4, 2.3

**Test Cases** (20+):

1. ✅ dispatch() queues webhooks for event
2. ✅ dispatch() is non-blocking (returns immediately)
3. ✅ findWebhooksForEvent() filters by event type
4. ✅ findWebhooksForEvent() only returns active webhooks
5. ✅ generateSignature() creates HMAC-SHA256
6. ✅ sendWebhook() sends POST request with correct headers
7. ✅ sendWebhook() includes X-Webhook-Signature if secret exists
8. ✅ sendWebhook() respects timeout (30s default)
9. ✅ sendWebhook() records successful delivery
10. ✅ sendWebhook() records failed delivery with error
11. ✅ sendWebhook() triggers retry on 5xx error
12. ✅ sendWebhook() does NOT retry on 4xx error
13. ✅ sendWebhook() retries on network error
14. ✅ processJob() executes webhook:beforeSend filter
15. ✅ processJob() executes webhook:afterSend action
16. ✅ logDelivery() saves to webhook_deliveries table
17. ✅ CRUD operations work correctly
18. ✅ test() triggers immediate delivery
19. ✅ getDeliveries() returns paginated results
20. ✅ getDeliveries() filters by status

---

### ✅ Task 5.2: Queue & Retry Tests

**Dosya**: `packages/core/src/webhooks/__tests__/queue.test.ts` (yeni)
**Durum**: ⏳ Bekliyor
**Süre**: 2 saat
**Bağımlılıklar**: Task 2.1, 2.2

**Test Cases** (10+):

1. ✅ enqueue() adds job to queue
2. ✅ process() processes jobs in priority order
3. ✅ scheduleRetry() schedules job with delay
4. ✅ process() skips jobs scheduled for future
5. ✅ calculateDelay() implements exponential backoff
6. ✅ calculateDelay(1) → 1000ms
7. ✅ calculateDelay(2) → 2000ms
8. ✅ calculateDelay(3) → 4000ms
9. ✅ shouldRetry() returns true for 5xx
10. ✅ shouldRetry() returns false for 4xx
11. ✅ shouldRetry() returns true for network errors

---

### ✅ Task 5.3: API Handler Tests

**Dosya**: `packages/api/src/handlers/__tests__/webhooks.test.ts` (yeni)
**Durum**: ⏳ Bekliyor
**Süre**: 3 saat
**Bağımlılıklar**: Task 3.2, 3.3

**Test Cases** (15+):

1. ✅ GET /webhooks returns paginated list
2. ✅ GET /webhooks applies event filter
3. ✅ POST /webhooks creates webhook
4. ✅ POST /webhooks validates URL format
5. ✅ POST /webhooks validates secret length (min 16)
6. ✅ POST /webhooks requires webhook:create permission
7. ✅ GET /webhooks/:id returns single webhook
8. ✅ GET /webhooks/:id returns 404 if not found
9. ✅ PUT /webhooks/:id updates webhook
10. ✅ DELETE /webhooks/:id deletes webhook
11. ✅ DELETE /webhooks/:id requires webhook:delete permission
12. ✅ POST /webhooks/:id/test triggers delivery
13. ✅ GET /webhooks/:id/deliveries returns history
14. ✅ GET /webhooks/:id/deliveries filters by status
15. ✅ All handlers require authentication

---

### ✅ Task 5.4: Integration Tests

**Dosya**: `packages/core/src/__tests__/integration/webhook-integration.test.ts` (yeni)
**Durum**: ✅ Tamamlandı
**Süre**: 2 saat
**Bağımlılıklar**: Task 4.2, 4.3

**Test Cases** (5+):

1. ✅ content.create → webhook dispatched
2. ✅ content.update → webhook dispatched with changes
3. ✅ content.delete → webhook dispatched
4. ✅ blueprint.create → webhook dispatched
5. ✅ webhook.beforeSend filter modifies payload
6. ✅ webhook.afterSend action receives result

---

### ✅ Task 5.5: Cross-Platform Testing

**Durum**: ⏳ Bekliyor
**Süre**: 2 saat
**Bağımlılıklar**: Task 5.1, 5.2, 5.3, 5.4

```bash
# Run tests on all runtimes
bun test packages/core/src/webhooks/__tests__/
node --test packages/core/src/webhooks/__tests__/
deno test packages/core/src/webhooks/__tests__/
```

**Verify**:

- All tests pass on Bun, Node.js, Deno
- No runtime-specific issues
- Fetch API works on all platforms
- Crypto API works on all platforms

---

### ✅ Task 5.6: Lint & Type Check

**Durum**: ⏳ Bekliyor
**Süre**: 1 saat
**Bağımlılıklar**: Task 1.4, 2.3, 3.2

```bash
# Lint
oxlint packages/core/src/webhooks/
oxlint packages/api/src/handlers/webhooks.ts

# Type check
bun tsc --noEmit
```

**Fix any issues**:

- Unused imports
- Missing types
- TS errors
- Lint warnings

---

### ✅ Task 5.7: Documentation & Export Updates

**Durum**: ⏳ Bekliyor
**Süre**: 1 saat
**Bağımlılıklar**: Tüm tasks

**Files to update**:

1. `packages/core/src/index.ts` - Export WebhookService, types
2. `packages/api/src/index.ts` - Export webhook handlers
3. `README.md` - Webhook system documentation
4. `docs/roadmap/03-phase-api-services.md` - Update progress

---

## 📦 Deliverables Summary

### 📁 New Files (15)

```
packages/core/src/webhooks/
  ├─ types.ts                    (Event, delivery types)
  ├─ service.ts                  (WebhookService class)
  ├─ queue.ts                    (PriorityQueue, processor)
  ├─ retry.ts                    (RetryManager)
  └─ __tests__/
     ├─ service.test.ts          (20+ tests)
     ├─ queue.test.ts            (10+ tests)
     └─ integration.test.ts      (5+ tests)

packages/api/src/handlers/
  ├─ webhooks.ts                 (7 handlers)
  ├─ validators/
  │  └─ webhooks.ts              (Zod schemas)
  └─ __tests__/
     └─ webhooks.test.ts         (15+ tests)

packages/adapters-db/src/migrations/
  └─ 2026_02_04_add_webhook_deliveries.ts

packages/core/src/__tests__/integration/
  └─ webhook-integration.test.ts (5+ tests)
```

### 🔧 Modified Files (6)

```
packages/adapters-db/src/schema.ts                    (+ webhookDeliveries table)
packages/core/src/content/service.ts                  (+ webhook dispatch)
packages/core/src/blueprint/service.ts                (+ webhook dispatch)
packages/api/src/routes/v1/index.ts                   (real handlers)
packages/core/src/index.ts                            (exports)
docs/roadmap/03-phase-api-services.md                (progress)
```

---

## ✅ Acceptance Criteria

### Functional Requirements

- [x] Webhooks dispatch asynchronously (non-blocking)
- [x] In-memory queue with priority support
- [x] Exponential backoff retry (1s, 2s, 4s, 8s, 16s, 32s)
- [x] Max 5 retry attempts
- [x] HMAC-SHA256 signature support
- [x] Delivery logging to database
- [x] Test webhook endpoint
- [x] Delivery history API

### Non-Functional Requirements

- [x] All tests passing (62+ tests)
- [x] Permission-based access control
- [x] Input validation (Zod schemas)
- [x] Error handling with proper HTTP status codes
- [ ] Cross-platform compatible (Bun, Node, Deno)
- [ ] 0 lint errors
- [ ] 0 TypeScript errors

---

## 🚀 Implementation Order

1. ✅ **Start with database** (Task 1.1-1.2) → Foundation
2. ✅ **Build types** (Task 1.3) → Type safety
3. ✅ **Implement service core** (Task 1.4) → Basic delivery
4. ✅ **Add queue & retry** (Task 2.1-2.3) → Async processing
5. ✅ **Create handlers** (Task 3.1-3.3) → API endpoints
6. ✅ **Integrate events** (Task 4.1-4.3) → Real usage
7. ✅ **Test everything** (Task 5.1-5.7) → Quality assurance

---

## 🎯 Key Design Decisions

### ✅ Async Background Delivery

- **Why**: Fast response times for content operations
- **Tradeoff**: Slightly more complex implementation
- **Implementation**: In-memory queue with background processor

### ✅ In-Memory Queue

- **Why**: Simple, fast, no external dependencies
- **Tradeoff**: Lost retry jobs on server restart
- **Mitigation**: Delivery logged to DB before retry, can manually retry

### ✅ No Payload Size Limit

- **Why**: Maximum flexibility for users
- **Tradeoff**: Potential abuse, large database storage
- **Mitigation**: Rate limiting per webhook (future enhancement)

### ✅ Standard MVP Scope

- **Why**: Feature-complete but not over-engineered
- **Includes**: Delivery, retry, test, logging
- **Excludes**: Batch delivery, rate limiting, templates (future)

---

## ⚠️ Risk Mitigation

| Risk                     | Probability | Impact | Mitigation                            |
| ------------------------ | ----------- | ------ | ------------------------------------- |
| Queue processor stops    | Low         | High   | Health check endpoint + auto-restart  |
| Memory leak in queue     | Low         | High   | Queue size limit + cleanup job        |
| Retry storms             | Medium      | Medium | Max concurrent jobs (10) + jitter     |
| Database bloat           | Low         | Low    | Periodic cleanup job (old deliveries) |
| Timeout on slow webhooks | High        | Low    | 30s timeout + proper error handling   |

---

## 📝 Progress Tracking

### Day 1-2: Foundation

- [x] Task 1.1: Database Schema Expansion
- [x] Task 1.2: Migration Creation
- [x] Task 1.3: Webhook Types
- [x] Task 1.4: Webhook Service Core

### Day 3: Async Queue & Retry

- [x] Task 2.1: In-Memory Delivery Queue
- [x] Task 2.2: Retry Logic with Exponential Backoff
- [x] Task 2.3: Queue Integration with WebhookService

### Day 4: API Handlers & Validation

- [x] Task 3.1: Webhook Validators
- [x] Task 3.2: Webhook Handlers
- [x] Task 3.3: Update Routes

### Day 5: Service Implementation & Event Integration

- [x] Task 4.1: WebhookService CRUD Operations
- [x] Task 4.2: Event Integration - ContentService
- [x] Task 4.3: Event Integration - BlueprintService

### Day 6: Testing & Polish

- [x] Task 5.1: WebhookService Unit Tests (31 test passing)
- [x] Task 5.2: Queue & Retry Tests (13 test passing)
- [x] Task 5.3: API Handler Tests (8 test passing)
- [x] Task 5.4: Integration Tests (10 test passing)
- [ ] Task 5.5: Cross-Platform Testing
- [ ] Task 5.6: Lint & Type Check
- [x] Task 5.7: Documentation & Export Updates

---

## 📊 Summary

**Total Tasks**: 20
**Estimated Time**: 6 gün
**Test Coverage**: 50+ test cases
**New Files**: 15
**Modified Files**: 6

---

_Last updated: 4 Şubat 2026_
_Next update: İlk task tamamlandığında_
