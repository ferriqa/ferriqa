import { createServer } from "./server.ts";
import { getPort } from "get-port-please";

function getEnvVar(name: string): string | undefined {
  try {
    if (typeof process !== "undefined" && process.env) {
      return process.env[name];
    }
    // @ts-ignore - Deno not available in all runtimes
    if (typeof Deno !== "undefined") {
      // @ts-ignore
      return (globalThis as any).Deno.env.get(name);
    }
  } catch {}
  return undefined;
}

async function start() {
  const app = await createServer();
  const envPort = getEnvVar("PORT");
  const portNumber = envPort ? parseInt(envPort) : undefined;

  let port: number;

  if (envPort) {
    if (isNaN(portNumber!)) {
      console.error(`Invalid PORT value: ${envPort}`);
      process.exit(1);
    }

    port = await getPort({
      port: portNumber,
    });

    if (port !== portNumber) {
      console.error(`❌ Port ${portNumber} is already in use.`);
      console.error(
        `Either free the port or don't set PORT env to let the server find an available port.`,
      );
      process.exit(1);
    }
  } else {
    port = await getPort({
      portRange: [3000, 3100],
      name: "ferriqa-api",
    });
  }

  console.log(`Starting server on port ${port}...`);

  Bun.serve({
    port,
    fetch: app.fetch,
  });

  console.log(`Server running on http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`API v1: http://localhost:${port}/api/v1`);
  console.log(`API (default): http://localhost:${port}/api`);
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
