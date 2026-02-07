/**
 * @ferriqa/cli - Completion Command
 *
 * Setup shell auto-completion
 */

import * as p from "@clack/prompts";
import pc from "picocolors";
import type { CLIContext } from "../index.ts";
import { existsSync } from "node:fs";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";

/**
 * Detect current shell
 */
function detectShell(): string {
  if (process.env.SHELL?.includes("zsh")) return "zsh";
  if (process.env.SHELL?.includes("bash")) return "bash";
  if (process.env.SHELL?.includes("fish")) return "fish";
  return "unknown";
}

/**
 * Get completion file path for shell
 */
function getCompletionPath(shell: string): string {
  const cliDir = dirname(import.meta.url.replace("file://", ""));

  switch (shell) {
    case "bash":
      return join(cliDir, "completions", "bash", "ferriqa.bash");
    case "zsh":
      return join(cliDir, "completions", "zsh", "_ferriqa");
    case "fish":
      return join(cliDir, "completions", "fish", "ferriqa.fish");
    default:
      throw new Error(`Unsupported shell: ${shell}`);
  }
}

/**
 * Get config directory for shell
 */
function getShellConfigPath(shell: string): string {
  const home = process.env.HOME || process.env.USERPROFILE || "";

  switch (shell) {
    case "bash":
      return join(home, ".bashrc");
    case "zsh":
      return join(home, ".zshrc");
    case "fish":
      return join(home, ".config/fish/config.fish");
    default:
      throw new Error(`Unsupported shell: ${shell}`);
  }
}

/**
 * Get completion script source line
 */
function getCompletionSourceLine(
  shell: string,
  completionPath: string,
): string {
  switch (shell) {
    case "bash":
      return `\n# Ferriqa completion\nsource "${completionPath}"\n`;
    case "zsh":
      return `\n# Ferriqa completion\nfpath=("${completionPath.replace("/_ferriqa", "")}" $fpath)\nautoload -U compinit && compinit\n`;
    case "fish":
      return `\n# Ferriqa completion\nsource "${completionPath}"\n`;
    default:
      throw new Error(`Unsupported shell: ${shell}`);
  }
}

/**
 * Setup completion for shell
 */
async function setupCompletion(shell: string): Promise<void> {
  const spinner = p.spinner();

  try {
    const completionPath = getCompletionPath(shell);
    const configPath = getShellConfigPath(shell);

    spinner.start(pc.dim(`Setting up ${shell} completion...`));

    // Check if completion file exists
    if (!existsSync(completionPath)) {
      spinner.stop(pc.red(`✗ Completion file not found: ${completionPath}`));
      p.log.info(pc.dim("Please ensure ferriqa CLI is properly installed"));
      return;
    }

    // Read existing config
    let configContent = "";
    if (existsSync(configPath)) {
      configContent = await readFile(configPath, "utf-8");
    } else {
      // Create config file if it doesn't exist
      await mkdir(dirname(configPath), { recursive: true });
    }

    // Check if completion is already configured
    if (configContent.includes("Ferriqa completion")) {
      spinner.stop(pc.yellow(`⚠ ${shell} completion already configured`));
      p.log.info(pc.dim(`Completion is already enabled in ${configPath}`));
      return;
    }

    // Add completion source to config
    const sourceLine = getCompletionSourceLine(shell, completionPath);
    await writeFile(configPath, configContent + sourceLine, "utf-8");

    spinner.stop(pc.green(`✓ ${shell} completion installed!`));

    p.log.success(pc.bold(pc.green("\n🎉 Completion setup complete!")));
    p.log.info(pc.cyan("\nTo activate completion, run:"));
    p.log.info(pc.white(`  source ${configPath}`));
    p.log.info(pc.dim("\nOr restart your terminal."));
  } catch (error) {
    spinner.stop(pc.red(`✗ Failed to setup ${shell} completion`));
    throw error;
  }
}

/**
 * Print completion script to stdout
 */
async function printCompletionScript(shell: string): Promise<void> {
  try {
    const completionPath = getCompletionPath(shell);

    if (!existsSync(completionPath)) {
      p.log.error(pc.red(`Completion file not found: ${completionPath}`));
      return;
    }

    const content = await readFile(completionPath, "utf-8");
    console.log(content);
  } catch (error) {
    p.log.error(pc.red(`Failed to read completion script: ${error}`));
  }
}

/**
 * Completion command handler
 */
export async function completionCommand(
  args: string[],
  _context: CLIContext,
): Promise<void> {
  const shell = args[0];

  if (!shell || shell === "detect") {
    const detected = detectShell();
    if (detected === "unknown") {
      p.log.error(pc.red("Could not detect shell"));
      p.log.info(pc.dim("Please specify shell: bash, zsh, or fish"));
      return;
    }

    const confirm = await p.confirm({
      message: `Detected shell: ${detected}. Setup completion?`,
      initialValue: true,
    });

    if (p.isCancel(confirm) || !confirm) {
      p.cancel("Setup cancelled");
      return;
    }

    await setupCompletion(detected);
    return;
  }

  if (shell === "--print" || shell === "print") {
    const printShell = args[1] || detectShell();
    await printCompletionScript(printShell);
    return;
  }

  if (shell === "--help" || shell === "-h") {
    showCompletionHelp();
    return;
  }

  // Setup completion for specified shell
  if (!["bash", "zsh", "fish"].includes(shell)) {
    p.log.error(pc.red(`Unsupported shell: ${shell}`));
    p.log.info(pc.dim("Supported shells: bash, zsh, fish"));
    return;
  }

  await setupCompletion(shell);
}

/**
 * Show completion help
 */
function showCompletionHelp(): void {
  console.log(`
${pc.bold("Shell Auto-Completion Setup")}

${pc.bold("Usage:")}
  ferriqa completion [shell] [options]

${pc.bold("Commands:")}
  ferriqa completion detect        Auto-detect and setup shell
  ferriqa completion bash           Setup bash completion
  ferriqa completion zsh            Setup zsh completion
  ferriqa completion fish           Setup fish completion

${pc.bold("Options:")}
  --print [shell]                  Print completion script to stdout
  --help                           Show this help

${pc.bold("Examples:")}
  ferriqa completion detect         # Auto-detect and setup
  ferriqa completion bash           # Setup bash completion
  ferriqa completion --print zsh    # Print zsh completion script

${pc.bold("Manual Setup:")}
  Bash:
    echo 'source /path/to/completions/bash ferriqa.bash' >> ~/.bashrc
    source ~/.bashrc

  Zsh:
    mkdir -p ~/.zsh/completions
    cp /path/to/completions/zsh/_ferriqa ~/.zsh/completions/
    echo 'fpath=(~/.zsh/completions $fpath)' >> ~/.zshrc
    autoload -U compinit && compinit

  Fish:
    echo 'source /path/to/completions fish/ferriqa.fish' >> \
      ~/.config/fish/config.fish
`);
}
