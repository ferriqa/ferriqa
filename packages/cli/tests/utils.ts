/**
 * @ferriqa/cli - Cross-Runtime Test Utilities
 *
 * Shared test utilities and mocks for CLI integration tests.
 * Works with Bun, Node.js, and Deno runtimes.
 */

import { isDeno, isBun } from "@ferriqa/core/runtime";

export interface MockFilesystem {
  root: string;
  files: Map<string, string>;
  directories: Set<string>;
}

export interface TestContext {
  cwd: string;
  verbose: boolean;
  configPath?: string;
  filesystem: MockFilesystem;
}

// File system operations interface
interface FileSystemOperations {
  mkdtemp(prefix: string): Promise<string>;
  mkdir(path: string): Promise<void>;
  writeFile(path: string, content: string): Promise<void>;
  readFile(path: string): Promise<string | Uint8Array>;
  rm(
    path: string,
    options?: { recursive?: boolean; force?: boolean },
  ): Promise<void>;
  stat(
    path: string,
  ): Promise<{ isDirectory(): boolean; isFile(): boolean } | null>;
  readdir(path: string): Promise<string[]>;
}

// Path operations interface
interface PathOperations {
  join(...segments: string[]): string;
  basename(path: string): string;
  dirname(path: string): string;
}

// Type-safe access to Deno global - use interface matching actual Deno API
interface DenoGlobal {
  env: {
    get(name: string): string | undefined;
  };
  makeTempDir(options?: { prefix?: string }): Promise<string>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  writeTextFile(path: string, content: string): Promise<void>;
  readTextFile(path: string): Promise<string>;
  remove(path: string, options?: { recursive?: boolean }): Promise<void>;
  stat(path: string): Promise<DenoFileInfo>;
  readDir(path: string): AsyncIterable<{ name: string }>;
  cwd(): string;
}

// Deno's FileInfo has properties, not methods
interface DenoFileInfo {
  isDirectory: boolean;
  isFile: boolean;
}

/**
 * Get temp directory path based on runtime
 */
function getTempDir(): string {
  if (isDeno) {
    // Use unknown assertion to bypass type checking for runtime-specific globals
    const deno = (globalThis as unknown as { Deno: DenoGlobal }).Deno;
    return deno.env.get("TMPDIR") || deno.env.get("TMP") || "/tmp";
  }
  if (isBun) {
    return (
      (globalThis as { Bun?: { env?: { TMPDIR?: string } } }).Bun?.env
        ?.TMPDIR || "/tmp"
    );
  }
  // Node.js
  return (
    (globalThis as { process?: { env?: { TMPDIR?: string } } }).process?.env
      ?.TMPDIR || "/tmp"
  );
}

/**
 * Cross-runtime file system utilities
 */
async function crossFs(): Promise<FileSystemOperations> {
  if (isDeno) {
    const deno = (globalThis as unknown as { Deno: DenoGlobal }).Deno;
    return {
      mkdtemp: async (prefix: string) => {
        const dir = await deno.makeTempDir({ prefix });
        return dir;
      },
      mkdir: async (path: string) => {
        await deno.mkdir(path, { recursive: true });
      },
      writeFile: async (path: string, content: string) => {
        await deno.writeTextFile(path, content);
      },
      readFile: async (path: string) => {
        return await deno.readTextFile(path);
      },
      rm: async (
        path: string,
        options?: { recursive?: boolean; force?: boolean },
      ) => {
        try {
          await deno.remove(path, { recursive: options?.recursive ?? true });
        } catch {
          // Ignore errors
        }
      },
      stat: async (path: string) => {
        try {
          const info = await deno.stat(path);
          // Convert Deno's FileInfo (with boolean properties) to method-based interface
          return {
            isDirectory: () => info.isDirectory,
            isFile: () => info.isFile,
          };
        } catch {
          return null;
        }
      },
      readdir: async (path: string) => {
        const entries: string[] = [];
        for await (const entry of deno.readDir(path)) {
          entries.push(entry.name);
        }
        return entries;
      },
    };
  }

  // Node.js and Bun - use node:fs/promises
  const fs = await import("node:fs/promises");
  return {
    mkdtemp: fs.mkdtemp,
    mkdir: fs.mkdir,
    writeFile: fs.writeFile,
    readFile: fs.readFile,
    rm: async (
      path: string,
      options?: { recursive?: boolean; force?: boolean },
    ) => {
      try {
        await fs.rm(path, {
          recursive: options?.recursive ?? true,
          force: options?.force ?? true,
        });
      } catch {
        // Ignore errors
      }
    },
    stat: async (path: string) => {
      try {
        return await fs.stat(path);
      } catch {
        return null;
      }
    },
    readdir: fs.readdir,
  };
}

/**
 * Cross-runtime path utilities
 */
async function crossPath(): Promise<PathOperations> {
  if (isDeno) {
    return {
      join: (...segments: string[]) => segments.join("/").replace(/\/+/g, "/"),
      basename: (path: string) => path.split("/").pop() || "",
      dirname: (path: string) => path.split("/").slice(0, -1).join("/") || ".",
    };
  }

  // Use node:path for Node.js and Bun
  const path = await import("node:path");
  return (path.default || path) as PathOperations;
}

