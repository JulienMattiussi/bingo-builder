/**
 * Tests for frontend configuration management
 * Tests config getters and structure with current environment
 */
import { describe, it, expect } from "vitest";
import config from "../config";

describe("Config", () => {
  describe("Configuration Structure", () => {
    it("should have apiPort property", () => {
      expect(typeof config.apiPort).toBe("number");
      expect(config.apiPort).toBeGreaterThan(0);
      expect(config.apiPort).toBeLessThanOrEqual(65535);
    });

    it("should have port property", () => {
      expect(typeof config.port).toBe("number");
      expect(config.port).toBeGreaterThan(0);
      expect(config.port).toBeLessThanOrEqual(65535);
    });

    it("should have apiUrl getter", () => {
      expect(config.apiUrl).toBe(`http://localhost:${config.apiPort}`);
    });

    it("should have cardTitleMaxLength", () => {
      expect(typeof config.cardTitleMaxLength).toBe("number");
      expect(config.cardTitleMaxLength).toBeGreaterThan(0);
    });

    it("should have tileMaxLength", () => {
      expect(typeof config.tileMaxLength).toBe("number");
      expect(config.tileMaxLength).toBeGreaterThan(0);
    });

    it("should have playerNameMaxLength", () => {
      expect(typeof config.playerNameMaxLength).toBe("number");
      expect(config.playerNameMaxLength).toBeGreaterThan(0);
    });

    it("should have maxPlayersPerCard", () => {
      expect(typeof config.maxPlayersPerCard).toBe("number");
      expect(config.maxPlayersPerCard).toBeGreaterThan(0);
    });

    it("should have maxPublishedCards", () => {
      expect(typeof config.maxPublishedCards).toBe("number");
      expect(config.maxPublishedCards).toBeGreaterThan(0);
    });

    it("should have maxUnpublishedCards", () => {
      expect(typeof config.maxUnpublishedCards).toBe("number");
      expect(config.maxUnpublishedCards).toBeGreaterThan(0);
    });
  });

  describe("Limits Getter", () => {
    it("should provide limits object with all properties", () => {
      const limits = config.limits;

      expect(limits).toHaveProperty("cardTitleMaxLength");
      expect(limits).toHaveProperty("tileMaxLength");
      expect(limits).toHaveProperty("playerNameMaxLength");
      expect(limits).toHaveProperty("maxPlayersPerCard");
      expect(limits).toHaveProperty("maxPublishedCards");
      expect(limits).toHaveProperty("maxUnpublishedCards");

      // Verify all values are positive numbers
      Object.values(limits).forEach((value) => {
        expect(typeof value).toBe("number");
        expect(value).toBeGreaterThan(0);
      });
    });

    it("should return a new copy each time limits is accessed", () => {
      const limits1 = config.limits;
      const limits2 = config.limits;

      // Should have same values but be different objects
      expect(limits1).toEqual(limits2);
      expect(limits1).not.toBe(limits2);
    });
  });

  describe("GetAll Method", () => {
    it("should return complete config object", () => {
      const all = config.getAll();

      expect(all).toHaveProperty("apiPort");
      expect(all).toHaveProperty("port");
      expect(all).toHaveProperty("limits");
      expect(all.limits).toHaveProperty("cardTitleMaxLength");
    });

    it("should return a frozen object", () => {
      const all = config.getAll();
      expect(Object.isFrozen(all)).toBe(true);
    });

    it("should return a deep copy", () => {
      const all1 = config.getAll();
      const all2 = config.getAll();

      expect(all1).toEqual(all2);
      expect(all1).not.toBe(all2);
      expect(all1.limits).not.toBe(all2.limits);
    });
  });

  describe("Configuration Consistency", () => {
    it("should have consistent values across getters", () => {
      const limits = config.limits;
      const all = config.getAll();

      expect(config.cardTitleMaxLength).toBe(limits.cardTitleMaxLength);
      expect(config.tileMaxLength).toBe(limits.tileMaxLength);
      expect(config.playerNameMaxLength).toBe(limits.playerNameMaxLength);
      expect(config.maxPlayersPerCard).toBe(limits.maxPlayersPerCard);
      expect(config.maxPublishedCards).toBe(limits.maxPublishedCards);
      expect(config.maxUnpublishedCards).toBe(limits.maxUnpublishedCards);

      expect(config.apiPort).toBe(all.apiPort);
      expect(config.port).toBe(all.port);
    });
  });
});
