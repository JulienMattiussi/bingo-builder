import { describe, it, expect, beforeEach } from "vitest";
import { userIdUtils } from "../../utils/userId";

describe("userIdUtils", () => {
  const TEST_USER_ID = "test-user-id-12345";

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe("getUserId", () => {
    it("should generate and store a new user ID if none exists", () => {
      const userId = userIdUtils.getUserId();

      expect(userId).toBeTruthy();
      expect(typeof userId).toBe("string");
      expect(userId.length).toBeGreaterThan(0);

      // Verify it was stored
      const stored = localStorage.getItem("bingo-user-id");
      expect(stored).toBe(userId);
    });

    it("should return existing user ID if one exists", () => {
      // Set a user ID first
      localStorage.setItem("bingo-user-id", TEST_USER_ID);

      const userId = userIdUtils.getUserId();

      expect(userId).toBe(TEST_USER_ID);
    });

    it("should generate UUID-like format", () => {
      const userId = userIdUtils.getUserId();

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(userId)).toBe(true);
    });
  });

  describe("hasUserId", () => {
    it("should return true when user ID exists", () => {
      localStorage.setItem("bingo-user-id", TEST_USER_ID);

      expect(userIdUtils.hasUserId()).toBe(true);
    });

    it("should return false when user ID does not exist", () => {
      expect(userIdUtils.hasUserId()).toBe(false);
    });
  });

  describe("getExistingUserId", () => {
    it("should return existing user ID without creating new one", () => {
      localStorage.setItem("bingo-user-id", TEST_USER_ID);

      const userId = userIdUtils.getExistingUserId();

      expect(userId).toBe(TEST_USER_ID);
    });

    it("should return null when no user ID exists", () => {
      const userId = userIdUtils.getExistingUserId();

      expect(userId).toBeNull();

      // Verify no ID was created
      expect(localStorage.getItem("bingo-user-id")).toBeNull();
    });
  });

  describe("clearUserId", () => {
    it("should remove user ID from localStorage", () => {
      localStorage.setItem("bingo-user-id", TEST_USER_ID);

      userIdUtils.clearUserId();

      expect(localStorage.getItem("bingo-user-id")).toBeNull();
      expect(userIdUtils.hasUserId()).toBe(false);
    });

    it("should not throw error when clearing non-existent user ID", () => {
      expect(() => userIdUtils.clearUserId()).not.toThrow();
    });
  });

  describe("restoreUserId", () => {
    it("should restore user ID to localStorage", () => {
      userIdUtils.restoreUserId(TEST_USER_ID);

      expect(localStorage.getItem("bingo-user-id")).toBe(TEST_USER_ID);
      expect(userIdUtils.getUserId()).toBe(TEST_USER_ID);
    });

    it("should overwrite existing user ID", () => {
      localStorage.setItem("bingo-user-id", "old-user-id");

      userIdUtils.restoreUserId(TEST_USER_ID);

      expect(localStorage.getItem("bingo-user-id")).toBe(TEST_USER_ID);
    });

    it("should throw error for invalid user ID (empty string)", () => {
      expect(() => userIdUtils.restoreUserId("")).toThrow("Invalid user ID");
    });

    it("should throw error for invalid user ID (null)", () => {
      expect(() =>
        userIdUtils.restoreUserId(null as unknown as string),
      ).toThrow("Invalid user ID");
    });

    it("should throw error for invalid user ID (number)", () => {
      expect(() => userIdUtils.restoreUserId(123 as unknown as string)).toThrow(
        "Invalid user ID",
      );
    });
  });
});
