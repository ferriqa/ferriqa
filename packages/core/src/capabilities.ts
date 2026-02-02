// Runtime capability detection - Feature matrix for Bun, Node.js, and Deno

// Declare optional globals for cross-runtime compatibility
declare const Buffer:
  | { from(data: string, encoding?: string): unknown }
  | undefined;
declare const require: (id: string) => any;

import { getRuntimeInfo, isBun, isDeno, isNode } from "./runtime.ts";

/**
 * Detected runtime capabilities
 */
export interface RuntimeCapabilities {
  // Core JavaScript features
  asyncAwait: boolean;
  promises: boolean;
  generators: boolean;
  asyncGenerators: boolean;

  // Web Platform APIs
  fetch: boolean;
  webCrypto: boolean;
  webStreams: boolean;
  webSockets: boolean;
  abortController: boolean;

  // File System
  fileSystem: {
    read: boolean;
    write: boolean;
    watch: boolean;
    glob: boolean;
  };

  // Networking
  http: boolean;
  https: boolean;
  http2: boolean;
  tcp: boolean;
  udp: boolean;

  // Process/System
  childProcess: boolean;
  workerThreads: boolean;
  cluster: boolean;
  osInfo: boolean;
  envVars: boolean;

  // Data formats
  json: boolean;
  base64: boolean;
  blob: boolean;
  formData: boolean;

  // Timing
  setTimeout: boolean;
  setInterval: boolean;
  performance: boolean;

  // Console/Debugging
  console: boolean;
  inspector: boolean;

  // Module system
  esm: boolean;
  cjs: boolean;
  dynamicImport: boolean;
  importMeta: boolean;

  // Testing (built-in)
  testRunner: boolean;

  // SQLite support
  sqlite: boolean;

  // Package management
  packageManager: "npm" | "yarn" | "pnpm" | "bun" | null;
}

/**
 * Runtime environment details
 */
export interface RuntimeEnvironment {
  name: string;
  version: string;
  platform: string;
  arch: string;
  os: string;
  cpuCount: number;
  totalMemory: number;
  execPath: string;
}

/**
 * Capability check result with warnings
 */
export interface CapabilityCheck {
  supported: RuntimeCapabilities;
  missing: string[];
  warnings: string[];
  recommended: string[];
}

/**
 * Minimum required capabilities for Ferriqa
 */
const MINIMUM_REQUIRED_CAPABILITIES = [
  "fetch",
  "webCrypto",
  "fileSystem.read",
  "fileSystem.write",
  "json",
  "sqlite",
  "asyncAwait",
  "esm",
] as const;

/**
 * Check if a generator function is supported
 */
function hasGeneratorSupport(): boolean {
  try {
    const gen = function* () {};
    return typeof gen === "function" && typeof gen().next === "function";
  } catch {
    return false;
  }
}

/**
 * Check if async generator is supported
 */
function hasAsyncGeneratorSupport(): boolean {
  try {
    const gen = async function* () {};
    return typeof gen === "function" && typeof gen().next === "function";
  } catch {
    return false;
  }
}

/**
 * Detect all runtime capabilities
 */
