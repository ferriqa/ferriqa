/**
 * @ferriqa/cli - Init Command
 *
 * Creates a new Ferriqa project with interactive prompts.
 */

import * as p from "@clack/prompts";
import pc from "picocolors";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { CLIContext } from "../index.ts";

interface InitOptions {
  projectName: string;
  template: "basic" | "blog" | "ecommerce";
  database: "sqlite" | "postgresql";
  includeAuth: boolean;
  includeMedia: boolean;
  port: number;
}

export async function initCommand(
  args: string[],
  context: CLIContext,
): Promise<void> {
  const projectNameFromArgs = args[0];

  p.log.step(pc.cyan("Creating new Ferriqa project..."));

  // Interactive prompts if project name not provided
  const projectName =
    projectNameFromArgs ||
    (await p.text({
      message: "What is your project name?",
      placeholder: "my-ferriqa-app",
      validate(value: string | symbol) {
        const strValue = String(value);
        if (!strValue) return "Project name is required";
        if (!/^[a-z0-9-]+$/.test(strValue)) {
          return "Project name can only contain lowercase letters, numbers, and hyphens";
        }
        if (existsSync(join(context.cwd, strValue))) {
          return `Directory "${strValue}" already exists`;
        }
      },
    }));

  if (p.isCancel(projectName)) {
    p.cancel("Operation cancelled");
    process.exit(0);
  }

  // Template selection
  const template = await p.select({
    message: "Choose a project template:",
    options: [
      {
        value: "basic",
        label: "Basic",
        hint: "Minimal setup with core features",
      },
      {
        value: "blog",
        label: "Blog",
        hint: "Blog with posts, categories, authors",
      },
      {
        value: "ecommerce",
        label: "E-commerce",
        hint: "Products, categories, orders",
      },
    ],
  });

  if (p.isCancel(template)) {
    p.cancel("Operation cancelled");
    process.exit(0);
  }

  // Database selection
  const database = await p.select({
    message: "Choose your database:",
    options: [
      { value: "sqlite", label: "SQLite", hint: "Recommended for development" },
      {
        value: "postgresql",
        label: "PostgreSQL",
        hint: "For production deployments",
      },
    ],
  });

  if (p.isCancel(database)) {
    p.cancel("Operation cancelled");
    process.exit(0);
  }

  // Features
  const features = await p.multiselect({
    message: "Select features to include:",
    options: [
      { value: "auth", label: "Authentication", hint: "JWT-based auth system" },
      { value: "media", label: "Media Uploads", hint: "Image/file uploads" },
      { value: "webhooks", label: "Webhooks", hint: "Event-driven webhooks" },
    ],
    required: false,
  });

  if (p.isCancel(features)) {
    p.cancel("Operation cancelled");
    process.exit(0);
  }

  const includeAuth = features.includes("auth");
  const _includeMedia = features.includes("media");
  const _includeWebhooks = features.includes("webhooks");

  // Port selection
  const port = await p.text({
    message: "Development server port:",
    placeholder: "3000",
    initialValue: "3000",
    validate(value: string | symbol) {
      const strValue = String(value);
      const num = parseInt(strValue, 10);
      if (isNaN(num) || num < 1 || num > 65535) {
        return "Please enter a valid port number (1-65535)";
      }
    },
  });

  if (p.isCancel(port)) {
    p.cancel("Operation cancelled");
    process.exit(0);
  }

  const options: InitOptions = {
    projectName: projectName as string,
    template: template as InitOptions["template"],
    database: database as InitOptions["database"],
    includeAuth,
    includeMedia: _includeMedia,
    port: parseInt(port as string, 10),
  };

  // Create project
  await createProject(options, context);
}

