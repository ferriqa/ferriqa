/**
 * @ferriqa/cli - Main CLI Entry Point
 *
 * Ferriqa Headless CMS CLI using Clack framework
 * for beautiful interactive prompts.
 */

import * as p from "@clack/prompts";
import pc from "picocolors";
import { initCommand } from "./commands/init.ts";
import { devCommand } from "./commands/dev.ts";
import { dbCommand } from "./commands/db.ts";
import { blueprintCommand } from "./commands/blueprint.ts";
import { pluginCommand } from "./commands/plugin.ts";

export interface CLIContext {
  cwd: string;
  verbose: boolean;
  configPath?: string;
}

const COMMANDS = {
  init: {
    name: "init",
    description: "Create a new Ferriqa project",
    handler: initCommand,
  },
  dev: {
    name: "dev",
    description: "Start development server",
    handler: devCommand,
  },
  db: {
    name: "db",
    description: "Database operations",
    handler: dbCommand,
  },
  blueprint: {
    name: "blueprint",
    description: "Blueprint management",
    handler: blueprintCommand,
  },
  plugin: {
    name: "plugin",
    description: "Plugin management",
    handler: pluginCommand,
  },
};

export async function runCLI(): Promise<void> {
  const args = process.argv.slice(2);
  const commandName = args[0];
  const commandArgs = args.slice(1);

  p.intro(pc.bold(pc.cyan("🚀 Ferriqa Headless CMS CLI")));

  // Global options
  const verbose = args.includes("--verbose") || args.includes("-v");
  const configIndex = args.findIndex(
    (arg) => arg === "--config" || arg === "-c",
  );
  const configPath =
    configIndex !== -1 && args[configIndex + 1]
      ? args[configIndex + 1]
      : undefined;

  const context: CLIContext = {
    cwd: process.cwd(),
    verbose,
    configPath,
  };

  if (!commandName || commandName === "--help" || commandName === "-h") {
    showHelp();
    return;
  }

  if (commandName === "--version" || commandName === "-V") {
    showVersion();
    return;
  }

  const command = COMMANDS[commandName as keyof typeof COMMANDS];

  if (!command) {
    p.log.error(pc.red(`Unknown command: ${commandName}`));
    p.log.info(pc.dim("Run 'ferriqa --help' for available commands"));
    process.exit(1);
  }

  try {
    await command.handler(commandArgs, context);
    p.outro(pc.green("✅ Done!"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    p.log.error(pc.red(`❌ Error: ${message}`));

    if (verbose) {
      console.error(error);
    }

    process.exit(1);
  }
}

function showHelp(): void {
  console.log(`
${pc.bold(pc.cyan("Ferriqa Headless CMS CLI"))}

${pc.bold("Usage:")}
  ferriqa <command> [options]

${pc.bold("Commands:")}
  init [project-name]     Create a new Ferriqa project
  dev                     Start development server
  db <subcommand>         Database operations (migrate, rollback, seed)
  blueprint <subcommand>  Blueprint management (list, create, delete)
  plugin <subcommand>     Plugin management (list, add, remove)

${pc.bold("Global Options:")}
  -h, --help              Show help
  -v, --verbose           Enable verbose logging
  -V, --version           Show version
  -c, --config <path>     Path to config file

${pc.bold("Examples:")}
  ferriqa init my-blog
  ferriqa dev
  ferriqa db migrate
  ferriqa blueprint list

${pc.dim("For more information: https://ferriqa.dev/docs/cli")}
`);
}

function showVersion(): void {
  const pkg = { version: "1.0.0" }; // Will be loaded from package.json
  console.log(pc.bold(`Ferriqa CLI v${pkg.version}`));
}

// CLIContext is already exported at line 16
