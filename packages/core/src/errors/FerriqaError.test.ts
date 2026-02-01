import { describe, it, expect } from "bun:test";
import {
  FerriqaError,
  FerriqaDatabaseError,
  FerriqaValidationError,
  FerriqaRuntimeError,
  FerriqaAuthError,
} from "./FerriqaError.js";
import { ErrorCode } from "./error-codes.js";

describe("FerriqaError", () => {
  describe("constructor", () => {
    it("should create error with code and message", () => {
      const error = new FerriqaError(
        ErrorCode.DB_CONNECTION_FAILED,
        "Connection failed",
      );
      expect(error.code).toBe(ErrorCode.DB_CONNECTION_FAILED);
      expect(error.message).toBe("Connection failed");
      expect(error.name).toBe("FerriqaError");
      expect(error.statusCode).toBe(500);
    });

    it("should auto-detect status code from error code", () => {
      const validationError = new FerriqaError(
        ErrorCode.VALIDATION_INVALID_INPUT,
        "Invalid",
      );
      expect(validationError.statusCode).toBe(400);

      const authError = new FerriqaError(
        ErrorCode.AUTH_UNAUTHORIZED,
        "Unauthorized",
      );
      expect(authError.statusCode).toBe(401);

      const notFoundError = new FerriqaError(
        ErrorCode.DB_RECORD_NOT_FOUND,
        "Not found",
      );
      expect(notFoundError.statusCode).toBe(404);
    });

    it("should accept custom status code", () => {
      const error = new FerriqaError(ErrorCode.DB_CONNECTION_FAILED, "Failed", {
        statusCode: 503,
      });
      expect(error.statusCode).toBe(503);
    });

    it("should capture timestamp", () => {
      const before = new Date();
      const error = new FerriqaError(ErrorCode.SYSTEM_INTERNAL_ERROR, "Test");
      const after = new Date();
      expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("should capture stack trace", () => {
      const error = new FerriqaError(ErrorCode.SYSTEM_INTERNAL_ERROR, "Test");
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("FerriqaError");
    });

    it("should accept cause error", () => {
      const cause = new Error("Original error");
      const error = new FerriqaError(ErrorCode.DB_CONNECTION_FAILED, "Failed", {
        cause,
      });
      expect(error.cause).toBe(cause);
    });

    it("should accept metadata", () => {
      const metadata = { userId: 123, action: "login" };
      const error = new FerriqaError(ErrorCode.AUTH_UNAUTHORIZED, "Failed", {
        metadata,
      });
      expect(error.metadata).toEqual(metadata);
    });
  });

  describe("toJSON", () => {
    it("should serialize to JSON", () => {
      const error = new FerriqaError(ErrorCode.DB_CONNECTION_FAILED, "Failed");
      const json = error.toJSON();
      expect(json.code).toBe(ErrorCode.DB_CONNECTION_FAILED);
      expect(json.message).toBe("Failed");
      expect(json.name).toBe("FerriqaError");
      expect(json.timestamp).toBeDefined();
      expect(json.stack).toBeDefined();
    });

    it("should not include default status code", () => {
      const error = new FerriqaError(ErrorCode.SYSTEM_INTERNAL_ERROR, "Failed");
      const json = error.toJSON();
      expect(json.statusCode).toBeUndefined();
    });

    it("should include non-default status code", () => {
      const error = new FerriqaError(
        ErrorCode.VALIDATION_INVALID_INPUT,
        "Invalid",
      );
      const json = error.toJSON();
      expect(json.statusCode).toBe(400);
    });
  });

  describe("serialization", () => {
    it("should round-trip through JSON", () => {
      const original = new FerriqaError(
        ErrorCode.DB_CONNECTION_FAILED,
        "Failed",
        {
          statusCode: 503,
          metadata: { userId: 123 },
        },
      );
      const json = original.toJSON();
      const reconstructed = FerriqaError.fromJSON(json);

      expect(reconstructed.code).toBe(original.code);
      expect(reconstructed.message).toBe(original.message);
      expect(reconstructed.statusCode).toBe(original.statusCode);
      expect(reconstructed.metadata).toEqual(original.metadata);
    });
  });
});

describe("FerriqaDatabaseError", () => {
  it("should set default status code to 500", () => {
    const error = new FerriqaDatabaseError(
      ErrorCode.DB_CONNECTION_FAILED,
      "Failed",
    );
    expect(error.statusCode).toBe(500);
  });

  it("should include operation and table", () => {
    const error = new FerriqaDatabaseError(
      ErrorCode.DB_QUERY_FAILED,
      "Failed",
      {
        operation: "SELECT",
        table: "users",
      },
    );
    expect(error.metadata?.operation).toBe("SELECT");
    expect(error.metadata?.table).toBe("users");
  });
});

describe("FerriqaValidationError", () => {
  it("should set default status code to 400", () => {
    const error = new FerriqaValidationError(
      ErrorCode.VALIDATION_INVALID_INPUT,
      "Invalid",
    );
    expect(error.statusCode).toBe(400);
  });

  it("should store field", () => {
    const error = new FerriqaValidationError(
      ErrorCode.VALIDATION_REQUIRED_FIELD,
      "Required",
      {
        field: "email",
      },
    );
    expect(error.field).toBe("email");
  });
});

describe("FerriqaRuntimeError", () => {
  it("should set default status code to 500", () => {
    const error = new FerriqaRuntimeError(
      ErrorCode.RUNTIME_UNSUPPORTED,
      "Unsupported",
    );
    expect(error.statusCode).toBe(500);
  });
});

describe("FerriqaAuthError", () => {
  it("should set default status code to 401", () => {
    const error = new FerriqaAuthError(
      ErrorCode.AUTH_UNAUTHORIZED,
      "Unauthorized",
    );
    expect(error.statusCode).toBe(401);
  });

  it("should include userId", () => {
    const error = new FerriqaAuthError(ErrorCode.AUTH_FORBIDDEN, "Forbidden", {
      userId: "user-123",
    });
    expect(error.metadata?.userId).toBe("user-123");
  });
});