async function createProject(
  options: InitOptions,
  context: CLIContext,
): Promise<void> {
  const { projectName, template, includeAuth } = options;
  const projectPath = join(context.cwd, projectName);

  const spinner = p.spinner();
  spinner.start(pc.cyan("Creating project structure..."));

  try {
    // Create project directory
    await mkdir(projectPath, { recursive: true });
    await mkdir(join(projectPath, "src"), { recursive: true });
    await mkdir(join(projectPath, "migrations"), { recursive: true });

    // Create package.json
    await writeFile(
      join(projectPath, "package.json"),
      generatePackageJson(projectName),
    );

    // Create ferriqa.config.ts
    await writeFile(
      join(projectPath, "ferriqa.config.ts"),
      generateConfig(options),
    );

    // Create .env.example
    await writeFile(
      join(projectPath, ".env.example"),
      generateEnvExample(options),
    );

    // Create .env (development)
    await writeFile(join(projectPath, ".env"), generateEnvDevelopment(options));

    // Create README.md
    await writeFile(
      join(projectPath, "README.md"),
      generateReadme(projectName),
    );

    // Create template blueprints
    await writeFile(
      join(projectPath, "blueprints.json"),
      generateBlueprints(template),
    );

    // Create main entry point
    await writeFile(
      join(projectPath, "src", "index.ts"),
      generateMainEntry(options),
    );

    spinner.stop(pc.green(`✓ Project "${projectName}" created successfully!`));

    p.log.success(pc.bold(pc.green("\n🎉 Your Ferriqa project is ready!")));
    p.log.info(pc.cyan("\nNext steps:"));
    p.log.info(pc.white(`  cd ${projectName}`));
    p.log.info(pc.white("  ferriqa db migrate"));
    p.log.info(pc.white("  ferriqa dev"));

    if (includeAuth) {
      p.log.info(pc.dim("\nDefault credentials:"));
      p.log.info(pc.dim("  Admin: admin@example.com / admin123"));
      p.log.info(pc.dim("  User: user@example.com / user123"));
    }
  } catch (error) {
    spinner.stop(pc.red("✗ Failed to create project"));
    throw error;
  }
}

function generatePackageJson(projectName: string): string {
  return JSON.stringify(
    {
      name: projectName,
      version: "1.0.0",
      type: "module",
      scripts: {
        dev: "ferriqa dev",
        build: "ferriqa build",
        start: "ferriqa start",
        "db:migrate": "ferriqa db migrate",
        "db:rollback": "ferriqa db rollback",
      },
      dependencies: {
        "@ferriqa/core": "workspace:*",
        "@ferriqa/api": "workspace:*",
      },
      devDependencies: {
        "@ferriqa/cli": "workspace:*",
        "@types/node": "^20.0.0",
        typescript: "^5.3.0",
      },
    },
    null,
    2,
  );
}

function generateConfig(options: InitOptions): string {
  return `import { defineConfig } from "@ferriqa/core";

export default defineConfig({
  name: "${options.projectName}",
  
  server: {
    port: ${options.port},
    host: "localhost",
  },

  database: {
    type: "${options.database}",
    url: process.env.DATABASE_URL || "${
      options.database === "sqlite"
        ? "./data.db"
        : "postgresql://localhost:5432/ferriqa"
    }",
  },

  auth: {
    enabled: ${options.includeAuth},
    jwtSecret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
    accessTokenExpiry: "15m",
    refreshTokenExpiry: "7d",
  },

  media: {
    enabled: ${options.includeMedia},
    storage: "local",
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/*", "application/pdf"],
  },

  plugins: [
    // Add your plugins here
    // "seo",
    // "localization",
  ],

  features: {
    versioning: true,
    webhooks: false,
    caching: true,
  },
});
`;
}

function generateEnvExample(options: InitOptions): string {
  let env = `# Ferriqa Environment Variables
NODE_ENV=development
PORT=${options.port}
`;

  if (options.database === "sqlite") {
    env += `DATABASE_URL=./data.db
`;
  } else {
    env += `DATABASE_URL=postgresql://user:password@localhost:5432/ferriqa
`;
  }

  if (options.includeAuth) {
    env += `
# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
`;
  }

  if (options.includeMedia) {
    env += `
# Media Storage
MEDIA_STORAGE_PATH=./uploads
MEDIA_PUBLIC_URL=/uploads
`;
  }

  return env;
}

