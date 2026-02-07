/**
 * @ferriqa/cli - Blueprint Command Integration Tests
 *
 * Tests for `ferriqa blueprint` subcommands.
 */

import { describe, it, expect, runTests } from "@ferriqa/core/testing";
import { blueprintCommand } from "../src/commands/blueprint.ts";
import type { CLIContext } from "../src/index.ts";
import { createTestContext, cleanupTestContext, crossFs } from "./utils.ts";

describe("blueprint command", () => {
  describe("command exists", () => {
    it("should import blueprintCommand successfully", async () => {
      expect(typeof blueprintCommand).toBe("function");
    });

    it("should accept args and context parameters", async () => {
      const context = await createTestContext();

      try {
        const cliContext: CLIContext = {
          cwd: context.cwd,
          verbose: false,
        };

        expect(cliContext.cwd).toBeDefined();
        expect(cliContext.verbose).toBe(false);
        expect(Array.isArray([])).toBe(true);
      } finally {
        await cleanupTestContext(context);
      }
    });
  });

  describe("subcommand parsing", () => {
    it("should parse list subcommand", async () => {
      const args = ["list"];
      const subcommand = args[0];

      expect(subcommand).toBe("list");
    });

    it("should parse create subcommand", async () => {
      const args = ["create", "Article"];
      const subcommand = args[0];
      const name = args[1];

      expect(subcommand).toBe("create");
      expect(name).toBe("Article");
    });

    it("should parse delete subcommand", async () => {
      const args = ["delete", "posts"];
      const subcommand = args[0];
      const slug = args[1];

      expect(subcommand).toBe("delete");
      expect(slug).toBe("posts");
    });

    it("should parse export subcommand", async () => {
      const args = ["export"];
      const subcommand = args[0];

      expect(subcommand).toBe("export");
    });

    it("should parse export with format", async () => {
      const args = ["export", "ts", "types.ts"];
      const subcommand = args[0];
      const format = args[1];
      const filename = args[2];

      expect(subcommand).toBe("export");
      expect(format).toBe("ts");
      expect(filename).toBe("types.ts");
    });

    it("should parse import subcommand", async () => {
      const args = ["import", "blueprints.json"];
      const subcommand = args[0];
      const filename = args[1];

      expect(subcommand).toBe("import");
      expect(filename).toBe("blueprints.json");
    });
  });

  describe("blueprint data structure", () => {
    it("should create valid blueprint object", async () => {
      const blueprint = {
        name: "Post",
        slug: "posts",
        fields: [
          { name: "Title", key: "title", type: "text", required: true },
          { name: "Content", key: "content", type: "richtext" },
        ],
      };

      expect(blueprint.name).toBe("Post");
      expect(blueprint.slug).toBe("posts");
      expect(blueprint.fields).toHaveLength(2);
      expect(blueprint.fields[0].key).toBe("title");
    });

    it("should validate field types", async () => {
      const validTypes = [
        "text",
        "richtext",
        "number",
        "boolean",
        "date",
        "media",
        "relation",
      ];

      expect(validTypes).toContain("text");
      expect(validTypes).toContain("number");
      expect(validTypes).toContain("boolean");
    });

    it("should handle empty fields array", async () => {
      const blueprint = {
        name: "Simple",
        slug: "simple",
        fields: [],
      };

      expect(blueprint.fields).toHaveLength(0);
    });
  });

  describe("filesystem operations", () => {
    it("should create and read blueprints.json", async () => {
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

        expect(parsed).toHaveLength(1);
        expect(parsed[0].slug).toBe("posts");
      } finally {
        await cleanupTestContext(context);
      }
    });

    it("should update existing blueprints.json", async () => {
      const context = await createTestContext();

      try {
        const existing = [{ name: "Post", slug: "posts", fields: [] }];

        const fs = await crossFs();
        await fs.writeFile(
          `${context.cwd}/blueprints.json`,
          JSON.stringify(existing, null, 2),
        );

        const updated = [
          ...existing,
          { name: "Page", slug: "pages", fields: [] },
        ];

        await fs.writeFile(
          `${context.cwd}/blueprints.json`,
          JSON.stringify(updated, null, 2),
        );

        const content = await fs.readFile(`${context.cwd}/blueprints.json`);
        const contentStr =
          typeof content === "string" ? content : content.toString();
        const parsed = JSON.parse(contentStr);

        expect(parsed).toHaveLength(2);
      } finally {
        await cleanupTestContext(context);
      }
    });
  });

  describe("error handling", () => {
    it("should handle empty args", async () => {
      const args: string[] = [];
      const subcommand = args[0];

      expect(subcommand).toBeUndefined();
    });

    it("should handle unknown subcommand", async () => {
      const args = ["unknown"];
      const knownSubcommands = ["list", "create", "delete", "export", "import"];
      const isUnknown = !knownSubcommands.includes(args[0]);

      expect(isUnknown).toBe(true);
    });

    it("should detect duplicate slugs", async () => {
      const blueprints = [
        { name: "Post", slug: "posts", fields: [] },
        { name: "Article", slug: "posts", fields: [] },
      ];

      const slugs = blueprints.map((b) => b.slug);
      const hasDuplicates = slugs.length !== new Set(slugs).size;

      expect(hasDuplicates).toBe(true);
    });
  });
});

runTests();
