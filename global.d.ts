// Global type declarations for Deno runtime
// Bun types provided by 'bun-types' package in tsconfig.json

declare global {
  // ============================================
  // Deno Runtime Types (not available via npm)
  // ============================================
  var Deno:
    | {
        version: {
          deno: string;
          v8: string;
          typescript: string;
        };
        build: {
          os: "darwin" | "linux" | "windows";
          arch: "x86_64" | "aarch64";
        };
        systemCpuInfo: {
          cores: number;
        };
        systemMemoryInfo: {
          total: number;
          free?: number;
          available?: number;
          buffers?: number;
          cached?: number;
          swapTotal?: number;
          swapFree?: number;
        };
        mainModule: string;
        env: {
          get(name: string): string | undefined;
          set(name: string, value: string): void;
          delete(name: string): void;
          toObject(): Record<string, string>;
        };
        readFile(path: string): Promise<Uint8Array>;
        writeFile(path: string, data: Uint8Array): Promise<void>;
        remove(path: string): Promise<void>;
        mkdir(path: string): Promise<void>;
        watchFs(paths: string | string[]): AsyncIterable<unknown>;
        serve(options: unknown): unknown;
        test(name: string, fn: () => Promise<void> | void): void;
      }
    | undefined;
}

// Ensure this is treated as a module
export {};
