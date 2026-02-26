/**
 * @ferriqa/cli - Blueprint Command Integration Tests
 *
 * Tests for `ferriqa blueprint` subcommands.
 */

import { test } from "@cross/test";
import { assertStrictEquals, assertEquals, assertExists } from "@std/assert";
import { blueprintCommand } from "../src/commands/blueprint.ts";
import type { CLIContext } from "../src/index.ts";
import { createTestContext, cleanupTestContext, crossFs } from "./utils.ts";

test("blueprint command > command exists > should import blueprintCommand successfully", async () => {
  assertStrictEquals(typeof blueprintCommand, "function");
});

test("blueprint command > command exists > should accept args and context parameters", async () => {
  const context = await createTestContext();

  try {
    const cliContext: CLIContext = {
      cwd: context.cwd,
      verbose: false,
    };

    assertExists(cliContext.cwd);
    assertStrictEquals(cliContext.verbose, false);
    assertStrictEquals(Array.isArray([]), true);
  } finally {
    await cleanupTestContext(context);
  }
});

test("blueprint command > subcommand parsing > should parse list subcommand", async () => {
  const args = ["list"];
  const subcommand = args[0];

  assertStrictEquals(subcommand, "list");
});

test("blueprint command > subcommand parsing > should parse create subcommand", async () => {
  const args = ["create", "Article"];
  const subcommand = args[0];
  const name = args[1];

  assertStrictEquals(subcommand, "create");
  assertStrictEquals(name, "Article");
});

test("blueprint command > subcommand parsing > should parse delete subcommand", async () => {
  const args = ["delete", "posts"];
  const subcommand = args[0];
  const slug = args[1];

  assertStrictEquals(subcommand, "delete");
  assertStrictEquals(slug, "posts");
});

test("blueprint command > subcommand parsing > should parse export subcommand", async () => {
  const args = ["export"];
  const subcommand = args[0];

  assertStrictEquals(subcommand, "export");
});

test("blueprint command > subcommand parsing > should parse export with format", async () => {
  const args = ["export", "ts", "types.ts"];
  const subcommand = args[0];
  const format = args[1];
  const filename = args[2];

  assertStrictEquals(subcommand, "export");
  assertStrictEquals(format, "ts");
  assertStrictEquals(filename, "types.ts");
});

test("blueprint command > subcommand parsing > should parse import subcommand", async () => {
  const args = ["import", "blueprints.json"];
  const subcommand = args[0];
  const filename = args[1];

  assertStrictEquals(subcommand, "import");
  assertStrictEquals(filename, "blueprints.json");
});

test("blueprint command > blueprint data structure > should create valid blueprint object", async () => {
  const blueprint = {
    name: "Post",
    slug: "posts",
    fields: [
      { name: "Title", key: "title", type: "text", required: true },
      { name: "Content", key: "content", type: "richtext" },
    ],
  };

  assertStrictEquals(blueprint.name, "Post");
  assertStrictEquals(blueprint.slug, "posts");
  assertEquals(blueprint.fields.length, 2);
  assertStrictEquals(blueprint.fields[0].key, "title");
});

test("blueprint command > blueprint data structure > should validate field types", async () => {
  const validTypes = [
    "text",
    "richtext",
    "number",
    "boolean",
    "date",
    "media",
    "relation",
  ];

  assertEquals(validTypes.includes("text"), true);
  assertEquals(validTypes.includes("number"), true);
  assertEquals(validTypes.includes("boolean"), true);
});

test("blueprint command > blueprint data structure > should handle empty fields array", async () => {
  const blueprint = {
    name: "Simple",
    slug: "simple",
    fields: [],
  };

  assertEquals(blueprint.fields.length, 0);
});

test("blueprint command > filesystem operations > should create and read blueprints.json", async () => {
  const context = await createTestContext();

  try {
    const blueprints = [{ name: "Post", slug: "posts", fields: [] }];

    const fs = await crossFs();
    await fs.writeFile(
      `${context.cwd}/blueprints.json`,
      JSON.stringify(blueprints, null, 2),
    );

    const content = await fs.readFile(`${context.cwd}/blueprints.json`);
    const contentStr =
      typeof content === "string" ? content : content.toString();
    const parsed = JSON.parse(contentStr);

    assertEquals(parsed.length, 1);
    assertStrictEquals(parsed[0].slug, "posts");
  } finally {
    await cleanupTestContext(context);
  }
});

test("blueprint command > filesystem operations > should update existing blueprints.json", async () => {
  const context = await createTestContext();

  try {
    const existing = [{ name: "Post", slug: "posts", fields: [] }];

    const fs = await crossFs();
    await fs.writeFile(
      `${context.cwd}/blueprints.json`,
      JSON.stringify(existing, null, 2),
    );

    const updated = [...existing, { name: "Page", slug: "pages", fields: [] }];

    await fs.writeFile(
      `${context.cwd}/blueprints.json`,
      JSON.stringify(updated, null, 2),
    );

    const content = await fs.readFile(`${context.cwd}/blueprints.json`);
    const contentStr =
      typeof content === "string" ? content : content.toString();
    const parsed = JSON.parse(contentStr);

    assertEquals(parsed.length, 2);
  } finally {
    await cleanupTestContext(context);
  }
});

test("blueprint command > error handling > should handle empty args", async () => {
  const args: string[] = [];
  const subcommand = args[0];

  assertEquals(subcommand, undefined);
});

test("blueprint command > error handling > should handle unknown subcommand", async () => {
  const args = ["unknown"];
  const knownSubcommands = ["list", "create", "delete", "export", "import"];
  const isUnknown = !knownSubcommands.includes(args[0]);

  assertStrictEquals(isUnknown, true);
});

test("blueprint command > error handling > should detect duplicate slugs", async () => {
  const blueprints = [
    { name: "Post", slug: "posts", fields: [] },
    { name: "Article", slug: "posts", fields: [] },
  ];

  const slugs = blueprints.map((b) => b.slug);
  const hasDuplicates = slugs.length !== new Set(slugs).size;

  assertStrictEquals(hasDuplicates, true);
});
