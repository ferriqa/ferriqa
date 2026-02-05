/**
 * @ferriqa/core - Built-in Hook Definitions
 *
 * Predefined hook names and their context types.
 * These hooks are built into the system and triggered at specific lifecycle points.
 */

import type { HookType } from "./types.ts";

import type { Blueprint } from "../blueprint/types.ts";
import type { Content } from "../content/types.ts";

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
export interface HookContentCreateContext {
  blueprint: Blueprint;
  data: Record<string, unknown>;
  userId?: string;
  // Metadata can be injected by hooks
  meta?: Record<string, unknown>;
}

export interface HookContentUpdateContext {
  content: Content;
  blueprint: Blueprint;
  data: Record<string, unknown>;
  userId?: string;
}

export interface HookContentDeleteContext {
  content: Content;
  blueprint: Blueprint;
  userId?: string;
}

export interface HookContentGetContext {
  content: Content;
  blueprint: Blueprint;
}

export interface HookContentPublishContext {
  content: Content;
  userId?: string;
  blueprint?: Blueprint; // Frequently needed in webhooks/plugins
}

/**
 * Blueprint lifecycle hooks
 */
export interface HookBlueprintCreateContext {
  blueprint: Blueprint;
  userId?: string;
}

export interface HookBlueprintUpdateContext {
  blueprint: Blueprint;
  userId?: string;
}

export interface HookBlueprintDeleteContext {
  id: string;
  slug: string;
  userId?: string;
}

/**
 * Webhook lifecycle hooks
 */
export interface HookWebhookSendContext {
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
    contextType: {} as HookContentCreateContext,
  },
  "content:afterUpdate": {
    name: "content:afterUpdate",
    type: "action",
    description: "Triggered after content is updated",
    contextType: {} as HookContentUpdateContext,
  },
  "content:afterDelete": {
    name: "content:afterDelete",
    type: "action",
    description: "Triggered after content is deleted",
    contextType: {} as HookContentDeleteContext,
  },
  "content:afterGet": {
    name: "content:afterGet",
    type: "action",
    description: "Triggered after content is retrieved",
    contextType: {} as HookContentGetContext,
  },
  "content:afterPublish": {
    name: "content:afterPublish",
    type: "action",
    description: "Triggered after content is published",
    contextType: {} as HookContentPublishContext,
  },
  "content:afterUnpublish": {
    name: "content:afterUnpublish",
    type: "action",
    description: "Triggered after content is unpublished",
    contextType: {} as HookContentPublishContext,
  },

  // Content lifecycle hooks - Filters
  "content:beforeCreate": {
    name: "content:beforeCreate",
    type: "filter",
    description: "Filter content data before creation",
    contextType: {} as HookContentCreateContext,
  },
  "content:beforeUpdate": {
    name: "content:beforeUpdate",
    type: "filter",
    description: "Filter content data before update",
    contextType: {} as HookContentUpdateContext,
  },
  "content:beforeDelete": {
    name: "content:beforeDelete",
    type: "filter",
    description: "Filter before content deletion",
    contextType: {} as HookContentDeleteContext,
  },
  "content:beforePublish": {
    name: "content:beforePublish",
    type: "filter",
    description: "Filter before content is published",
    contextType: {} as HookContentPublishContext,
  },
  "content:beforeUnpublish": {
    name: "content:beforeUnpublish",
    type: "filter",
    description: "Filter before content is unpublished",
    contextType: {} as HookContentPublishContext,
  },

  // Blueprint lifecycle hooks - Actions
  "blueprint:afterCreate": {
    name: "blueprint:afterCreate",
    type: "action",
    description: "Triggered after blueprint is created",
    contextType: {} as HookBlueprintCreateContext,
  },
  "blueprint:afterUpdate": {
    name: "blueprint:afterUpdate",
    type: "action",
    description: "Triggered after blueprint is updated",
    contextType: {} as HookBlueprintUpdateContext,
  },
  "blueprint:afterDelete": {
    name: "blueprint:afterDelete",
    type: "action",
    description: "Triggered after blueprint is deleted",
    contextType: {} as HookBlueprintDeleteContext,
  },

  // Blueprint lifecycle hooks - Filters
  "blueprint:beforeCreate": {
    name: "blueprint:beforeCreate",
    type: "filter",
    description: "Filter blueprint data before creation",
    contextType: {} as HookBlueprintCreateContext,
  },
  "blueprint:beforeUpdate": {
    name: "blueprint:beforeUpdate",
    type: "filter",
    description: "Filter blueprint data before update",
    contextType: {} as HookBlueprintUpdateContext,
  },
  "blueprint:beforeDelete": {
    name: "blueprint:beforeDelete",
    type: "filter",
    description: "Filter before blueprint deletion",
    contextType: {} as HookBlueprintDeleteContext,
  },

  // Webhook lifecycle hooks - Actions
  "webhook:afterSend": {
    name: "webhook:afterSend",
    type: "action",
    description: "Triggered after webhook is sent",
    contextType: {} as HookWebhookSendContext,
  },

  // Webhook lifecycle hooks - Filters
  "webhook:beforeSend": {
    name: "webhook:beforeSend",
    type: "filter",
    description: "Filter webhook payload before sending",
    contextType: {} as HookWebhookSendContext,
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
