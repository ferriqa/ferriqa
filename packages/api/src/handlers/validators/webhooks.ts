/**
 * Webhook Validators
 *
 * Zod schemas for webhook request validation
 */

import { z } from "zod";

export const WebhookCreateSchema = z.object({
  name: z.string().min(1).max(255),
  url: z
    .string()
    .url()
    .refine((val: string) => val.startsWith("https://"), {
      message: "Webhook URLs must use HTTPS for security",
    }),
  events: z
    .array(
      z.enum([
        "content.created",
        "content.updated",
        "content.deleted",
        "content.published",
        "content.unpublished",
        "blueprint.created",
        "blueprint.updated",
        "blueprint.deleted",
        "media.uploaded",
        "media.deleted",
      ]),
    )
    .min(1),
  headers: z.record(z.string(), z.string()).optional(),
  secret: z.string().min(16).max(255).trim().optional(),
  isActive: z.boolean().optional().default(true),
});

export const WebhookUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  url: z
    .string()
    .url()
    .refine((val: string) => val.startsWith("https://"), {
      message: "Webhook URLs must use HTTPS for security",
    })
    .optional(),
  events: z
    .array(
      z.enum([
        "content.created",
        "content.updated",
        "content.deleted",
        "content.published",
        "content.unpublished",
        "blueprint.created",
        "blueprint.updated",
        "blueprint.deleted",
        "media.uploaded",
        "media.deleted",
      ]),
    )
    .min(1)
    .optional(),
  headers: z.record(z.string(), z.string()).optional(),
  secret: z.string().min(16).max(255).trim().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const WebhookTestSchema = z.object({
  event: z.enum([
    "content.created",
    "content.updated",
    "content.deleted",
    "content.published",
    "content.unpublished",
    "blueprint.created",
    "blueprint.updated",
    "blueprint.deleted",
    "media.uploaded",
    "media.deleted",
  ]),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const WebhookQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  event: z.string().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val: string | undefined) => {
      if (val === undefined || val === "") return undefined;
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    })
    .optional(),
});

export const WebhookDeliveryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
});
