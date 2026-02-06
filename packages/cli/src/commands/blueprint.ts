/**
 * @ferriqa/cli - Blueprint Command
 *
 * Blueprint management: list, create, delete, export
 */

import * as p from "@clack/prompts";
import pc from "picocolors";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { CLIContext } from "../index.ts";

interface Blueprint {
  name: string;
  slug: string;
  description?: string;
  fields: BlueprintField[];
}

interface BlueprintField {
  name: string;
  key: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  default?: unknown;
  options?: Record<string, unknown>;
}

export async function blueprintCommand(
  args: string[],
  context: CLIContext,
): Promise<void> {
  const subcommand = args[0];

  if (!subcommand) {
    showBlueprintHelp();
    return;
  }

  switch (subcommand) {
    case "list":
    case "ls":
      await listCommand(args.slice(1), context);
      break;
    case "create":
    case "new":
      await createCommand(args.slice(1), context);
      break;
    case "delete":
    case "rm":
      await deleteCommand(args.slice(1), context);
      break;
    case "export":
      await exportCommand(args.slice(1), context);
      break;
    case "import":
      await importCommand(args.slice(1), context);
      break;
    default:
      p.log.error(pc.red(`Unknown blueprint subcommand: ${subcommand}`));
      showBlueprintHelp();
      process.exit(1);
  }
}

async function listCommand(args: string[], context: CLIContext): Promise<void> {
  const spinner = p.spinner();
  spinner.start(pc.dim("Loading blueprints..."));

  try {
    const blueprintsPath = join(context.cwd, "blueprints.json");
    const blueprints = await loadBlueprints(blueprintsPath);

    spinner.stop();

    if (blueprints.length === 0) {
      p.log.info(pc.yellow("⚠ No blueprints found"));
      p.log.info(pc.dim("Use 'ferriqa blueprint create' to create one"));
      return;
    }

    p.log.success(pc.green(`\nFound ${blueprints.length} blueprint(s):\n`));

    blueprints.forEach((bp, index) => {
      const fieldCount = bp.fields?.length || 0;
      p.log.info(
        `${pc.bold(`${index + 1}.`)} ${pc.cyan(bp.name)} ${pc.dim(`(${bp.slug})`)}`,
      );
      p.log.info(`   ${pc.dim(`${fieldCount} field(s)`)}`);

      if (bp.fields && bp.fields.length > 0) {
        bp.fields.slice(0, 3).forEach((field) => {
          const required = field.required ? pc.red("*") : "";
          p.log.info(
            `   ${pc.dim("•")} ${field.name}${required} ${pc.dim(`(${field.type})`)}`,
          );
        });
        if (bp.fields.length > 3) {
          p.log.info(pc.dim(`   ... and ${bp.fields.length - 3} more`));
        }
      }
      p.log.info("");
    });
  } catch (error) {
    spinner.stop(pc.red("✗ Failed to load blueprints"));
    throw error;
  }
}

async function createCommand(
  args: string[],
  context: CLIContext,
): Promise<void> {
  const nameFromArgs = args[0];

  // Blueprint name
  const name =
    nameFromArgs ||
    (await p.text({
      message: "Blueprint name:",
      placeholder: "Blog Post",
      validate(value: string | symbol) {
        const strValue = String(value);
        if (!strValue) return "Blueprint name is required";
        if (strValue.length < 2) return "Name must be at least 2 characters";
      },
    }));

  if (p.isCancel(name)) {
    p.cancel("Cancelled");
    return;
  }

  // Generate slug
  const suggestedSlug = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const slug = await p.text({
    message: "Slug (URL-friendly name):",
    placeholder: suggestedSlug,
    initialValue: suggestedSlug,
    validate(value) {
      if (!value) return "Slug is required";
      if (!/^[a-z0-9-]+$/.test(String(value))) {
        return "Slug can only contain lowercase letters, numbers, and hyphens";
      }
    },
  });

  if (p.isCancel(slug)) {
    p.cancel("Cancelled");
    return;
  }

  // Description
  const description = (await p.text({
    message: "Description (optional):",
    placeholder: "A brief description of this content type",
  })) as string | symbol;

  if (p.isCancel(description)) {
    p.cancel("Cancelled");
    return;
  }

  // Fields
  const fields: BlueprintField[] = [];
  let addMoreFields = true;

  p.log.step(pc.cyan("Adding fields..."));

  while (addMoreFields) {
    const field = await promptForField(fields.length + 1);

    if (field === null) {
      break;
    }

    fields.push(field);

    const addAnother = await p.confirm({
      message: "Add another field?",
      initialValue: fields.length < 3, // Suggest adding more if less than 3 fields
    });

    if (p.isCancel(addAnother) || !addAnother) {
      addMoreFields = false;
    }
  }

  if (fields.length === 0) {
    p.log.warn(pc.yellow("⚠ Blueprint must have at least one field"));
    const addRequired = await p.confirm({
      message: "Add a 'Title' field?",
      initialValue: true,
    });

    if (addRequired) {
      fields.push({
        name: "Title",
        key: "title",
        type: "text",
        required: true,
      });
    } else {
      p.cancel("Blueprint creation cancelled");
      return;
    }
  }

  // Save blueprint
  const spinner = p.spinner();
  spinner.start(pc.dim("Saving blueprint..."));

  try {
    const blueprintsPath = join(context.cwd, "blueprints.json");
    const blueprints = await loadBlueprints(blueprintsPath);

    // Check for duplicate slug
    if (blueprints.some((bp) => bp.slug === slug)) {
      spinner.stop(pc.red(`✗ Blueprint with slug "${slug}" already exists`));
      return;
    }

    const newBlueprint: Blueprint = {
      name: String(name),
      slug: String(slug),
      description: description ? String(description) : undefined,
      fields,
    };

    blueprints.push(newBlueprint);
    await saveBlueprints(blueprintsPath, blueprints);

    spinner.stop(pc.green(`✓ Blueprint "${name}" created successfully!`));

    p.log.info(
      pc.dim(`\nRun 'ferriqa db migrate' to create the database table`),
    );
    p.log.info(pc.dim(`API endpoint: /api/v1/contents/${slug}`));
  } catch (error) {
    spinner.stop(pc.red("✗ Failed to save blueprint"));
    throw error;
  }
}

