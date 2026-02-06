/**
 * @ferriqa/cli - Dev Command
 *
 * Starts the development server with hot reload.
 */

import * as p from "@clack/prompts";
import pc from "picocolors";
import { spawn } from "node:child_process";
import { watch, type FSWatcher } from "node:fs";
import { join } from "node:path";
import type { CLIContext } from "../index.ts";

interface DevOptions {
  port?: number;
  host?: string;
  watch?: boolean;
}

export async function devCommand(
  args: string[],
  context: CLIContext,
): Promise<void> {
  const portFlag = args.find(
    (arg) => arg.startsWith("--port=") || arg.startsWith("-p="),
  );
  const port = portFlag ? parseInt(portFlag.split("=")[1], 10) : undefined;

  const hostFlag = args.find(
    (arg) => arg.startsWith("--host=") || arg.startsWith("-h="),
  );
  const host = hostFlag ? hostFlag.split("=")[1] : "localhost";

  const noWatch = args.includes("--no-watch");

  p.log.step(pc.cyan("Starting development server..."));

  // Check for ferriqa.config.ts
  const configPath = join(context.cwd, "ferriqa.config.ts");
  const configExists = await fileExists(configPath);

  if (!configExists) {
    p.log.error(pc.red("No ferriqa.config.ts found in current directory"));
    p.log.info(pc.dim("Run 'ferriqa init' to create a new project"));
    process.exit(1);
  }

  const options: DevOptions = {
    port,
    host,
    watch: !noWatch,
  };

  await startDevServer(options, context);
}

async function startDevServer(
  options: DevOptions,
  context: CLIContext,
): Promise<void> {
  const {
    port = 3000,
    host = "localhost",
    watch: shouldWatch = true,
  } = options;

  p.log.info(pc.dim(`Server will start on http://${host}:${port}`));

  if (shouldWatch) {
    p.log.info(pc.dim("Hot reload enabled - watching for changes..."));
  }

  // Check if bun is available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isBun = typeof (globalThis as any).Bun !== "undefined";

  if (!isBun) {
    p.log.warn(
      pc.yellow("⚠️  Warning: Bun not detected. Falling back to Node.js"),
    );
    p.log.info(pc.dim("Install Bun for better performance: https://bun.sh"));
  }

  // Start the server process
  const entryPoint = join(context.cwd, "src", "index.ts");
  const entryExists = await fileExists(entryPoint);

  if (!entryExists) {
    p.log.error(pc.red(`Entry point not found: ${entryPoint}`));
    p.log.info(pc.dim("Make sure you have src/index.ts in your project"));
    process.exit(1);
  }

  let serverProcess: ReturnType<typeof spawn> | null = null;
  let restartCount = 0;

  const startServer = () => {
    if (serverProcess) {
      serverProcess.kill();
    }

    restartCount++;
    if (restartCount > 1) {
      p.log.info(
        pc.yellow(`🔄 Restarting server (attempt ${restartCount})...`),
      );
    }

    const cmd = isBun ? "bun" : "node";
    const cmdArgs = isBun
      ? ["--watch", entryPoint]
      : ["--watch", "--import=tsx", entryPoint];

    serverProcess = spawn(cmd, cmdArgs, {
      cwd: context.cwd,
      stdio: "inherit",
      env: {
        ...process.env,
        PORT: String(port),
        HOST: host,
        NODE_ENV: "development",
      },
    });

    serverProcess.on("error", (error) => {
      p.log.error(pc.red(`Server error: ${error.message}`));
    });

    serverProcess.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        p.log.error(pc.red(`Server exited with code ${code}`));
      }
    });
  };

  // Initial start
  startServer();

  // Setup file watcher for non-bun environments
  if (watch && !isBun) {
    const watcher: FSWatcher = watch(
      join(context.cwd, "src"),
      { recursive: true },
      (eventType: string, filename: string | null) => {
        if (typeof filename === "string" && filename.endsWith(".ts")) {
          p.log.info(pc.dim(`File changed: ${filename}`));
          // Node.js --watch handles this automatically
        }
      },
    );

    // Cleanup on exit
    process.on("SIGINT", () => {
      p.log.info(pc.yellow("\n👋 Shutting down..."));
      watcher.close();
      if (serverProcess) {
        serverProcess.kill();
      }
      process.exit(0);
    });
  }

  // Keep the process running until SIGINT
  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      p.log.info(pc.yellow("\n👋 Shutting down..."));
      if (serverProcess) {
        serverProcess.kill();
      }
      resolve();
    });
  });
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const { stat } = await import("node:fs/promises");
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
