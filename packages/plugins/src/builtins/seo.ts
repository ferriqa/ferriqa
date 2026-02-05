/**
 * @ferriqa/builtin-seo - SEO Plugin
 */

import { z } from "zod";
import {
  type FerriqaPlugin,
  type PluginContext,
  type HookBlueprintCreateContext,
  type HookContentGetContext,
} from "../../../core/src/index.ts";

export interface SEOConfig {
  defaultTitle?: string;
  titleTemplate?: string;
}

export const SEOConfigSchema = z.object({
  defaultTitle: z.string().optional(),
  titleTemplate: z.string().optional(),
});

// Track unsubscribers to clean up on disable
let hookUnsubs: Array<() => void> = [];

export const seoPlugin: FerriqaPlugin<SEOConfig> = {
  manifest: {
    id: "seo",
    name: "SEO Optimization",
    version: "1.0.0",
    description:
      "Adds SEO fields and meta tag generation capabilities to content.",
    configSchema: SEOConfigSchema,
  },

  async init(context: PluginContext<SEOConfig>) {
    context.logger.info("Initializing SEO Plugin...");

    const { defaultTitle } = context.config;
    if (defaultTitle) {
      context.logger.debug(`Using default SEO title: ${defaultTitle}`);
    }

    // Hook into blueprint creation to inject SEO fields
    const unsubBeforeCreate = context.hooks.on(
      "blueprint:beforeCreate",
      ({ blueprint }: HookBlueprintCreateContext) => {
        context.logger.debug(
          `Adding SEO fields to blueprint: ${blueprint.name}`,
        );

        blueprint.fields.push({
          id: crypto.randomUUID(),
          name: "Meta Title",
          key: "meta_title",
          type: "text",
          required: false,
          ui: { group: "SEO", width: "full" },
        });

        blueprint.fields.push({
          id: crypto.randomUUID(),
          name: "Meta Description",
          key: "meta_description",
          type: "textarea",
          required: false,
          ui: { group: "SEO", width: "full" },
        });
      },
    );

    // Hook into content after retrieval to inject SEO meta object
    const unsubAfterGet = context.hooks.on(
      "content:afterGet",
      ({ content, blueprint }: HookContentGetContext) => {
        content.data.seo = {
          title:
            content.data.meta_title || content.data.title || blueprint.name,
          description: content.data.meta_description || "",
        };
      },
    );

    hookUnsubs.push(unsubBeforeCreate, unsubAfterGet);
  },

  enable(context: PluginContext<SEOConfig>) {
    context.logger.info("SEO Plugin Enabled.");
  },

  reconfigure(context: PluginContext<SEOConfig>) {
    context.logger.info("SEO Plugin Reconfigured.");
    if (context.config.titleTemplate) {
      context.logger.debug(
        `New title template: ${context.config.titleTemplate}`,
      );
    }
  },

  disable(context: PluginContext<SEOConfig>) {
    context.logger.info("Cleaning up SEO Plugin hooks...");
    hookUnsubs.forEach((unsub) => unsub());
    hookUnsubs = [];
    context.logger.info("SEO Plugin Disabled.");
  },
};
