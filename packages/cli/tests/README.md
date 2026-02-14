# Ferriqa CLI Integration Tests

This directory contains cross-runtime integration tests for Ferriqa CLI.

## 🎯 Cross-Runtime Support

Tests run on the following runtimes:

- ✅ **Bun** (primary)
- ✅ **Node.js** (18+)
- ✅ **Deno** (1.40+)

## Test Structure

```
tests/
├── setup.ts           # Global test setup (cross-runtime)
├── utils.ts           # Cross-runtime test utilities
├── mocks/
│   ├── clack.ts      # @clack/prompts mocks
│   └── database.ts   # Database mocks
├── init.test.ts      # `ferriqa init` command tests
├── dev.test.ts       # `ferriqa dev` command tests
├── db.test.ts        # `ferriqa db` command tests
├── blueprint.test.ts # `ferriqa blueprint` command tests
├── plugin.test.ts    # `ferriqa plugin` command tests
└── cli.test.ts       # CLI entry point tests
```

## 🚀 Running Tests

### With Bun

```bash
cd packages/cli
bun test
```

### With Node.js

```bash
cd packages/cli
node --test tests/**/*.test.ts
```

### With Deno

```bash
cd packages/cli
deno task test
# or
deno test --allow-all tests/
```

### With Coverage

```bash
# Bun
bun test --coverage

# Deno
deno test --coverage=coverage --allow-all tests/
```

## 🧪 Cross-Runtime Testing Framework

Tests use the `@ferriqa/core/testing` module:

```typescript
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  runTests,
} from "@ferriqa/core/testing";

describe("my test suite", () => {
  it("should work across all runtimes", () => {
    expect(true).toBe(true);
  });
});

runTests();
```

### Cross-Runtime Utilities

```typescript
import { crossFs, createTestContext, cleanupTestContext } from "./utils.ts";

// Cross-runtime filesystem operations
const fs = await crossFs();
await fs.writeFile("path/to/file.txt", "content");
const content = await fs.readFile("path/to/file.txt");

// Test context management
const context = await createTestContext();
// ... test code ...
await cleanupTestContext(context);
```

## 📊 Test Summary

| Command     | Test Count | Covered Scenarios                |
| ----------- | ---------- | -------------------------------- |
| `init`      | 8          | Templates, databases, validation |
| `dev`       | 7          | Config, options, validation      |
| `db`        | 16         | Migrations, seed, reset, status  |
| `blueprint` | 21         | CRUD, export, import             |
| `plugin`    | 15         | Install, remove, scaffold        |
| `CLI`       | 5          | Entry point, routing             |

**Total: 67+ tests**

## 🔧 Mock Systems

### 1. Filesystem Mock (`utils.ts`)

- Creates temporary directories
- Cross-runtime filesystem operations
- Automatic cleanup

### 2. Clack Prompts Mock (`mocks/clack.ts`)

- Simulates user interactions
- Non-interactive test environment

### 3. Database Mock (`mocks/database.ts`)

- Mocks migration operations
- In-memory database

## 📝 Example Test

```typescript
import { describe, it, expect, runTests } from "@ferriqa/core/testing";
import { initCommand } from "../src/commands/init.ts";
import { createTestContext, cleanupTestContext } from "./utils.ts";

describe("init command", () => {
  it("should create project with basic template", async () => {
    const context = await createTestContext();

    // Mock user inputs
    const p = await import("@clack/prompts");
    Object.assign(p, {
      select: async () => "basic",
      text: async () => "3000",
    });

    await initCommand(["my-app"], {
      cwd: context.cwd,
      verbose: false,
    });

    // Verify files created
    await assertFileExists(context, "my-app/package.json");

    await cleanupTestContext(context);
  });
});

runTests();
```

## 🔄 CI/CD Integration

GitHub Actions workflow tests all runtimes:

```yaml
# .github/workflows/cli-tests.yml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]
    runtime: [bun, deno]
    version: ["1.0.0", "latest"]
```

### Manual CI Test

```bash
# Test all runtimes
./scripts/test-all-runtimes.sh
```

## 🛠 Debug Tips

### Run Specific Test

```bash
# Bun
bun test tests/init.test.ts

# Node.js
node --test tests/init.test.ts

# Deno
deno test --allow-all tests/init.test.ts
```

### Verbose Mode

```bash
DEBUG=true bun test
VERBOSE=true deno test --allow-all tests/
```

### Watch Mode

```bash
# Bun
bun test --watch

# Deno
deno test --watch --allow-all tests/
```

## 📚 Useful Resources

- [@cross/test Documentation](https://github.com/cross-org/test)
- [@std/assert Documentation](https://deno.land/std/assert)
- [Ferriqa Core Testing](../core/src/testing/)

## 🐛 Known Issues

1. **Deno fs types**: Deno's `readTextFile` can return string or Buffer. This is handled in `utils.ts`.

2. **Path handling**: Different OS have different path separators. The `crossPath()` function normalizes this.

3. **Environment variables**: Deno uses `Deno.env`, Node.js/Bun use `process.env`. `utils.ts` abstracts this.

## 🤝 Contributing

When adding new tests:

1. Ensure cross-runtime compatibility
2. Use `crossFs()` for filesystem operations
3. Import `@ferriqa/core/testing` module
4. Add `runTests()` call at the end of tests
5. Each test should be independent (clean setup/teardown)
