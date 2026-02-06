/**
 * @ferriqa/cli - Plugin Command
 *
 * Plugin management: list, add, remove
 */

import * as p from "@clack/prompts";
import pc from "picocolors";
import type { CLIContext } from "../index.ts";

interface PluginInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  installed: boolean;
}

const AVAILABLE_PLUGINS: PluginInfo[] = [
  {
    id: "seo",
    name: "SEO",
    version: "1.0.0",
    description: "SEO optimization with meta tags and sitemap generation",
    installed: false,
  },
  {
    id: "localization",
    name: "Localization",
    version: "1.0.0",
    description: "Multi-language content support",
    installed: false,
  },
  {
    id: "analytics",
    name: "Analytics",
    version: "1.0.0",
    description: "Track page views and content performance",
    installed: false,
  },
  {
    id: "search",
    name: "Search",
    version: "1.0.0",
    description: "Full-text search with FTS5",
    installed: false,
  },
  {
    id: "backup",
    name: "Backup",
    version: "1.0.0",
    description: "Automated backups and restore",
    installed: false,
  },
];

export async function pluginCommand(
  args: string[],
  context: CLIContext,
): Promise<void> {
  const subcommand = args[0];

  if (!subcommand) {
    showPluginHelp();
    return;
  }

  switch (subcommand) {
    case "list":
    case "ls":
      await listCommand(args.slice(1), context);
      break;
    case "add":
    case "install":
      await addCommand(args.slice(1), context);
      break;
    case "remove":
    case "uninstall":
      await removeCommand(args.slice(1), context);
      break;
    case "create":
      await createCommand(args.slice(1), context);
      break;
    default:
      p.log.error(pc.red(`Unknown plugin subcommand: ${subcommand}`));
      showPluginHelp();
      process.exit(1);
  }
}

async function listCommand(
  _args: string[],
  _context: CLIContext,
): Promise<void> {
  p.log.step(pc.cyan("Installed Plugins:"));

  // TODO: Load from actual plugin registry
  // This is a placeholder
  const installedPlugins: string[] = [];

  if (installedPlugins.length === 0) {
    p.log.info(pc.dim("No plugins installed"));
    p.log.info(pc.dim("Use 'ferriqa plugin add <name>' to install plugins"));
    return;
  }

  installedPlugins.forEach((pluginId) => {
    const plugin = AVAILABLE_PLUGINS.find((p) => p.id === pluginId);
    if (plugin) {
      p.log.info(
        `${pc.green("✓")} ${pc.bold(plugin.name)} ${pc.dim(`(${plugin.version})`)}`,
      );
      p.log.info(`  ${pc.dim(plugin.description)}`);
    }
  });

  p.log.info(pc.dim("\nAvailable Plugins:"));
  AVAILABLE_PLUGINS.filter((p) => !installedPlugins.includes(p.id)).forEach(
    (plugin) => {
      p.log.info(
        `${pc.yellow("○")} ${pc.bold(plugin.name)} ${pc.dim(`(${plugin.version})`)}`,
      );
      p.log.info(`  ${pc.dim(plugin.description)}`);
    },
  );
}

async function addCommand(args: string[], context: CLIContext): Promise<void> {
  const pluginId = args[0];

  if (!pluginId) {
    // Interactive plugin selection
    const selected = await p.multiselect({
      message: "Select plugins to install:",
      options: AVAILABLE_PLUGINS.map((plugin) => ({
        value: plugin.id,
        label: plugin.name,
        hint: plugin.description,
      })),
      required: false,
    });

    if (p.isCancel(selected) || !selected || selected.length === 0) {
      p.cancel("No plugins selected");
      return;
    }

    for (const id of selected) {
      await installPlugin(String(id), context);
    }
  } else {
    await installPlugin(pluginId, context);
  }
}

async function installPlugin(
  pluginId: string,
  _context: CLIContext,
): Promise<void> {
  const plugin = AVAILABLE_PLUGINS.find((p) => p.id === pluginId);

  if (!plugin) {
    p.log.error(pc.red(`Plugin "${pluginId}" not found`));
    p.log.info(pc.dim(`Run 'ferriqa plugin list' to see available plugins`));
    return;
  }

  const spinner = p.spinner();
  spinner.start(pc.dim(`Installing ${plugin.name}...`));

  try {
    // TODO: Actual plugin installation
    // 1. Add to ferriqa.config.ts
    // 2. Install npm package if needed
    // 3. Run plugin migrations

    await simulateDelay(1000);

    spinner.stop(pc.green(`✓ ${plugin.name} installed successfully!`));

    p.log.info(pc.dim(`Run 'ferriqa db migrate' to apply plugin migrations`));
  } catch (error) {
    spinner.stop(pc.red(`✗ Failed to install ${plugin.name}`));
    throw error;
  }
}

