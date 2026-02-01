/**
 * Blueprint Engine Test
 *
 * Simple test to verify the blueprint module works
 */

import { validateBlueprint } from "../blueprint/validation";
import type { Blueprint } from "../blueprint/types";
import { DEFAULT_BLUEPRINTS } from "../blueprint/types";
import { FieldRegistry, globalFieldRegistry } from "../fields/registry";
import { ValidationEngine } from "../validation/engine";
import { slugify } from "../slug/manager";

// FIX: Wrapped tests in async IIFE to handle async operations properly
// Review comment #8: "Race condition in async test - Test 4 doesn't await validation"
// Previous code used .then() without await, causing tests to run out of order
// Now all tests execute sequentially with proper async/await
(async function runTests() {
  console.log("=== Blueprint Engine Test ===\n");

  // Test 1: Field Registry
  console.log("1. Testing Field Registry...");
  const registry = new FieldRegistry();
  const types = registry.getAllTypes();
  console.log(`   ✓ Available field types: ${types.length}`);
  console.log(`   ✓ Types: ${types.slice(0, 5).join(", ")}...`);

  // Test 2: Blueprint Validation
  console.log("\n2. Testing Blueprint Validation...");
  const validBlueprint = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Blog Posts",
    slug: "posts",
    description: "Blog yazıları için content type",
    fields: [
      {
        id: "field-1",
        name: "Title",
        key: "title",
        type: "text",
        required: true,
      },
      {
        id: "field-2",
        name: "Content",
        key: "content",
        type: "textarea",
        required: false,
      },
    ],
    settings: {
      draftMode: true,
      versioning: true,
      defaultStatus: "draft" as const,
      apiAccess: "public" as const,
      cacheEnabled: true,
      displayField: "title",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = validateBlueprint(validBlueprint);
  if (result.success) {
    console.log("   ✓ Valid blueprint validated successfully");
  } else {
    console.log("   ✗ Blueprint validation failed:", result.errors);
  }

  // Test 3: Invalid Blueprint
  console.log("\n3. Testing Invalid Blueprint...");
  const invalidBlueprint = {
    ...validBlueprint,
    slug: "Invalid_Slug_With_Uppercase_And_Spaces",
  };
  const invalidResult = validateBlueprint(invalidBlueprint);
  if (!invalidResult.success) {
    console.log("   ✓ Invalid blueprint correctly rejected");
  } else {
    console.log("   ✗ Should have failed validation");
  }

  // Test 4: Validation Engine
  console.log("\n4. Testing Validation Engine...");
  const engine = new ValidationEngine(globalFieldRegistry);
  const testContent = {
    title: "Hello World",
    content: "This is a test post",
  };
  // FIX: Using await instead of .then() to ensure sequential test execution
  const validation = await engine.validateContent(
    validBlueprint as Blueprint,
    testContent,
    "create",
  );
  if (validation.valid) {
    console.log("   ✓ Content validation passed");
    console.log(`   ✓ Sanitized: ${JSON.stringify(validation.sanitized)}`);
  } else {
    console.log("   ✗ Content validation failed:", validation.errors);
  }

  // Test 5: Slug Manager
  console.log("\n5. Testing Slug Manager...");
  const testSlug = slugify("Hello World! This is a Test");
  console.log(`   ✓ Slugify: "Hello World! This is a Test" -> "${testSlug}"`);

  // Test 6: Field Handlers
  console.log("\n6. Testing Field Handlers...");
  const textHandler = registry.get("text");
  if (textHandler) {
    const errors = textHandler.validate("test", [
      { type: "required" },
      { type: "minLength", value: 3 },
    ]);
    if (errors.length === 0) {
      console.log("   ✓ Text field validation passed");
    } else {
      console.log("   ✗ Text field validation failed:", errors);
    }
  }

  // Test 7: Date Field Empty String Handling
  console.log("\n7. Testing Date Field Empty String Handling...");
  const dateHandler = registry.get("date");
  if (dateHandler) {
    // Empty string with required rule should fail with "Required" error
    const requiredErrors = dateHandler.validate("", [{ type: "required" }]);
    if (requiredErrors.some((e) => e.message.includes("Required"))) {
      console.log("   ✓ Date field with required rule rejects empty string");
    } else {
      console.log(
        "   ✗ Date field should reject empty string for required fields",
      );
    }

    // Empty string without required rule should pass (treated as "no value")
    const optionalErrors = dateHandler.validate("", []);
    if (optionalErrors.length === 0) {
      console.log(
        "   ✓ Date field without required rule accepts empty string (as 'no value')",
      );
    } else {
      console.log(
        "   ✗ Date field should accept empty string for optional fields",
      );
    }
  }

  // Test 8: FIX - Email field auto-validation
  console.log("\n8. Testing Email Field Auto-Validation Fix...");
  const emailHandler = registry.get("email");
  if (emailHandler) {
    const errors = emailHandler.validate("invalid-email", []);
    if (errors.length > 0) {
      console.log(
        "   ✓ Email field auto-validates format (no explicit rule needed)",
      );
    } else {
      console.log("   ✗ Email field should auto-validate but didn't");
    }

    const validEmail = emailHandler.validate("test@example.com", []);
    if (validEmail.length === 0) {
      console.log("   ✓ Valid email passes validation");
    } else {
      console.log("   ✗ Valid email should pass but failed:", validEmail);
    }
  }

  // Test 9: FIX - URL field auto-validation
  console.log("\n9. Testing URL Field Auto-Validation Fix...");
  const urlHandler = registry.get("url");
  if (urlHandler) {
    const errors = urlHandler.validate("not-a-url", []);
    if (errors.length > 0) {
      console.log(
        "   ✓ URL field auto-validates format (no explicit rule needed)",
      );
    } else {
      console.log("   ✗ URL field should auto-validate but didn't");
    }

    const validUrl = urlHandler.validate("https://example.com", []);
    if (validUrl.length === 0) {
      console.log("   ✓ Valid URL passes validation");
    } else {
      console.log("   ✗ Valid URL should pass but failed:", validUrl);
    }
  }

  // Test 10: FIX - TextField RegExp Error Handling
  console.log("\n10. Testing TextField RegExp Error Handling Fix...");
  if (textHandler) {
    const errors = textHandler.validate("test", [
      { type: "pattern", value: "[invalid(regex" },
    ]);
    // Using `some()` without explicit length check - it returns false for empty arrays
    if (errors.some((e) => e.message.includes("regex"))) {
      console.log("   ✓ TextField catches invalid regex pattern errors");
    } else {
      console.log("   ✗ TextField should catch regex errors but didn't");
    }
  }

  // Test 11: FIX - BooleanField Empty String Handling
  console.log("\n11. Testing BooleanField Empty String Fix...");
  const booleanHandler = registry.get("boolean");
  if (booleanHandler) {
    // FIX: Empty string should be treated as "no value" (null), not false
    // Review comment #5: "BooleanField Silently Converts Empty String to False"
    const deserializedValue = booleanHandler.deserialize("");
    if (deserializedValue === null) {
      console.log("   ✓ BooleanField treats empty string as null (no value)");
    } else {
      console.log(
        `   ✗ BooleanField should treat empty string as null, got: ${deserializedValue}`,
      );
    }

    // "true" string should deserialize to true
    const trueValue = booleanHandler.deserialize("true");
    if (trueValue === true) {
      console.log("   ✓ BooleanField correctly deserializes 'true' string");
    } else {
      console.log(
        `   ✗ BooleanField should deserialize 'true' to true, got: ${trueValue}`,
      );
    }

    // "false" string should deserialize to false
    const falseValue = booleanHandler.deserialize("false");
    if (falseValue === false) {
      console.log("   ✓ BooleanField correctly deserializes 'false' string");
    } else {
      console.log(
        `   ✗ BooleanField should deserialize 'false' to false, got: ${falseValue}`,
      );
    }
  }

  // Test 12: DEFAULT_BLUEPRINTS validation
  console.log("\n12. Testing DEFAULT_BLUEPRINTS Schema Validation...");
  // NOTE: Testing that default blueprints pass Zod schema validation
  // Review comment #7: "Schema Validation Mismatch - DEFAULT_BLUEPRINTS used plain string IDs"
  // All field IDs and blueprint IDs must be valid UUIDs per the Zod schema
  const usersBlueprint = {
    id: "550e8400-e29b-41d4-a716-446655440010",
    ...DEFAULT_BLUEPRINTS.users,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mediaBlueprint = {
    id: "550e8400-e29b-41d4-a716-446655440020",
    ...DEFAULT_BLUEPRINTS.media,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const usersResult = validateBlueprint(usersBlueprint);
  const mediaResult = validateBlueprint(mediaBlueprint);
  if (usersResult.success && mediaResult.success) {
    console.log("   ✓ DEFAULT_BLUEPRINTS pass schema validation");
  } else {
    console.log("   ✗ DEFAULT_BLUEPRINTS failed schema validation");
    if (!usersResult.success)
      console.log("     Users blueprint errors:", usersResult.errors);
    if (!mediaResult.success)
      console.log("     Media blueprint errors:", mediaResult.errors);
  }

  console.log("\n=== All Tests Complete ===");
})(); // Close async IIFE
