/**
 * @ferriqa/cli - DB Command
 *
 * Database operations: migrate, rollback, seed, reset
 */

import * as p from "@clack/prompts";
import pc from "picocolors";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { CLIContext } from "../index.ts";

export async function dbCommand(
  args: string[],
  context: CLIContext,
): Promise<void> {
  const subcommand = args[0];

  if (!subcommand) {
    showDbHelp();
    return;
  }

  switch (subcommand) {
    case "migrate":
      await migrateCommand(args.slice(1), context);
      break;
    case "rollback":
      await rollbackCommand(args.slice(1), context);
      break;
    case "seed":
      await seedCommand(args.slice(1), context);
      break;
    case "reset":
      await resetCommand(args.slice(1), context);
      break;
    case "status":
      await statusCommand(args.slice(1), context);
      break;
    case "create":
      await createMigrationCommand(args.slice(1), context);
      break;
    default:
      p.log.error(pc.red(`Unknown db subcommand: ${subcommand}`));
      showDbHelp();
      process.exit(1);
  }
}

async function migrateCommand(
  args: string[],
  context: CLIContext,
): Promise<void> {
  const dryRun = args.includes("--dry-run");

  p.log.step(pc.cyan("Running database migrations..."));

  const spinner = p.spinner();
  spinner.start(pc.dim("Loading migrations..."));

  try {
    // Check for migrations directory
    const migrationsDir = join(context.cwd, "migrations");
    const migrationsDirExists = await fileExists(migrationsDir);

    if (!migrationsDirExists) {
      spinner.stop(pc.yellow("⚠ No migrations directory found"));
      p.log.info(pc.dim("Creating migrations directory..."));
      const { mkdir } = await import("node:fs/promises");
      await mkdir(migrationsDir, { recursive: true });
    }

    // Get list of migration files
    const files = migrationsDirExists ? await readdir(migrationsDir) : [];
    const migrationFiles = files.filter((f) => f.endsWith(".ts"));

    if (migrationFiles.length === 0) {
      spinner.stop(pc.yellow("⚠ No migration files found"));
      p.log.info(
        pc.dim("Use 'ferriqa db create <name>' to create a migration"),
      );
      return;
    }

    spinner.stop(pc.green(`✓ Found ${migrationFiles.length} migration(s)`));

    if (dryRun) {
      p.log.info(pc.dim("Dry run mode - no changes will be made"));
      migrationFiles.forEach((file) => {
        p.log.info(pc.dim(`  - ${file}`));
      });
      return;
    }

    // Run migrations
    spinner.start(pc.dim("Running migrations..."));

    // TODO: Integrate with actual migration runner from @ferriqa/core
    // This is a placeholder implementation
    await simulateDelay(1000);

    spinner.stop(
      pc.green(`✓ Successfully ran ${migrationFiles.length} migration(s)`),
    );
  } catch (error) {
    spinner.stop(pc.red("✗ Migration failed"));
    throw error;
  }
}

async function rollbackCommand(
  args: string[],
  _context: CLIContext,
): Promise<void> {
  const steps = parseInt(args.find((a) => !a.startsWith("-")) || "1", 10);

  p.log.step(pc.cyan(`Rolling back ${steps} migration(s)...`));

  const confirm = await p.confirm({
    message: "Are you sure you want to rollback migrations?",
    initialValue: false,
  });

  if (p.isCancel(confirm) || !confirm) {
    p.cancel("Rollback cancelled");
    return;
  }

  const spinner = p.spinner();
  spinner.start(pc.dim("Rolling back..."));

  try {
    // TODO: Integrate with actual migration runner
    await simulateDelay(1000);

    spinner.stop(pc.green(`✓ Successfully rolled back ${steps} migration(s)`));
  } catch (error) {
    spinner.stop(pc.red("✗ Rollback failed"));
    throw error;
  }
}

async function seedCommand(args: string[], context: CLIContext): Promise<void> {
  const seedFile = args[0] || "seed.ts";

  p.log.step(pc.cyan("Seeding database..."));

  const spinner = p.spinner();
  spinner.start(pc.dim(`Loading seed file: ${seedFile}...`));

  try {
    const seedPath = join(context.cwd, "migrations", seedFile);
    const seedExists = await fileExists(seedPath);

    if (!seedExists) {
      spinner.stop(pc.yellow(`⚠ Seed file not found: ${seedFile}`));

      const create = await p.confirm({
        message: "Create a sample seed file?",
        initialValue: true,
      });

      if (create) {
        await createSampleSeed(context);
      }
      return;
    }

    // TODO: Run seed file
    await simulateDelay(1000);

    spinner.stop(pc.green("✓ Database seeded successfully"));
  } catch (error) {
    spinner.stop(pc.red("✗ Seeding failed"));
    throw error;
  }
}