function generateEnvDevelopment(options: InitOptions): string {
  return generateEnvExample(options).replace(
    /your-super-secret-jwt-key-change-this-in-production/g,
    "dev-secret-key-not-for-production",
  );
}

function generateReadme(projectName: string): string {
  return `# ${projectName}

Built with [Ferriqa](https://ferriqa.dev) - Headless CMS

## 🚀 Getting Started

\`\`\`bash
# Install dependencies
bun install

# Run database migrations
ferriqa db migrate

# Start development server
ferriqa dev
\`\`\`

## 📁 Project Structure

\`\`\`
.
├── src/
│   └── index.ts          # Main entry point
├── migrations/           # Database migrations
├── ferriqa.config.ts    # Ferriqa configuration
├── blueprints.json      # Content type definitions
└── .env                 # Environment variables
\`\`\`

## 🛠 Available Commands

- \`ferriqa dev\` - Start development server
- \`ferriqa build\` - Build for production
- \`ferriqa db migrate\` - Run database migrations
- \`ferriqa db rollback\` - Rollback migrations
- \`ferriqa blueprint list\` - List content types

## 📚 Documentation

Visit [https://ferriqa.dev/docs](https://ferriqa.dev/docs) for full documentation.

## 📝 License

MIT
`;
}

function generateBlueprints(template: string): string {
  const blueprints: Record<string, unknown[]> = {
    basic: [],
    blog: [
      {
        name: "Post",
        slug: "posts",
        fields: [
          { name: "Title", key: "title", type: "text", required: true },
          {
            name: "Slug",
            key: "slug",
            type: "text",
            required: true,
            unique: true,
          },
          { name: "Content", key: "content", type: "richtext", required: true },
          {
            name: "Published",
            key: "published",
            type: "boolean",
            default: false,
          },
          { name: "Published At", key: "publishedAt", type: "datetime" },
        ],
      },
      {
        name: "Author",
        slug: "authors",
        fields: [
          { name: "Name", key: "name", type: "text", required: true },
          {
            name: "Email",
            key: "email",
            type: "email",
            required: true,
            unique: true,
          },
          { name: "Bio", key: "bio", type: "textarea" },
        ],
      },
    ],
    ecommerce: [
      {
        name: "Product",
        slug: "products",
        fields: [
          { name: "Name", key: "name", type: "text", required: true },
          {
            name: "Slug",
            key: "slug",
            type: "text",
            required: true,
            unique: true,
          },
          { name: "Description", key: "description", type: "richtext" },
          { name: "Price", key: "price", type: "number", required: true },
          {
            name: "SKU",
            key: "sku",
            type: "text",
            required: true,
            unique: true,
          },
          { name: "In Stock", key: "inStock", type: "boolean", default: true },
        ],
      },
      {
        name: "Category",
        slug: "categories",
        fields: [
          { name: "Name", key: "name", type: "text", required: true },
          {
            name: "Slug",
            key: "slug",
            type: "text",
            required: true,
            unique: true,
          },
          { name: "Description", key: "description", type: "textarea" },
        ],
      },
    ],
  };

  return JSON.stringify(blueprints[template] || [], null, 2);
}

function generateMainEntry(options: InitOptions): string {
  return `import { createServer } from "@ferriqa/api";
import config from "../ferriqa.config.ts";

async function main() {
  console.log("🚀 Starting ${options.projectName}...");
  
  const app = createServer(config);
  
  const port = config.server?.port || 3000;
  
  console.log(\`✅ Server running on http://localhost:\${port}\`);
  console.log(\`📚 API Documentation: http://localhost:\${port}/api/v1/docs\`);
}

main().catch(console.error);
`;
}