async function promptForField(index: number): Promise<BlueprintField | null> {
  p.log.step(pc.cyan(`\nField #${index}`));

  const name = await p.text({
    message: "Plugin name:",
    placeholder: "My Custom Plugin",
    validate(value: string | symbol) {
      const strValue = String(value);
      if (!strValue) return "Plugin name is required";
    },
  });

  if (p.isCancel(name)) {
    return null;
  }

  // Generate key from name
  const suggestedKey = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  const key = await p.text({
    message: "Field key (API name):",
    placeholder: suggestedKey,
    initialValue: suggestedKey,
    validate(value) {
      if (!value) return "Field key is required";
      if (!/^[a-z0-9_]+$/.test(String(value))) {
        return "Key can only contain lowercase letters, numbers, and underscores";
      }
    },
  });

  if (p.isCancel(key)) {
    return null;
  }

  const type = await p.select({
    message: "Field type:",
    options: [
      { value: "text", label: "Text", hint: "Single line text" },
      { value: "textarea", label: "Textarea", hint: "Multi-line text" },
      { value: "richtext", label: "Rich Text", hint: "HTML/Markdown editor" },
      { value: "number", label: "Number", hint: "Integer or decimal" },
      { value: "boolean", label: "Boolean", hint: "True/False toggle" },
      { value: "date", label: "Date", hint: "Date picker" },
      { value: "datetime", label: "Date & Time", hint: "Date and time picker" },
      { value: "email", label: "Email", hint: "Email address" },
      { value: "url", label: "URL", hint: "Web address" },
      { value: "select", label: "Select", hint: "Dropdown selection" },
      {
        value: "multiselect",
        label: "Multi-select",
        hint: "Multiple selections",
      },
      { value: "media", label: "Media", hint: "Image or file upload" },
      { value: "relation", label: "Relation", hint: "Link to other content" },
      { value: "json", label: "JSON", hint: "Raw JSON data" },
    ],
  });

  if (p.isCancel(type)) {
    return null;
  }

  const required = await p.confirm({
    message: "Is this field required?",
    initialValue: false,
  });

  if (p.isCancel(required)) {
    return null;
  }

  const unique = await p.confirm({
    message: "Must this value be unique?",
    initialValue: false,
  });

  if (p.isCancel(unique)) {
    return null;
  }

  return {
    name: String(name),
    key: String(key),
    type: String(type),
    required: Boolean(required),
    unique: Boolean(unique),
  };
}

async function deleteCommand(
  args: string[],
  context: CLIContext,
): Promise<void> {
  const slug = args[0];

  if (!slug) {
    const blueprintsPath = join(context.cwd, "blueprints.json");
    const blueprints = await loadBlueprints(blueprintsPath);

    if (blueprints.length === 0) {
      p.log.error(pc.red("No blueprints to delete"));
      return;
    }

    const selected = await p.select({
      message: "Select blueprint to delete:",
      options: blueprints.map((bp) => ({
        value: bp.slug,
        label: bp.name,
      })),
    });

    if (p.isCancel(selected)) {
      p.cancel("Cancelled");
      return;
    }

    await deleteBlueprint(String(selected), context);
  } else {
    await deleteBlueprint(slug, context);
  }
}