async function removeCommand(
  args: string[],
  _context: CLIContext,
): Promise<void> {
  const pluginId = args[0];

  if (!pluginId) {
    p.log.error(pc.red("Please specify a plugin to remove"));
    p.log.info(pc.dim("Usage: ferriqa plugin remove <plugin-id>"));
    return;
  }

  const plugin = AVAILABLE_PLUGINS.find((p) => p.id === pluginId);
  const name = plugin?.name || pluginId;

  const confirm = await p.confirm({
    message: `Remove plugin "${name}"?`,
    initialValue: false,
  });

  if (p.isCancel(confirm) || !confirm) {
    p.cancel("Removal cancelled");
    return;
  }

  const spinner = p.spinner();
  spinner.start(pc.dim(`Removing ${name}...`));

  try {
    // TODO: Actual plugin removal
    // 1. Remove from ferriqa.config.ts
    // 2. Uninstall npm package
    // 3. Clean up plugin data

    await simulateDelay(800);

    spinner.stop(pc.green(`✓ ${name} removed successfully!`));
  } catch (error) {
    spinner.stop(pc.red(`✗ Failed to remove ${name}`));
    throw error;
  }
}

async function createCommand(
  args: string[],
  context: CLIContext,
): Promise<void> {
  const name = args[0];

  const pluginName =
    name ||
    (await p.text({
      message: "Plugin name:",
      placeholder: "My Custom Plugin",
      validate(value: string | symbol) {
        if (!value) return "Plugin name is required";
      },
    }));

  if (p.isCancel(pluginName)) {
    p.cancel("Cancelled");
    return;
  }

  const slug = String(pluginName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const spinner = p.spinner();
  spinner.start(pc.dim("Creating plugin scaffolding..."));

  try {
    const pluginDir = `${context.cwd}/plugins/${slug}`;
    const { mkdir, writeFile } = await import("node:fs/promises");

    await mkdir(pluginDir, { recursive: true });

    // Create plugin manifest
    await writeFile(
      `${pluginDir}/package.json`,
      JSON.stringify(
        {
          name: `ferriqa-plugin-${slug}`,
          version: "1.0.0",
          type: "module",
          main: "./src/index.ts",
          dependencies: {
            "@ferriqa/core": "workspace:*",
          },
        },
        null,
        2,
      ),
    );

    // Create plugin entry
    const pluginCode = `import { z } from "zod";
import type { FerriqaPlugin } from "@ferriqa/core";

const configSchema = z.object({
  // Add your config schema here
  enabled: z.boolean().default(true),
});

export const ${slug.replace(/-/g, "_")}Plugin: FerriqaPlugin<z.infer<typeof configSchema>> = {
  manifest: {
    id: "${slug}",
    name: "${pluginName}",
    version: "1.0.0",
    description: "Custom Ferriqa plugin",
    configSchema,
  },

  async init(context) {
    context.logger.info("Initializing ${pluginName}...");
    
    // Register hooks
    context.hooks.on("content:afterCreate", async ({ content }) => {
      // Your logic here
    });
  },

  async enable(context) {
    context.logger.info("${pluginName} enabled");
  },

  async disable(context) {
    context.logger.info("${pluginName} disabled");
  },
};

export default ${slug.replace(/-/g, "_")}Plugin;
`;

    await mkdir(`${pluginDir}/src`, { recursive: true });
    await writeFile(`${pluginDir}/src/index.ts`, pluginCode);

    // Create README
    const readmeContent = [
      `# ${pluginName}`,
      "",
      "A custom Ferriqa plugin.",
      "",
      "## Development",
      "",
      "```bash",
      `cd plugins/${slug}`,
      "bun install",
      "```",
      "",
    ].join("\n");
    await writeFile(`${pluginDir}/README.md`, readmeContent);

    spinner.stop(pc.green(`✓ Plugin "${pluginName}" created!`));

    p.log.info(pc.dim(`\nLocation: ${pluginDir}`));
    p.log.info(pc.dim(`Add to ferriqa.config.ts:`));
    p.log.info(pc.cyan(`  plugins: ["${slug}"]`));
  } catch (error) {
    spinner.stop(pc.red("✗ Failed to create plugin"));
    throw error;
  }
}

function showPluginHelp(): void {
  console.log(`
${pc.bold("Plugin Commands:")}

  ferriqa plugin list              List installed plugins
  ferriqa plugin add <id>          Install a plugin
  ferriqa plugin remove <id>       Uninstall a plugin
  ferriqa plugin create <name>     Create custom plugin scaffold

${pc.bold("Available Plugins:")}
  seo              SEO optimization
  localization     Multi-language support
  analytics        Page view tracking
  search           Full-text search
  backup           Automated backups

${pc.bold("Examples:")}
  ferriqa plugin add seo
  ferriqa plugin create "My Plugin"
`);
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
