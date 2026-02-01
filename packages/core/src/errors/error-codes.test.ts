/**
 * @ferriqa/core - Error codes tests
 *
 * Tests for error code enum and utilities
 */

import { describe, it, expect } from "bun:test";
import {
  ErrorCode,
  ERROR_CATEGORIES,
  getErrorPrefix,
  isErrorCategory,
  getDefaultStatusCode,
} from "./error-codes.js";

describe("Error Codes", () => {
  describe("ErrorCode enum", () => {
    it("should contain authentication error codes", () => {
      expect(ErrorCode.AUTH_INVALID_CREDENTIALS as string).toEqual(
        "AUTH_INVALID_CREDENTIALS",
      );
      expect(ErrorCode.AUTH_TOKEN_EXPIRED as string).toEqual(
        "AUTH_TOKEN_EXPIRED",
      );
      expect(ErrorCode.AUTH_UNAUTHORIZED as string).toEqual(
        "AUTH_UNAUTHORIZED",
      );
      expect(ErrorCode.AUTH_FORBIDDEN as string).toEqual("AUTH_FORBIDDEN");
    });

    it("should contain database error codes", () => {
      expect(ErrorCode.DB_CONNECTION_FAILED as string).toEqual(
        "DB_CONNECTION_FAILED",
      );
      expect(ErrorCode.DB_RECORD_NOT_FOUND as string).toEqual(
        "DB_RECORD_NOT_FOUND",
      );
      expect(ErrorCode.DB_UNIQUE_VIOLATION as string).toEqual(
        "DB_UNIQUE_VIOLATION",
      );
    });

    it("should contain validation error codes", () => {
      expect(ErrorCode.VALIDATION_INVALID_INPUT as string).toEqual(
        "VALIDATION_INVALID_INPUT",
      );
      expect(ErrorCode.VALIDATION_REQUIRED_FIELD as string).toEqual(
        "VALIDATION_REQUIRED_FIELD",
      );
    });

    it("should contain runtime error codes", () => {
      expect(ErrorCode.RUNTIME_UNSUPPORTED as string).toEqual(
        "RUNTIME_UNSUPPORTED",
      );
      expect(ErrorCode.RUNTIME_CAPABILITY_MISSING as string).toEqual(
        "RUNTIME_CAPABILITY_MISSING",
      );
    });

    it("should have unique error codes", () => {
      const codes = Object.values(ErrorCode);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toEqual(codes.length);
    });
  });

  describe("getErrorPrefix", () => {
    it("should extract prefix from error codes", () => {
      expect(getErrorPrefix(ErrorCode.AUTH_UNAUTHORIZED)).toEqual("AUTH");
      expect(getErrorPrefix(ErrorCode.DB_CONNECTION_FAILED)).toEqual("DB");
      expect(getErrorPrefix(ErrorCode.VALIDATION_INVALID_INPUT)).toEqual(
        "VALIDATION",
      );
    });

    it("should handle custom string codes", () => {
      expect(getErrorPrefix("CUSTOM_ERROR_CODE" as ErrorCode)).toEqual(
        "CUSTOM",
      );
    });
  });

  describe("isErrorCategory", () => {
    it("should correctly identify categories", () => {
      expect(isErrorCategory(ErrorCode.AUTH_UNAUTHORIZED, "AUTH")).toEqual(
        true,
      );
      expect(isErrorCategory(ErrorCode.DB_CONNECTION_FAILED, "DB")).toEqual(
        true,
      );
      expect(isErrorCategory(ErrorCode.AUTH_UNAUTHORIZED, "DB")).toEqual(false);
    });
  });

  describe("ERROR_CATEGORIES", () => {
    it("should contain all expected categories", () => {
      expect(ERROR_CATEGORIES).toContain("AUTH");
      expect(ERROR_CATEGORIES).toContain("DB");
      expect(ERROR_CATEGORIES).toContain("VALIDATION");
      expect(ERROR_CATEGORIES).toContain("RUNTIME");
      expect(ERROR_CATEGORIES).toContain("SYSTEM");
    });
  });

  describe("getDefaultStatusCode", () => {
    it("should return 401 for auth errors", () => {
      expect(getDefaultStatusCode(ErrorCode.AUTH_UNAUTHORIZED)).toEqual(401);
      expect(getDefaultStatusCode(ErrorCode.AUTH_INVALID_TOKEN)).toEqual(401);
    });

    it("should return 403 for forbidden", () => {
      expect(getDefaultStatusCode(ErrorCode.AUTH_FORBIDDEN)).toEqual(403);
    });

    it("should return 404 for not found", () => {
      expect(getDefaultStatusCode(ErrorCode.DB_RECORD_NOT_FOUND)).toEqual(404);
    });

    it("should return 409 for conflicts", () => {
      expect(getDefaultStatusCode(ErrorCode.DB_UNIQUE_VIOLATION)).toEqual(409);
    });

    it("should return 400 for validation errors", () => {
      expect(getDefaultStatusCode(ErrorCode.VALIDATION_INVALID_INPUT)).toEqual(
        400,
      );
    });

    it("should return 500 for runtime errors", () => {
      expect(getDefaultStatusCode(ErrorCode.RUNTIME_UNSUPPORTED)).toEqual(500);
    });

    it("should return 200 for system info", () => {
      expect(getDefaultStatusCode(ErrorCode.SYSTEM_INFO)).toEqual(200);
    });

    it("should return 429 for rate limit", () => {
      expect(getDefaultStatusCode(ErrorCode.SYSTEM_RATE_LIMIT)).toEqual(429);
    });

    it("should return 500 for unknown codes", () => {
      expect(getDefaultStatusCode("UNKNOWN_CODE" as ErrorCode)).toEqual(500);
    });
  });
});
