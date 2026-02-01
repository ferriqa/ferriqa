/**
 * @ferriqa/core - Built-in Hook Definitions
 *
 * Predefined hook names and their context types.
 * These hooks are built into the system and triggered at specific lifecycle points.
 */

import type { HookType } from "./types.js";

/**
 * Hook definition structure
 */
export interface BuiltInHookDefinition<T = unknown> {
  name: string;
  type: HookType;
  description: string;
  contextType: T;
}

/**
 * Content lifecycle hooks
 */
export interface ContentCreateContext {
  blueprintId: number;
  slug: string;
  data: Record<string, unknown>;
  meta?: Record<string, unknown>;
  status: "draft" | "published";
  createdBy?: number;
}

export interface ContentUpdateContext {
  id: number;
  blueprintId: number;
  slug: string;
  data: Record<string, unknown>;
  meta?: Record<string, unknown>;
  status: "draft" | "published";
  updatedBy?: number;
}

export interface ContentDeleteContext {
  id: number;
  blueprintId: number;
  deletedBy?: number;
}

/**
 * Blueprint lifecycle hooks
 */
export interface BlueprintCreateContext {
  id: number;
  name: string;
  slug: string;
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    options?: Record<string, unknown>;
  }>;
  settings?: Record<string, unknown>;
}

export interface BlueprintUpdateContext {
  id: number;
  name: string;
  slug: string;
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    options?: Record<string, unknown>;
  }>;
  settings?: Record<string, unknown>;
}

export interface BlueprintDeleteContext {
  id: number;
  slug: string;
}

/**
 * Webhook lifecycle hooks
 */
export interface WebhookSendContext {
  webhookId: number;
  webhookName: string;
  url: string;
  event: string;
  payload: Record<string, unknown>;
  headers?: Record<string, string>;
  secret?: string;
}

/**
 * Built-in hook registry
 */
export const BUILT_IN_HOOKS: Record<string, BuiltInHookDefinition> = {
  // Content lifecycle hooks - Actions
  "content:afterCreate": {
    name: "content:afterCreate",
    type: "action",
    description: "Triggered after content is created",
    contextType: {} as ContentCreateContext,
  },
  "content:afterUpdate": {
    name: "content:afterUpdate",
    type: "action",
    description: "Triggered after content is updated",
    contextType: {} as ContentUpdateContext,
  },
  "content:afterDelete": {
    name: "content:afterDelete",
    type: "action",
    description: "Triggered after content is deleted",
    contextType: {} as ContentDeleteContext,
  },

  // Content lifecycle hooks - Filters
  "content:beforeCreate": {
    name: "content:beforeCreate",
    type: "filter",
    description: "Filter content data before creation",
    contextType: {} as ContentCreateContext,
  },
  "content:beforeUpdate": {
    name: "content:beforeUpdate",
    type: "filter",
    description: "Filter content data before update",
    contextType: {} as ContentUpdateContext,
  },
  "content:beforeDelete": {
    name: "content:beforeDelete",
    type: "filter",
    description: "Filter before content deletion",
    contextType: {} as ContentDeleteContext,
  },

  // Blueprint lifecycle hooks - Actions
  "blueprint:afterCreate": {
    name: "blueprint:afterCreate",
    type: "action",
    description: "Triggered after blueprint is created",
    contextType: {} as BlueprintCreateContext,
  },
  "blueprint:afterUpdate": {
    name: "blueprint:afterUpdate",
    type: "action",
    description: "Triggered after blueprint is updated",
    contextType: {} as BlueprintUpdateContext,
  },
  "blueprint:afterDelete": {
    name: "blueprint:afterDelete",
    type: "action",
    description: "Triggered after blueprint is deleted",
    contextType: {} as BlueprintDeleteContext,
  },

  // Blueprint lifecycle hooks - Filters
  "blueprint:beforeCreate": {
    name: "blueprint:beforeCreate",
    type: "filter",
    description: "Filter blueprint data before creation",
    contextType: {} as BlueprintCreateContext,
  },
  "blueprint:beforeUpdate": {
    name: "blueprint:beforeUpdate",
    type: "filter",
    description: "Filter blueprint data before update",
    contextType: {} as BlueprintUpdateContext,
  },
  "blueprint:beforeDelete": {
    name: "blueprint:beforeDelete",
    type: "filter",
    description: "Filter before blueprint deletion",
    contextType: {} as BlueprintDeleteContext,
  },

  // Webhook lifecycle hooks - Actions
  "webhook:afterSend": {
    name: "webhook:afterSend",
    type: "action",
    description: "Triggered after webhook is sent",
    contextType: {} as WebhookSendContext,
  },

  // Webhook lifecycle hooks - Filters
  "webhook:beforeSend": {
    name: "webhook:beforeSend",
    type: "filter",
    description: "Filter webhook payload before sending",
    contextType: {} as WebhookSendContext,
  },
};

/**
 * Get built-in hook definition
 */
export function getHookDefinition(
  name: string,
): BuiltInHookDefinition | undefined {
  return BUILT_IN_HOOKS[name];
}

/**
 * Check if a hook is built-in
 */
export function isBuiltInHook(name: string): boolean {
  return name in BUILT_IN_HOOKS;
}

/**
 * Get all built-in hook names
 */
export function getBuiltInHookNames(): string[] {
  return Object.keys(BUILT_IN_HOOKS);
}

/**
 * Get all built-in action hooks
 */
export function getBuiltInActionHooks(): BuiltInHookDefinition[] {
  return Object.values(BUILT_IN_HOOKS).filter((hook) => hook.type === "action");
}

/**
 * Get all built-in filter hooks
 */
export function getBuiltInFilterHooks(): BuiltInHookDefinition[] {
  return Object.values(BUILT_IN_HOOKS).filter((hook) => hook.type === "filter");
}
