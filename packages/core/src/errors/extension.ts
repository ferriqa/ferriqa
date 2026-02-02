/**
 * @ferriqa/core - Extension Interface
 *
 * Interface for external transport packages
 * Allows third-party transports to integrate seamlessly
 *
 * Example external packages:
 * - @ferriqa/error-transport-db (database logging)
 * - @ferriqa/error-transport-sentry (Sentry.io integration)
 * - @ferriqa/error-transport-datadog (Datadog integration)
 * - @ferriqa/error-transport-webhook (custom webhook)
 */

import type { ErrorTransport } from "./types.ts";

/**
 * Transport factory interface
 * External packages implement this to create transports
 */
export interface TransportFactory {
  /** Transport name (must be unique) */
  readonly name: string;

  /** Transport version (semver) */
  readonly version: string;

  /**
   * Create transport instance
   * @param options - Factory-specific options
   * @returns ErrorTransport instance
   */
  create(options: Record<string, unknown>): ErrorTransport;

  /**
   * Validate options before creating transport
   * @param options - Options to validate
   * @returns Validation result
   */
  validateOptions?(options: Record<string, unknown>): {
    valid: boolean;
    errors: string[];
  };
}

/**
 * Transport package manifest
 * Must be exported from external packages
 */
export interface TransportPackageManifest {
  /** Package name */
  name: string;

  /** Package version */
  version: string;

  /** Package description */
  description: string;

  /** Factory instance */
  factory: TransportFactory;

  /** Supported runtimes */
  runtimes: ("bun" | "node" | "deno")[];

  /** Required environment variables */
  requiredEnvVars?: string[];

  /** Optional environment variables */
  optionalEnvVars?: string[];

  /** Default configuration */
  defaults?: Record<string, unknown>;
}

/**
 * Transport registry
 * Manages external transport packages
 */
export class TransportRegistry {
  private factories: Map<string, TransportFactory> = new Map();
  private manifests: Map<string, TransportPackageManifest> = new Map();

  /**
   * Register a transport factory
   * @param manifest - Transport package manifest
   */
  register(manifest: TransportPackageManifest): void {
    this.factories.set(manifest.name, manifest.factory);
    this.manifests.set(manifest.name, manifest);
  }

  /**
   * Unregister a transport
   * @param name - Transport package name
   */
  unregister(name: string): boolean {
    this.manifests.delete(name);
    return this.factories.delete(name);
  }

  /**
   * Create a transport from registered factory
   * @param name - Transport package name
   * @param options - Transport-specific options
   */
  create(name: string, options?: Record<string, unknown>): ErrorTransport {
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(
        `Transport package "${name}" not found. ` +
          `Make sure to install and register it first.`,
      );
    }

    // Validate options if validator exists
    if (factory.validateOptions) {
      const validation = factory.validateOptions(options ?? {});
      if (!validation.valid) {
        throw new Error(
          `Invalid options for transport "${name}": ${validation.errors.join(", ")}`,
        );
      }
    }

    return factory.create(options ?? {});
  }

  /**
   * Check if transport is registered
   */
  has(name: string): boolean {
    return this.factories.has(name);
  }

  /**
   * Get transport manifest
   */
  getManifest(name: string): TransportPackageManifest | undefined {
    return this.manifests.get(name);
  }

  /**
   * Get all registered transports
   */
  getAll(): TransportPackageManifest[] {
    return Array.from(this.manifests.values());
  }

  /**
   * Get available transports for current runtime
   */
  getAvailableForRuntime(
    runtime: "bun" | "node" | "deno",
  ): TransportPackageManifest[] {
    return this.getAll().filter((manifest) =>
      manifest.runtimes.includes(runtime),
    );
  }

  /**
   * Load transport from module
   * Dynamically imports and registers a transport package
   */
  async load(moduleName: string): Promise<void> {
    try {
      const module = await import(moduleName);

      if (!module.default && !module.manifest) {
        throw new Error(
          `Module "${moduleName}" does not export a manifest. ` +
            `Expected 'default' or 'manifest' export.`,
        );
      }

      const manifest: TransportPackageManifest =
        module.default ?? module.manifest;
      this.register(manifest);
    } catch (error) {
      throw new Error(
        `Failed to load transport package "${moduleName}": ${error}`,
      );
    }
  }
}

