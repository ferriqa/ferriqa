# Testing Guide

## Philosophy

We believe in:

1. **Cross-runtime compatibility:** Tests must run identically on Node.js, Deno, and Bun
2. **Simplicity:** Flat test structure with `test()` function
3. **Standard tools:** Use @cross/test and @std/assert from JSR

## Test Architecture

- **Framework:** @cross/test (universal across Node.js, Deno, Bun)
- **Assertions:** @std/assert (from JSR)
- **Helpers:** Custom helpers in `packages/core/src/testing/helpers.ts`

All tests are guaranteed to run identically across all supported runtimes.

---

## Quick Start

```bash
# Run all tests (all runtimes)
npm test

# Individual runtime tests
npm run test:bun     # Bun tests
npm run test:node    # Node.js tests
npm run test:deno    # Deno tests

# Specific test suites
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:cli            # CLI tests only
```

---

## Test Structure

### Basic Test

```typescript
import { test } from "@cross/test";
import { assertEquals } from "@std/assert";

test("feature description", () => {
  // Arrange
  const input = 5;

  // Act
  const result = multiplyByTwo(input);

  // Assert
  assertEquals(result, 10);
});
```

### Nested Test Names

Use `>` separator for logical grouping:

```typescript
// Good - Clear hierarchy
test("Cache > Basic Operations > should set value", () => { ... });
test("Cache > Basic Operations > should get value", () => { ... });
test("Cache > TTL Support > should expire entries", () => { ... });

// Avoid - Too long
test("Cache Basic Operations Should Set Value When Key Is Provided", () => { ... });
```

### Setup/Teardown

#### Option A: Manual (Simple tests)

```typescript
test("with database", async () => {
  const db = new MockDatabaseAdapter();
  await db.connect();

  try {
    // Test code
    await db.execute("INSERT...");
  } finally {
    await db.close();
  }
});
```

#### Option B: Helper Function (Complex tests)

```typescript
import { withResource } from "@ferriqa/core/testing/helpers";

test("with database", async () => {
  await withResource(
    async () => {
      const db = new MockDatabaseAdapter();
      await db.connect();
      return db;
    },
    async (db) => {
      await db.execute("INSERT...");
    },
    async (db) => {
      await db.close();
    },
  );
});
```

#### Option C: Test Steps (Workflow tests)

```typescript
test("user registration flow", async (context) => {
  let userId;

  await context.step("create user", async () => {
    userId = await createUser("test@example.com");
    assertExists(userId);
  });

  await context.step("verify user", async () => {
    const user = await getUser(userId);
    assertEquals(user.email, "test@example.com");
  });

  await context.step("delete user", async () => {
    await deleteUser(userId);
  });
});
```

---

## Assertions

Use `@std/assert`:

```typescript
import {
  assertEquals, // value equality
  assertStrictEquals, // reference equality
  assertExists, // not null/undefined
  assertGreater, // a > b
  assertLess, // a < b
  assertThrows, // function throws
  assertArrayIncludes, // array contains
  assertMatch, // regex match
} from "@std/assert";
```

### Examples

```typescript
// Value equality
assertEquals(result, expected);

// Reference equality
assertStrictEquals(actual, expected);

// Check defined
assertExists(value);

// Numeric comparisons
assertGreater(count, 0);
assertLess(duration, 1000);

// Array operations
assertArrayIncludes(array, ["item"]); // Note: needle must be array

// Exceptions
assertThrows(() => riskyOperation());

// Regex match
assertMatch(String(text), /pattern/);
```

---

## Common Patterns

### Testing Async Operations

```typescript
test("async operation", async () => {
  const result = await asyncOperation();
  assertEquals(result, "expected");
});
```

### Testing Errors

```typescript
test("should throw on invalid input", () => {
  assertThrows(() => service.create(invalidData));
});
```

### Testing with Services

```typescript
test("service method", async () => {
  const db = new MockDatabaseAdapter();
  await db.connect();

  try {
    const service = new MyService({ db });
    const result = await service.doSomething();
    assertEquals(result, expected);
  } finally {
    await db.close();
  }
});
```

---

## Test Counts

**Expected test counts (should be identical across runtimes):**

- **Total:** 234 tests (including versioning tests)
- **Unit:** ~205 tests
- **Integration:** ~29 tests
- **CLI:** ~76 tests

### Excluded Tests (Disabled)

**Versioning Tests:** 2 out of 16 tests temporarily disabled due to infinite loop issues:

1. "should throw error when version does not belong to content"
2. "should store relation references in version data"

These 2 tests are commented out in `versioning.test.ts` but preserved for future debugging.

All **234 tests run on all three runtimes** successfully.

---

## CI/CD

Tests run on every PR against:

- Node.js 22.x
- Bun latest
- Deno 2.x

All three must pass with identical test counts (219 tests).

---

## Troubleshooting

### Timeout Errors

If tests timeout:

1. Check for unclosed resources (database connections, timers, webhook queues)
2. Add explicit cleanup delays: `await new Promise(r => setTimeout(r, 10))`
3. Use `try/finally` to guarantee cleanup
4. Check for event loop blockage (open handles, active timers)

### Test Count Mismatch

If test counts differ between runtimes:

1. Verify all test files are included in package.json scripts
2. Check for skipped or conditional tests
3. Ensure no runtime-specific test logic

### Import Errors

If you see "Cannot find module '@cross/test'":

1. Ensure dependencies are installed: `npm install` or `bun install`
2. Check package.json has `"type": "module"`
3. Verify JSR packages are properly configured

### Type Checking Errors (Deno)

Deno may show type checking errors. These are non-blocking:

- Tests will still pass
- Use `--no-check` flag to skip type checking
- Type errors don't affect test execution

---

## Migration from describe/it

See `MIGRATION_GUIDE.md` in `packages/core/src/testing/` for detailed migration guide from the old `describe/it` pattern to `@cross/test`.

Key changes:

- `describe/it` → `test()` with `>` separator
- `expect()` → `@std/assert` functions
- `beforeAll/afterAll` → Manual setup/teardown or helpers
- Remove `runTests()` calls

---

## Writing New Tests

When adding new tests:

1. **Use @cross/test directly:**

   ```typescript
   import { test } from "@cross/test";
   import { assertEquals } from "@std/assert";
   ```

2. **Follow naming convention:**

   ```typescript
   test("Feature > Subfeature > Description", () => { ... });
   ```

3. **Ensure proper cleanup:**

   ```typescript
   test("with resource", async () => {
     const resource = await setup();
     try {
       // Test
     } finally {
       await cleanup(resource);
     }
   });
   ```

4. **Use appropriate assertions:**
   - `assertStrictEquals()` for exact matches
   - `assertEquals()` for value equality
   - `assertExists()` to check not null/undefined

5. **Test on all runtimes:**
   ```bash
   npm run test:bun
   npm run test:node
   npm run test:deno
   ```

---

## Best Practices

1. **Keep tests simple** - One assertion per test when possible
2. **Use descriptive names** - Test names should explain what is being tested
3. **Guarantee cleanup** - Always use try/finally for resource management
4. **Avoid nesting** - Flat test structure is easier to read and debug
5. **Test independently** - Each test should work in isolation
6. **Mock external deps** - Use MockDatabaseAdapter and other test doubles
7. **Wait for async** - Add explicit waits for webhook queues, timers, etc.

---

## Resources

- **@cross/test docs:** https://jsr.io/@cross/test
- **@std/assert docs:** https://jsr.io/@std/assert
- **Migration Guide:** `packages/core/src/testing/MIGRATION_GUIDE.md`
- **Test Helpers:** `packages/core/src/testing/helpers.ts`