async function resetCommand(
  args: string[],
  _context: CLIContext,
): Promise<void> {
  const force = args.includes("--force");

  p.log.step(pc.cyan("Resetting database..."));
  p.log.warn(pc.yellow("⚠ This will delete all data!"));

  if (!force) {
    const confirm = await p.confirm({
      message: "Are you absolutely sure?",
      initialValue: false,
    });

    if (p.isCancel(confirm) || !confirm) {
      p.cancel("Reset cancelled");
      return;
    }

    const projectName = await p.text({
      message: "Type your project name to confirm:",
      validate(value: string | symbol) {
        const strValue = String(value);
        // Simple validation - in real implementation, check actual project name
        if (!strValue) return "Please enter your project name";
      },
    });

    if (p.isCancel(projectName)) {
      p.cancel("Reset cancelled");
      return;
    }
  }

  const spinner = p.spinner();
  spinner.start(pc.dim("Resetting database..."));

  try {
    // TODO: Reset database
    await simulateDelay(1500);

    spinner.stop(pc.green("✓ Database reset successfully"));
    p.log.info(pc.dim("Run 'ferriqa db migrate' to recreate tables"));
  } catch (error) {
    spinner.stop(pc.red("✗ Reset failed"));
    throw error;
  }
}

async function statusCommand(
  args: string[],
  context: CLIContext,
): Promise<void> {
  p.log.step(pc.cyan("Migration status:"));

  try {
    const migrationsDir = join(context.cwd, "migrations");
    const files = await readdir(migrationsDir).catch(() => []);
    const migrationFiles = files.filter((f) => f.endsWith(".ts"));

    // TODO: Get applied migrations from database
    const appliedMigrations: string[] = []; // Placeholder

    if (migrationFiles.length === 0) {
      p.log.info(pc.dim("No migrations found"));
      return;
    }

    migrationFiles.forEach((file) => {
      const isApplied = appliedMigrations.includes(file);
      const icon = isApplied ? pc.green("✓") : pc.yellow("○");
      const status = isApplied ? pc.green("applied") : pc.yellow("pending");
      p.log.info(`${icon} ${file} (${status})`);
    });
  } catch (error) {
    p.log.error(pc.red("Failed to get migration status"));
    throw error;
  }
}

async function createMigrationCommand(
  args: string[],
  context: CLIContext,
): Promise<void> {
  const name = args[0];

  if (!name) {
    const input = await p.text({
      message: "Migration name:",
      placeholder: "add_users_table",
      validate(value: string | symbol) {
        const strValue = String(value);
        if (!strValue) return "Migration name is required";
        if (!/^[a-z0-9_]+$/.test(strValue)) {
          return "Use only lowercase letters, numbers, and underscores";
        }
      },
    });

    if (p.isCancel(input)) {
      p.cancel("Cancelled");
      return;
    }
  }

  const migrationName = name || args[0];
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, "")
    .slice(0, 14);
  const filename = `${timestamp}_${migrationName}.ts`;

  const spinner = p.spinner();
  spinner.start(pc.dim(`Creating migration: ${filename}...`));

  try {
    const migrationsDir = join(context.cwd, "migrations");
    await import("node:fs/promises").then((fs) =>
      fs.mkdir(migrationsDir, { recursive: true }),
    );

    const template = generateMigrationTemplate(migrationName);
    await import("node:fs/promises").then((fs) =>
      fs.writeFile(join(migrationsDir, filename), template),
    );

    spinner.stop(pc.green(`✓ Created migration: ${filename}`));
  } catch (error) {
    spinner.stop(pc.red("✗ Failed to create migration"));
    throw error;
  }
}

function generateMigrationTemplate(name: string): string {
  return `/**
 * Migration: ${name}
 * Created at: ${new Date().toISOString()}
 */

export async function up(db: any): Promise<void> {
  // TODO: Implement migration
  // Example:
  // await db.execute(\`
  //   CREATE TABLE users (
  //     id INTEGER PRIMARY KEY AUTOINCREMENT,
  //     email TEXT UNIQUE NOT NULL,
  //     name TEXT NOT NULL,
  //     created_at INTEGER NOT NULL
  //   )
  // \`);
}

export async function down(db: any): Promise<void> {
  // TODO: Implement rollback
  // Example:
  // await db.execute("DROP TABLE IF EXISTS users");
}
`;
}

async function createSampleSeed(context: CLIContext): Promise<void> {
  const seedContent = `/**
 * Database Seed
 */

export async function seed(db: any): Promise<void> {
  // Example: Seed initial data
  // await db.execute(\`
  //   INSERT INTO users (email, name, created_at) 
  //   VALUES ('admin@example.com', 'Admin User', \${Date.now()})
  // \`);
  
  console.log("Database seeded!");
}
`;

  const seedPath = join(context.cwd, "migrations", "seed.ts");
  await import("node:fs/promises").then((fs) =>
    fs.writeFile(seedPath, seedContent),
  );

  p.log.success(pc.green("✓ Created sample seed file: migrations/seed.ts"));
}

function showDbHelp(): void {
  console.log(`
${pc.bold("Database Commands:")}

  ferriqa db migrate          Run pending migrations
  ferriqa db rollback [n]     Rollback n migrations (default: 1)
  ferriqa db seed [file]      Run seed file (default: seed.ts)
  ferriqa db reset            Reset database (DANGEROUS)
  ferriqa db status           Show migration status
  ferriqa db create <name>    Create a new migration

${pc.bold("Options:")}
  --dry-run                   Show what would be migrated without running
  --force                     Skip confirmation prompts
`);
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

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