/**
 * Global transport registry instance
 */
let globalRegistry: TransportRegistry | null = null;

/**
 * Get global transport registry
 */
export function getGlobalRegistry(): TransportRegistry {
  if (!globalRegistry) {
    globalRegistry = new TransportRegistry();
  }
  return globalRegistry;
}

/**
 * Helper to create a transport factory
 * Simplifies factory creation for external packages
 */
export function createTransportFactory(config: {
  name: string;
  version: string;
  create: (options: Record<string, unknown>) => ErrorTransport;
  validateOptions?: (options: Record<string, unknown>) => {
    valid: boolean;
    errors: string[];
  };
}): TransportFactory {
  return {
    name: config.name,
    version: config.version,
    create: config.create,
    validateOptions: config.validateOptions,
  };
}

/**
 * Helper to create a transport package manifest
 */
export function createTransportManifest(config: {
  name: string;
  version: string;
  description: string;
  factory: TransportFactory;
  runtimes: ("bun" | "node" | "deno")[];
  requiredEnvVars?: string[];
  optionalEnvVars?: string[];
  defaults?: Record<string, unknown>;
}): TransportPackageManifest {
  return {
    name: config.name,
    version: config.version,
    description: config.description,
    factory: config.factory,
    runtimes: config.runtimes,
    requiredEnvVars: config.requiredEnvVars,
    optionalEnvVars: config.optionalEnvVars,
    defaults: config.defaults,
  };
}

/**
 * Convention-based transport loader
 * Loads transports based on environment variables
 *
 * Looks for:
 * - FERRIQA_ERROR_TRANSPORT_DB_ENABLED=true → loads @ferriqa/error-transport-db
 * - FERRIQA_ERROR_TRANSPORT_SENTRY_ENABLED=true → loads @ferriqa/error-transport-sentry
 */
export async function loadTransportsFromEnv(): Promise<ErrorTransport[]> {
  const transports: ErrorTransport[] = [];
  const registry = getGlobalRegistry();

  // Get environment variables (cross-runtime)
  const getEnv = (name: string): string | undefined => {
    if (typeof process !== "undefined" && process.env) {
      return process.env[name];
    }
    // @ts-ignore - Deno not available in all runtimes
    if (typeof Deno !== "undefined") {
      // @ts-ignore
      return (globalThis as any).Deno.env.get(name);
    }
    return undefined;
  };

  // Check for enabled transports
  const transportMappings: Record<string, string> = {
    FERRIQA_ERROR_TRANSPORT_DB_ENABLED: "@ferriqa/error-transport-db",
    FERRIQA_ERROR_TRANSPORT_SENTRY_ENABLED: "@ferriqa/error-transport-sentry",
    FERRIQA_ERROR_TRANSPORT_DATADOG_ENABLED: "@ferriqa/error-transport-datadog",
    FERRIQA_ERROR_TRANSPORT_WEBHOOK_ENABLED: "@ferriqa/error-transport-webhook",
  };

  for (const [envVar, packageName] of Object.entries(transportMappings)) {
    const enabled = getEnv(envVar)?.toLowerCase() === "true";
    if (enabled) {
      try {
        await registry.load(packageName);
        const transport = registry.create(packageName);
        transports.push(transport);
      } catch (error) {
        console.warn(
          `Failed to load transport "${packageName}": ${error}. ` +
            `Make sure it's installed: npm install ${packageName}`,
        );
      }
    }
  }

  return transports;
}