/**
 * Create a temporary test directory
 */
export async function createTempDir(): Promise<string> {
  const fs = await crossFs();
  const tmpDir = getTempDir();
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const path = await crossPath();
  const tempDir = path.join(tmpDir, `ferriqa-cli-test-${uniqueId}`);
  await fs.mkdir(tempDir);
  return tempDir;
}

/**
 * Clean up test directory
 */
export async function cleanupTempDir(dir: string): Promise<void> {
  const fs = await crossFs();
  await fs.rm(dir, { recursive: true, force: true });
}

/**
 * Create a mock filesystem for testing
 */
export async function createMockFilesystem(
  initialFiles: Record<string, string> = {},
): Promise<MockFilesystem> {
  const root = await createTempDir();
  const filesystem: MockFilesystem = {
    root,
    files: new Map(),
    directories: new Set([root]),
  };

  // Create initial files
  for (const [relativePath, content] of Object.entries(initialFiles)) {
    await mockWriteFile(filesystem, relativePath, content);
  }

  return filesystem;
}

/**
 * Mock write file operation
 */
export async function mockWriteFile(
  fs: MockFilesystem,
  relativePath: string,
  content: string,
): Promise<void> {
  const path = await crossPath();
  const fullPath = path.join(fs.root, relativePath);
  const dir = path.dirname(fullPath);

  // Ensure directory exists
  if (dir && dir !== "." && !fs.directories.has(dir)) {
    await mockMkdir(fs, dir.replace(fs.root, "").replace(/^\//, ""));
  }

  // Write to real filesystem for integration testing
  const fsOps = await crossFs();
  await fsOps.writeFile(fullPath, content);
  fs.files.set(relativePath, content);
}

/**
 * Mock mkdir operation
 */
export async function mockMkdir(
  fs: MockFilesystem,
  relativePath: string,
): Promise<void> {
  const path = await crossPath();
  const fullPath = path.join(fs.root, relativePath);
  const fsOps = await crossFs();
  await fsOps.mkdir(fullPath);
  fs.directories.add(fullPath);
}

/**
 * Mock read file operation
 */
export async function mockReadFile(
  fs: MockFilesystem,
  relativePath: string,
): Promise<string> {
  const path = await crossPath();
  const fullPath = path.join(fs.root, relativePath);

  if (fs.files.has(relativePath)) {
    return fs.files.get(relativePath)!;
  }

  // Try reading from real filesystem
  const fsOps = await crossFs();
  const content = await fsOps.readFile(fullPath);
  const contentStr =
    typeof content === "string" ? content : new TextDecoder().decode(content);
  fs.files.set(relativePath, contentStr);
  return contentStr;
}

/**
 * Mock file exists check
 */
export async function mockFileExists(
  fs: MockFilesystem,
  relativePath: string,
): Promise<boolean> {
  const path = await crossPath();
  const fullPath = path.join(fs.root, relativePath);

  if (fs.files.has(relativePath) || fs.directories.has(fullPath)) {
    return true;
  }

  // Check real filesystem
  const fsOps = await crossFs();
  const stat = await fsOps.stat(fullPath);
  return stat !== null;
}

/**
 * Create a test context with mocked filesystem
 */
export async function createTestContext(
  initialFiles: Record<string, string> = {},
): Promise<TestContext> {
  const filesystem = await createMockFilesystem(initialFiles);

  return {
    cwd: filesystem.root,
    verbose: false,
    filesystem,
  };
}

/**
 * Clean up test context
 */
export async function cleanupTestContext(context: TestContext): Promise<void> {
  await cleanupTempDir(context.filesystem.root);
}

/**
 * Assert file exists and has expected content
 */
export async function assertFileExists(
  context: TestContext,
  relativePath: string,
): Promise<void> {
  const exists = await mockFileExists(context.filesystem, relativePath);
  if (!exists) {
    throw new Error(`Expected file to exist: ${relativePath}`);
  }
}

/**
 * Assert file contains expected content
 */
export async function assertFileContains(
  context: TestContext,
  relativePath: string,
  expectedContent: string,
): Promise<void> {
  const content = await mockReadFile(context.filesystem, relativePath);
  if (!content.includes(expectedContent)) {
    throw new Error(
      `Expected file ${relativePath} to contain "${expectedContent}"`,
    );
  }
}

/**
 * Assert file matches expected JSON
 */
export async function assertJsonFileEquals(
  context: TestContext,
  relativePath: string,
  expected: unknown,
): Promise<void> {
  const content = await mockReadFile(context.filesystem, relativePath);
  const parsed = JSON.parse(content);

  if (JSON.stringify(parsed) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected ${relativePath} to equal ${JSON.stringify(expected)}, got ${JSON.stringify(parsed)}`,
    );
  }
}

/**
 * Get current working directory - cross-runtime
 */
export function getCwd(): string {
  if (isDeno) {
    return (globalThis as unknown as { Deno: DenoGlobal }).Deno.cwd();
  }
  if (isBun) {
    return (
      (globalThis as { process?: { cwd(): string } }).process?.cwd() || "/"
    );
  }
  // Node.js
  return (globalThis as { process?: { cwd(): string } }).process?.cwd() || "/";
}

/**
 * Export crossFs for use in tests
 */
export { crossFs };
