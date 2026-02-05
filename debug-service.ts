import { WebhookService } from "./packages/core/src/webhooks/service.ts";

// Simple mock db
const mockDb = {
  name: "mock",
  runtime: "node" as const,
  config: { path: ":memory:" },
  async connect() {},
  async close() {},
  isConnected() {
    return true;
  },
  async getVersion() {
    return "1.0.0";
  },
  async pragma<T>() {
    return undefined as T;
  },
  async batch<_T>() {
    return [];
  },
  async beginTransaction() {
    return {
      query: async () => ({ rows: [], rowCount: 0 }),
      execute: async () => ({ changes: 0 }),
      commit: async () => {},
      rollback: async () => {},
    };
  },
  async transaction<_T>(callback: any) {
    return callback(await this.beginTransaction());
  },
  async execute() {
    return { changes: 1, lastInsertId: 1 };
  },
  async query() {
    return { rows: [], rowCount: 0 };
  },
};

// Simple mock hooks
const mockHooks = {
  on: () => {},
  off: () => {},
  emit: async () => ({ success: true, executed: 0, errors: [] }),
  filter: async (data: any) => ({ success: true, data, errors: [] }),
  clear: () => {},
};

try {
  console.log("Creating WebhookService...");
  const service = new WebhookService({
    db: mockDb as any,
    hookRegistry: mockHooks as any,
  });
  console.log("Service created successfully!");
  console.log("Service type:", typeof service);
  console.log("Service methods:", Object.keys(service));
  service.destroy();
} catch (error) {
  console.error("Error creating service:", error);
}