async function deleteBlueprint(
  slug: string,
  context: CLIContext,
): Promise<void> {
  const confirm = await p.confirm({
    message: `Are you sure you want to delete blueprint "${slug}"?`,
    initialValue: false,
  });

  if (p.isCancel(confirm) || !confirm) {
    p.cancel("Deletion cancelled");
    return;
  }

  const spinner = p.spinner();
  spinner.start(pc.dim("Deleting blueprint..."));

  try {
    const blueprintsPath = join(context.cwd, "blueprints.json");
    const blueprints = await loadBlueprints(blueprintsPath);

    const index = blueprints.findIndex((bp) => bp.slug === slug);
    if (index === -1) {
      spinner.stop(pc.red(`✗ Blueprint "${slug}" not found`));
      return;
    }

    const deleted = blueprints.splice(index, 1)[0];
    await saveBlueprints(blueprintsPath, blueprints);

    spinner.stop(pc.green(`✓ Blueprint "${deleted.name}" deleted`));
  } catch (error) {
    spinner.stop(pc.red("✗ Failed to delete blueprint"));
    throw error;
  }
}

async function exportCommand(
  args: string[],
  context: CLIContext,
): Promise<void> {
  const format = args[0] || "json";
  const outputPath = args[1] || `blueprints-export.${format}`;

  const spinner = p.spinner();
  spinner.start(pc.dim("Exporting blueprints..."));

  try {
    const blueprintsPath = join(context.cwd, "blueprints.json");
    const blueprints = await loadBlueprints(blueprintsPath);

    const outputFullPath = join(context.cwd, outputPath);

    if (format === "ts") {
      // Export as TypeScript definitions
      const tsContent = generateTypeScriptDefinitions(blueprints);
      await writeFile(outputFullPath, tsContent);
    } else {
      // Export as JSON
      await writeFile(outputFullPath, JSON.stringify(blueprints, null, 2));
    }

    spinner.stop(pc.green(`✓ Exported to ${outputPath}`));
  } catch (error) {
    spinner.stop(pc.red("✗ Export failed"));
    throw error;
  }
}

async function importCommand(
  args: string[],
  context: CLIContext,
): Promise<void> {
  const inputPath = args[0];

  if (!inputPath) {
    p.log.error(pc.red("Please provide a file path to import"));
    p.log.info(pc.dim("Usage: ferriqa blueprint import <file>"));
    return;
  }

  const spinner = p.spinner();
  spinner.start(pc.dim("Importing blueprints..."));

  try {
    const inputFullPath = join(context.cwd, inputPath);
    const content = await readFile(inputFullPath, "utf-8");
    const imported = JSON.parse(content) as Blueprint[];

    const blueprintsPath = join(context.cwd, "blueprints.json");
    const existing = await loadBlueprints(blueprintsPath);

    // Merge blueprints
    for (const bp of imported) {
      const existingIndex = existing.findIndex((e) => e.slug === bp.slug);
      if (existingIndex >= 0) {
        existing[existingIndex] = bp;
      } else {
        existing.push(bp);
      }
    }

    await saveBlueprints(blueprintsPath, existing);

    spinner.stop(pc.green(`✓ Imported ${imported.length} blueprint(s)`));
  } catch (error) {
    spinner.stop(pc.red("✗ Import failed"));
    throw error;
  }
}

async function loadBlueprints(path: string): Promise<Blueprint[]> {
  try {
    const content = await readFile(path, "utf-8");
    return JSON.parse(content) as Blueprint[];
  } catch {
    return [];
  }
}

async function saveBlueprints(
  path: string,
  blueprints: Blueprint[],
): Promise<void> {
  await writeFile(path, JSON.stringify(blueprints, null, 2));
}

function generateTypeScriptDefinitions(blueprints: Blueprint[]): string {
  let output = `/**
 * Auto-generated TypeScript definitions from Ferriqa blueprints
 */

`;

  for (const bp of blueprints) {
    output += `export interface ${bp.name.replace(/\s+/g, "")} {
`;

    for (const field of bp.fields || []) {
      const optional = field.required ? "" : "?";
      const type = getTypeScriptType(field.type);
      output += `  ${field.key}${optional}: ${type};\n`;
    }

    output += `}\n\n`;
  }

  return output;
}

function getTypeScriptType(fieldType: string): string {
  const typeMap: Record<string, string> = {
    text: "string",
    textarea: "string",
    richtext: "string",
    number: "number",
    boolean: "boolean",
    date: "Date",
    datetime: "Date",
    email: "string",
    url: "string",
    select: "string",
    multiselect: "string[]",
    media: "string",
    relation: "string | number",
    json: "unknown",
  };

  return typeMap[fieldType] || "unknown";
}

function showBlueprintHelp(): void {
  console.log(`
${pc.bold("Blueprint Commands:")}

  ferriqa blueprint list              List all blueprints
  ferriqa blueprint create [name]     Create a new blueprint
  ferriqa blueprint delete <slug>     Delete a blueprint
  ferriqa blueprint export [format]   Export blueprints (json/ts)
  ferriqa blueprint import <file>     Import blueprints from file

${pc.bold("Examples:")}
  ferriqa blueprint create "Blog Post"
  ferriqa blueprint export ts types.ts
  ferriqa blueprint import backup.json
`);
}