export function detectCapabilities(): RuntimeCapabilities {
  const caps: RuntimeCapabilities = {
    // Core JavaScript features (all modern runtimes support these)
    asyncAwait: true,
    promises: typeof Promise !== "undefined",
    generators: hasGeneratorSupport(),
    asyncGenerators: hasAsyncGeneratorSupport(),

    // Web Platform APIs
    fetch: typeof fetch !== "undefined",
    webCrypto:
      typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined",
    webStreams: typeof ReadableStream !== "undefined",
    webSockets: typeof WebSocket !== "undefined",
    abortController: typeof AbortController !== "undefined",

    // File System
    fileSystem: {
      read: false,
      write: false,
      watch: false,
      glob: false,
    },

    // Networking
    http: false,
    https: false,
    http2: false,
    tcp: false,
    udp: false,

    // Process/System
    childProcess: false,
    workerThreads: false,
    cluster: false,
    osInfo: false,
    envVars:
      typeof (globalThis as any).process !== "undefined" &&
      !!(globalThis as any).process?.env,

    // Data formats
    json: true,
    base64: typeof btoa !== "undefined" || typeof Buffer !== "undefined",
    blob: typeof Blob !== "undefined",
    formData: typeof FormData !== "undefined",

    // Timing
    setTimeout: typeof setTimeout !== "undefined",
    setInterval: typeof setInterval !== "undefined",
    performance: typeof performance !== "undefined" && !!performance.now,

    // Console/Debugging
    console: typeof console !== "undefined" && !!console.log,
    inspector: false,

    // Module system
    esm: true, // All modern runtimes support ESM
    cjs: typeof require !== "undefined",
    dynamicImport: true, // All modern runtimes support dynamic import
    importMeta: false, // Will be detected properly below

    // Testing
    testRunner: false,

    // SQLite
    sqlite: false,

    // Package management
    packageManager: null,
  };

  // Check for import.meta support
  try {
    caps.importMeta = typeof (globalThis as any).import?.meta !== "undefined";
  } catch {
    caps.importMeta = false;
  }

  // Runtime-specific capability detection
  if (isBun) {
    detectBunCapabilities(caps);
  } else if (isDeno) {
    detectDenoCapabilities(caps);
  } else if (isNode) {
    detectNodeCapabilities(caps);
  }

  return caps;
}

/**
 * Detect Bun-specific capabilities
 */
function detectBunCapabilities(caps: RuntimeCapabilities): void {
  // File System
  caps.fileSystem.read = true;
  caps.fileSystem.write = true;
  caps.fileSystem.watch = true;
  caps.fileSystem.glob = true;

  // Networking
  caps.http = true;
  caps.https = true;
  caps.http2 = true;
  caps.tcp = true;
  caps.udp = true;

  // Process/System
  caps.childProcess = true;
  caps.workerThreads = true;
  caps.osInfo = true;

  // Console/Debugging
  caps.inspector = true;

  // Testing
  caps.testRunner = true;

  // SQLite - Bun has built-in support
  try {
    caps.sqlite = typeof (globalThis as any).Bun?.sqlite !== "undefined";
  } catch {
    caps.sqlite = false;
  }

  // Package manager
  caps.packageManager = "bun";
}

/**
 * Detect Deno-specific capabilities
 */
function detectDenoCapabilities(caps: RuntimeCapabilities): void {
  // File System
  caps.fileSystem.read = true;
  caps.fileSystem.write = true;
  caps.fileSystem.watch = true;
  caps.fileSystem.glob = true;

  // Networking
  caps.http = true;
  caps.https = true;
  caps.http2 = true;
  caps.tcp = true;
  caps.udp = true;

  // Process/System
  caps.childProcess = true;
  caps.workerThreads = true; // Deno has Web Workers
  caps.osInfo = true;

  // Console/Debugging
  caps.inspector = true;

  // Testing
  caps.testRunner = true;

  // SQLite - Deno has native support via third-party modules
  caps.sqlite = true; // Available via deno.land/x/sqlite3

  // Package manager
  caps.packageManager = null; // Deno uses URLs
}

/**
 * Detect Node.js-specific capabilities
 */
function detectNodeCapabilities(caps: RuntimeCapabilities): void {
  // File System
  caps.fileSystem.read = true;
  caps.fileSystem.write = true;
  caps.fileSystem.watch = true;
  caps.fileSystem.glob = false; // Requires external package

  // Networking
  caps.http = true;
  caps.https = true;
  caps.http2 = true;
  caps.tcp = true;
  caps.udp = true;

  // Process/System
  caps.childProcess = true;
  caps.workerThreads = true;
  caps.cluster = true;
  caps.osInfo = true;

  // Console/Debugging
  caps.inspector = true;

  // Testing
  caps.testRunner = true; // Node 18+ has built-in test runner

  // SQLite - Node requires external packages
  caps.sqlite = true; // Available via better-sqlite3

  // Package manager detection
  caps.packageManager = detectPackageManager();
}

