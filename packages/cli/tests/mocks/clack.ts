/**
 * @ferriqa/cli - Clack Mocks
 *
 * Mock implementations for @clack/prompts to enable non-interactive testing.
 */

import type * as p from "@clack/prompts";

export interface PromptMock {
  type: string;
  response: unknown;
}

class PromptMockQueue {
  private mocks: PromptMock[] = [];

  push(mock: PromptMock): void {
    this.mocks.push(mock);
  }

  pop(type: string): unknown {
    const index = this.mocks.findIndex((m) => m.type === type);
    if (index === -1) {
      throw new Error(`No mock found for prompt type: ${type}`);
    }
    const mock = this.mocks[index];
    this.mocks.splice(index, 1);
    return mock.response;
  }

  clear(): void {
    this.mocks = [];
  }

  isEmpty(): boolean {
    return this.mocks.length === 0;
  }
}

const mockQueue = new PromptMockQueue();

/**
 * Mock a prompt response
 */
export function mockPrompt(type: string, response: unknown): void {
  mockQueue.push({ type, response });
}

/**
 * Mock multiple prompts in sequence
 */
export function mockPrompts(
  mocks: Array<{ type: string; response: unknown }>,
): void {
  mocks.forEach((mock) => mockQueue.push(mock));
}

/**
 * Clear all mocks
 */
export function clearPromptMocks(): void {
  mockQueue.clear();
}

/**
 * Create mocked version of clack prompts
 */
export function createMockedClack(): typeof p {
  return {
    text: async (opts: any) => {
      const response = mockQueue.pop("text");
      if (typeof response === "symbol") {
        return response;
      }

      // Validate if needed
      if (opts.validate && typeof response === "string") {
        const error = opts.validate(response);
        if (error) {
          throw new Error(`Validation failed: ${error}`);
        }
      }

      return response;
    },

    select: async (_opts: any) => {
      const response = mockQueue.pop("select");
      if (typeof response === "symbol") {
        return response;
      }
      return response;
    },

    multiselect: async (_opts: any) => {
      const response = mockQueue.pop("multiselect");
      if (typeof response === "symbol") {
        return response;
      }
      return response;
    },

    confirm: async (_opts: any) => {
      const response = mockQueue.pop("confirm");
      if (typeof response === "symbol") {
        return response;
      }
      return response;
    },

    spinner: () => ({
      start: () => {},
      stop: () => {},
      message: () => {},
    }),

    log: {
      step: () => {},
      success: () => {},
      error: () => {},
      warn: () => {},
      info: () => {},
      message: () => {},
    },

    intro: () => {},
    outro: () => {},
    cancel: () => {},
    isCancel: (value: unknown): value is symbol => {
      return typeof value === "symbol";
    },

    group: async (prompts: any, _opts: any) => {
      const results: Record<string, unknown> = {};
      for (const [key, prompt] of Object.entries(prompts)) {
        results[key] = await (prompt as any)();
      }
      return results;
    },

    note: () => {},

    groupMultiselect: async () => ({}),
    password: async () => "",
    selectKey: async () => "",
    tasks: async () => [],
  } as unknown as typeof p;
}

/**
 * Predefined mock responses for common scenarios
 */
export const mockResponses = {
  init: {
    basic: [
      { type: "text", response: "test-project" },
      { type: "select", response: "basic" },
      { type: "select", response: "sqlite" },
      { type: "multiselect", response: [] },
      { type: "text", response: "3000" },
    ],
    blog: [
      { type: "text", response: "blog-project" },
      { type: "select", response: "blog" },
      { type: "select", response: "postgresql" },
      { type: "multiselect", response: ["auth", "media"] },
      { type: "text", response: "3000" },
    ],
    ecommerce: [
      { type: "text", response: "shop-project" },
      { type: "select", response: "ecommerce" },
      { type: "select", response: "sqlite" },
      { type: "multiselect", response: ["auth", "media", "webhooks"] },
      { type: "text", response: "8080" },
    ],
  },

  blueprint: {
    create: [
      { type: "text", response: "Test Blueprint" },
      { type: "text", response: "test-blueprint" },
      { type: "text", response: "A test blueprint" },
      { type: "text", response: "Title" },
      { type: "text", response: "title" },
      { type: "select", response: "text" },
      { type: "confirm", response: true },
      { type: "confirm", response: false },
      { type: "confirm", response: false },
    ],
    delete: [{ type: "confirm", response: true }],
  },

  plugin: {
    add: [{ type: "multiselect", response: ["seo", "analytics"] }],
    remove: [{ type: "confirm", response: true }],
    create: [{ type: "text", response: "My Custom Plugin" }],
  },

  db: {
    rollback: [{ type: "confirm", response: true }],
    reset: [
      { type: "confirm", response: true },
      { type: "text", response: "test-project" },
    ],
    createMigration: [{ type: "text", response: "add_users_table" }],
  },
};
