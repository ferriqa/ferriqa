# @ferriqa/cli

Ferriqa Headless CMS Command Line Interface

## 🚀 Getting Started

```bash
# Install CLI globally
npm install -g @ferriqa/cli

# Or use with npx
npx @ferriqa/cli init my-project
```

## 📚 Available Commands

### `ferriqa init [project-name]`

Create a new Ferriqa project with interactive prompts.

```bash
ferriqa init my-blog
# Interactive prompts for:
# - Template selection (basic, blog, ecommerce)
# - Database choice (SQLite, PostgreSQL)
# - Features (auth, media, webhooks)
# - Port configuration
```

**Features:**

- Interactive project scaffolding
- Multiple templates (basic, blog, ecommerce)
- Database configuration
- Feature selection (auth, media, webhooks)
- Automatic config generation

### `ferriqa dev`

Start the development server with hot reload.

```bash
ferriqa dev
ferriqa dev --port=8080
ferriqa dev --no-watch
```

**Options:**

- `--port=<number>` - Custom port (default: 3000)
- `--host=<string>` - Custom host (default: localhost)
- `--no-watch` - Disable file watching

### `ferriqa db <subcommand>`

Database operations.

```bash
# Run migrations
ferriqa db migrate
ferriqa db migrate --dry-run

# Rollback migrations
ferriqa db rollback
ferriqa db rollback 3

# Seed database
ferriqa db seed
ferriqa db seed custom-seed.ts

# Reset database (⚠️ Destructive)
ferriqa db reset --force

# Check migration status
ferriqa db status

# Create new migration
ferriqa db create add_users_table
```

### `ferriqa blueprint <subcommand>`

Blueprint (content type) management.

```bash
# List all blueprints
ferriqa blueprint list

# Create new blueprint
ferriqa blueprint create
ferriqa blueprint create "Blog Post"

# Delete blueprint
ferriqa blueprint delete posts

# Export blueprints
ferriqa blueprint export
ferriqa blueprint export ts types.ts

# Import blueprints
ferriqa blueprint import backup.json
```

### `ferriqa plugin <subcommand>`

Plugin management.

```bash
# List installed plugins
ferriqa plugin list

# Install plugin
ferriqa plugin add seo
ferriqa plugin add  # Interactive selection

# Remove plugin
ferriqa plugin remove seo

# Create custom plugin
ferriqa plugin create "My Plugin"
```

## 🏗 Project Structure

When you run `ferriqa init`, it creates:

```
my-project/
├── src/
│   └── index.ts              # Main entry point
├── migrations/               # Database migrations
├── ferriqa.config.ts        # Ferriqa configuration
├── blueprints.json          # Content type definitions
├── .env                     # Environment variables
├── .env.example             # Example environment file
├── package.json             # Project dependencies
└── README.md                # Project documentation
```

## ⚙️ Configuration

The `ferriqa.config.ts` file:

```typescript
import { defineConfig } from "@ferriqa/core";

export default defineConfig({
  name: "my-project",

  server: {
    port: 3000,
    host: "localhost",
  },

  database: {
    type: "sqlite",
    url: "./data.db",
  },

  auth: {
    enabled: true,
    jwtSecret: process.env.JWT_SECRET,
  },

  plugins: ["seo", "localization"],
});
```

## 🎨 CLI Features

- **Interactive Prompts**: Beautiful UI with @clack/prompts
- **Hot Reload**: Automatic server restart on file changes
- **Template System**: Pre-built project templates
- **Field Types**: 14 different field types for blueprints
- **Plugin Ecosystem**: Easy plugin installation and management
- **Type Safety**: Full TypeScript support

## 🧪 Development

```bash
# Install dependencies
bun install

# Run in development mode
bun dev

# Build for production
bun run build

# Run tests
bun test
```

## 📖 Examples

### Creating a Blog

```bash
# Initialize project
ferriqa init my-blog

# Select "blog" template
# Enable auth and media features

cd my-blog

# Run migrations
ferriqa db migrate

# Start development server
ferriqa dev

# Your API is now running at http://localhost:3000
# - GET /api/v1/contents/posts
# - POST /api/v1/contents/posts
```

### Adding a Custom Blueprint

```bash
ferriqa blueprint create

# Blueprint name: Product
# Slug: products
# Fields:
#   - Title (text, required)
#   - Description (textarea)
#   - Price (number, required)
#   - Image (media)

ferriqa db migrate
# New table created for products
```

### Installing Plugins

```bash
# View available plugins
ferriqa plugin list

# Install SEO plugin
ferriqa plugin add seo

# Install multiple plugins
ferriqa plugin add
# Interactive multi-select

ferriqa db migrate
# Apply plugin migrations
```

## 🔧 Global Options

```bash
ferriqa [command] [options]

Options:
  -h, --help          Show help
  -v, --verbose       Enable verbose logging
  --version           Show version
  -c, --config <path> Path to config file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT © Ferriqa Team