/**
 * Detect which package manager is being used
 */
function detectPackageManager(): "npm" | "yarn" | "pnpm" | "bun" | null {
  if (!isNode) return null;

  const gProcess = (globalThis as any).process;
  const execPath = gProcess?.env?.npm_execpath || "";
  const userAgent = gProcess?.env?.npm_config_user_agent || "";

  if (execPath.includes("bun") || userAgent.includes("bun")) {
    return "bun";
  }
  if (execPath.includes("pnpm") || userAgent.includes("pnpm")) {
    return "pnpm";
  }
  if (execPath.includes("yarn") || userAgent.includes("yarn")) {
    return "yarn";
  }
  if (execPath.includes("npm") || userAgent.includes("npm")) {
    return "npm";
  }

  return "npm"; // Default fallback
}

/**
 * Get detailed runtime environment information
 */
export function getRuntimeEnvironment(): RuntimeEnvironment {
  const info = getRuntimeInfo();

  let platform = "unknown";
  let arch = "unknown";
  let os = "unknown";
  let cpuCount = 1;
  let totalMemory = 0;
  let execPath = "";

  if (isBun) {
    const gBun = (globalThis as any).Bun;
    platform = gBun?.platform || "unknown";
    arch = gBun?.arch || "unknown";
    os = gBun?.os || "unknown";
    cpuCount = gBun?.cpus?.length || 1;
    totalMemory = gBun?.memory?.total || 0;
    execPath = gBun?.main || "";
  } else if (isDeno) {
    // @ts-ignore - Deno global available in Deno runtime
    platform = Deno?.build?.os || "unknown";
    // @ts-ignore
    arch = Deno?.build?.arch || "unknown";
    // @ts-ignore
    os = Deno?.build?.os || "unknown";
    // @ts-ignore
    cpuCount = Deno?.systemCpuInfo?.cores || 1;
    // @ts-ignore
    totalMemory = Deno?.systemMemoryInfo?.total || 0;
    // @ts-ignore
    execPath = Deno?.mainModule || "";
  } else if (isNode) {
    const gProcess = (globalThis as any).process;
    platform = gProcess?.platform;
    arch = gProcess?.arch;
    os = gProcess?.platform;
    cpuCount = require("os").cpus().length;
    totalMemory = require("os").totalmem();
    execPath = gProcess?.execPath;
  }

  return {
    name: info.name,
    version: info.version,
    platform,
    arch,
    os,
    cpuCount,
    totalMemory,
    execPath,
  };
}

/**
 * Check if all required capabilities are available
 */
export function checkRequiredCapabilities(): CapabilityCheck {
  const caps = detectCapabilities();
  const missing: string[] = [];
  const warnings: string[] = [];
  const recommended: string[] = [];

  // Check minimum required capabilities
  for (const req of MINIMUM_REQUIRED_CAPABILITIES) {
    const parts = req.split(".");
    let value: unknown = caps as unknown;

    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        value = undefined;
        break;
      }
    }

    if (!value) {
      missing.push(req);
    }
  }

  // Additional warnings
  if (!caps.webStreams) {
    warnings.push(
      "Web Streams API not available. File uploads may be limited.",
    );
  }

  if (!caps.fileSystem.watch) {
    warnings.push("File watching not available. Hot reload features disabled.");
  }

  if (!caps.testRunner) {
    warnings.push(
      "Built-in test runner not available. External test framework required.",
    );
  }

  if (!caps.workerThreads) {
    warnings.push(
      "Worker threads not available. Heavy operations may block the main thread.",
    );
  }

  // Recommendations
  if (!caps.webSockets) {
    recommended.push("WebSocket support recommended for real-time features.");
  }

  if (!caps.http2) {
    recommended.push("HTTP/2 support recommended for better performance.");
  }

  if (caps.packageManager === "npm") {
    recommended.push(
      "Consider using pnpm or bun for faster package installation.",
    );
  }

  return {
    supported: caps,
    missing,
    warnings,
    recommended,
  };
}

