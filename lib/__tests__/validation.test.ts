import {
  parseJson,
  parseCheckoutResponse,
  parseErrorResponse,
  parseUsernameRequest,
  parseCreditsRequest,
  isTrustReport,
  parseTrustReport,
} from "../validation";
import type { TrustReport } from "@/types/trust";

describe("Validation Utilities", () => {
  describe("parseJson", () => {
    const stringValidator = (data: unknown): data is string =>
      typeof data === "string";
    const numberValidator = (data: unknown): data is number =>
      typeof data === "number";
    const arrayValidator = (data: unknown): data is number[] =>
      Array.isArray(data) && data.every((n) => typeof n === "number");

    it("should validate string data", () => {
      const result = parseJson("test", stringValidator);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe("test");
      }
    });

    it("should return error for invalid type", () => {
      const result = parseJson(123, stringValidator);
      expect(result.isErr()).toBe(true);
    });

    it("should validate number data", () => {
      const result = parseJson(42, numberValidator);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(42);
      }
    });

    it("should validate array data", () => {
      const result = parseJson([1, 2, 3], arrayValidator);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([1, 2, 3]);
      }
    });
  });

  describe("parseCheckoutResponse", () => {
    it("should parse valid checkout response", () => {
      const valid = { url: "https://checkout.stripe.com/test" };
      const result = parseCheckoutResponse(valid);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.url).toBe("https://checkout.stripe.com/test");
      }
    });

    it("should return error for missing url", () => {
      const invalid = {};
      const result = parseCheckoutResponse(invalid);
      expect(result.isErr()).toBe(true);
    });

    it("should return error for non-string url", () => {
      const invalid = { url: 123 };
      const result = parseCheckoutResponse(invalid);
      expect(result.isErr()).toBe(true);
    });
  });

  describe("parseErrorResponse", () => {
    it("should parse valid error response", () => {
      const valid = { error: "Something went wrong", code: "ERROR_CODE" };
      const result = parseErrorResponse(valid);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.error).toBe("Something went wrong");
        expect(result.value.code).toBe("ERROR_CODE");
      }
    });

    it("should return error for missing error field", () => {
      const invalid = { code: "ERROR_CODE" };
      const result = parseErrorResponse(invalid);
      expect(result.isErr()).toBe(true);
    });

    it("should return error for missing code field", () => {
      const invalid = { error: "Something went wrong" };
      const result = parseErrorResponse(invalid);
      expect(result.isErr()).toBe(true);
    });
  });

  describe("parseUsernameRequest", () => {
    it("should parse valid username request", () => {
      const valid = { username: "testuser" };
      const result = parseUsernameRequest(valid);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.username).toBe("testuser");
      }
    });

    it("should parse request without username (optional)", () => {
      const valid = {};
      const result = parseUsernameRequest(valid);
      expect(result.isOk()).toBe(true);
    });

    it("should return error for non-string username", () => {
      const invalid = { username: 123 };
      const result = parseUsernameRequest(invalid);
      expect(result.isErr()).toBe(true);
    });
  });

  describe("parseCreditsRequest", () => {
    it("should parse valid credits request", () => {
      const valid = { credits: 50 };
      const result = parseCreditsRequest(valid);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.credits).toBe(50);
      }
    });

    it("should parse request without credits (optional)", () => {
      const valid = {};
      const result = parseCreditsRequest(valid);
      expect(result.isOk()).toBe(true);
    });

    it("should return error for non-number credits", () => {
      const invalid = { credits: "50" };
      const result = parseCreditsRequest(invalid);
      expect(result.isErr()).toBe(true);
    });
  });

  describe("isTrustReport", () => {
    it("should return true for valid TrustReport", () => {
      const valid: TrustReport = {
        userInfo: {
          id: "123",
          username: "test",
          name: "Test User",
          followersCount: 1000,
          followingCount: 500,
          createdAt: "2020-01-01T00:00:00.000Z",
          blueVerified: false,
          description: "Test",
        },
        score: 75,
        verdict: "TRUSTED",
        flags: [],
        breakdown: [],
        confidence: 0.8,
        positiveIndicators: [],
      };

      expect(isTrustReport(valid)).toBe(true);
    });

    it("should return false for missing required fields", () => {
      const invalid = {
        score: 75,
        verdict: "TRUSTED",
        // Missing userInfo, flags, etc.
      };

      expect(isTrustReport(invalid)).toBe(false);
    });

    it("should return false for wrong types", () => {
      const invalid = {
        userInfo: {},
        score: "75", // Should be number
        verdict: "TRUSTED",
        flags: [],
      };

      expect(isTrustReport(invalid)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isTrustReport(null)).toBe(false);
    });
  });

  describe("parseTrustReport", () => {
    it("should parse valid TrustReport", () => {
      const valid: TrustReport = {
        userInfo: {
          id: "123",
          username: "test",
          name: "Test User",
          followersCount: 1000,
          followingCount: 500,
          createdAt: "2020-01-01T00:00:00.000Z",
          blueVerified: false,
          description: "Test",
        },
        score: 75,
        verdict: "TRUSTED",
        flags: [],
        breakdown: [],
        confidence: 0.8,
        positiveIndicators: [],
      };

      const result = parseTrustReport(valid);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.score).toBe(75);
        expect(result.value.verdict).toBe("TRUSTED");
      }
    });

    it("should return error for invalid TrustReport", () => {
      const invalid = {
        score: 75,
        // Missing required fields
      };

      const result = parseTrustReport(invalid);
      expect(result.isErr()).toBe(true);
    });
  });
});