/**
 * Print capability report to console
 */
export function printCapabilityReport(): void {
  const env = getRuntimeEnvironment();
  const check = checkRequiredCapabilities();

  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║         FERRIQA RUNTIME CAPABILITY REPORT              ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // Runtime info
  console.log("📊 Runtime Environment");
  console.log("   Name:          ", env.name);
  console.log("   Version:       ", env.version);
  console.log("   Platform:      ", env.platform);
  console.log("   Architecture:  ", env.arch);
  console.log("   OS:            ", env.os);
  console.log("   CPU Count:     ", env.cpuCount);
  console.log("   Memory:        ", formatBytes(env.totalMemory));
  console.log("   Package Mgr:   ", check.supported.packageManager || "N/A");
  console.log("");

  // Capabilities
  console.log("✅ Capabilities");
  console.log(
    "   Web APIs:      ",
    formatFeatureList({
      Fetch: check.supported.fetch,
      "Web Crypto": check.supported.webCrypto,
      "Web Streams": check.supported.webStreams,
      WebSockets: check.supported.webSockets,
    }),
  );
  console.log(
    "   File System:   ",
    formatFeatureList({
      Read: check.supported.fileSystem.read,
      Write: check.supported.fileSystem.write,
      Watch: check.supported.fileSystem.watch,
      Glob: check.supported.fileSystem.glob,
    }),
  );
  console.log(
    "   Database:      ",
    formatFeatureList({
      SQLite: check.supported.sqlite,
    }),
  );
  console.log(
    "   Testing:       ",
    formatFeatureList({
      "Test Runner": check.supported.testRunner,
    }),
  );
  console.log("");

  // Missing
  if (check.missing.length > 0) {
    console.log("❌ Missing Required Capabilities");
    for (const m of check.missing) {
      console.log("   •", m);
    }
    console.log("");
  }

  // Warnings
  if (check.warnings.length > 0) {
    console.log("⚠️  Warnings");
    for (const w of check.warnings) {
      console.log("   •", w);
    }
    console.log("");
  }

  // Recommendations
  if (check.recommended.length > 0) {
    console.log("💡 Recommendations");
    for (const r of check.recommended) {
      console.log("   •", r);
    }
    console.log("");
  }

  // Status
  if (check.missing.length === 0) {
    console.log("✨ All required capabilities are available!\n");
  } else {
    console.log("⛔ Runtime does not meet minimum requirements\n");
    console.log("   Ferriqa requires the following missing capabilities:");
    for (const m of check.missing) {
      console.log("     -", m);
    }
    console.log("");
  }

  console.log("═════════════════════════════════════════════════════════\n");
}

/**
 * Format a feature list for display
 */
function formatFeatureList(features: Record<string, boolean>): string {
  return Object.entries(features)
    .map(([name, supported]) => (supported ? "✓" : "✗") + " " + name)
    .join(", ");
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Validate runtime meets minimum requirements
 * Throws error if requirements not met
 */
export function validateRuntime(): void {
  const check = checkRequiredCapabilities();

  if (check.missing.length > 0) {
    throw new Error(
      `Runtime validation failed. Missing required capabilities: ${check.missing.join(", ")}`,
    );
  }
}

/**
 * Get capability summary for logging/debugging
 */
export function getCapabilitySummary(): string {
  const env = getRuntimeEnvironment();
  const caps = detectCapabilities();

  return [
    `${env.name} ${env.version}`,
    `Platform: ${env.platform} (${env.arch})`,
    `SQLite: ${caps.sqlite ? "✓" : "✗"}`,
    `Fetch: ${caps.fetch ? "✓" : "✗"}`,
    `Crypto: ${caps.webCrypto ? "✓" : "✗"}`,
    `FS: ${caps.fileSystem.read && caps.fileSystem.write ? "✓" : "✗"}`,
    `Test: ${caps.testRunner ? "✓" : "✗"}`,
  ].join(" | ");
}
