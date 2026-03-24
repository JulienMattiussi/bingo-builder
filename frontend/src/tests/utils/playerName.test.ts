import { describe, it, expect, beforeEach } from "vitest";
import { playerNameUtils } from "../../utils/playerName";

const PLAYER_NAME_KEY = "bingo-player-name";

describe("PlayerName Utility", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getPlayerName", () => {
    it("should return stored player nickname from localStorage", () => {
      localStorage.setItem(PLAYER_NAME_KEY, "TestPlayer");
      expect(playerNameUtils.getPlayerName()).toBe("TestPlayer");
    });

    it("should return empty string when no player nickname is stored", () => {
      const result = playerNameUtils.getPlayerName();
      expect(result === null || result === "").toBe(true);
    });

    it("should return empty string when localStorage has empty string", () => {
      localStorage.setItem(PLAYER_NAME_KEY, "");
      const result = playerNameUtils.getPlayerName();
      expect(result === null || result === "").toBe(true);
    });
  });

  describe("savePlayerName", () => {
    it("should store valid player nickname in localStorage", () => {
      const result = playerNameUtils.savePlayerName("NewPlayer");
      expect(result).toBe(true);
      expect(localStorage.getItem(PLAYER_NAME_KEY)).toBe("NewPlayer");
    });

    it("should overwrite existing player nickname", () => {
      playerNameUtils.savePlayerName("FirstPlay");
      playerNameUtils.savePlayerName("SecondPlay");
      expect(localStorage.getItem(PLAYER_NAME_KEY)).toBe("SecondPlay");
    });

    it("should reject empty string", () => {
      const result = playerNameUtils.savePlayerName("");
      expect(result).toBe(false);
      expect(localStorage.getItem(PLAYER_NAME_KEY)).toBeNull();
    });

    it("should reject names with special characters", () => {
      const specialName = "Player!@#$%";
      const result = playerNameUtils.savePlayerName(specialName);
      expect(result).toBe(false);
      expect(localStorage.getItem(PLAYER_NAME_KEY)).toBeNull();
    });
  });

  describe("clearPlayerName", () => {
    it("should remove player nickname from localStorage", () => {
      playerNameUtils.savePlayerName("TestClear");
      playerNameUtils.clearPlayerName();
      expect(localStorage.getItem(PLAYER_NAME_KEY)).toBeNull();
    });

    it("should work when no player nickname is stored", () => {
      playerNameUtils.clearPlayerName();
      expect(localStorage.getItem(PLAYER_NAME_KEY)).toBeNull();
    });
  });

  describe("hasPlayerName", () => {
    it("should return true when player nickname exists", () => {
      playerNameUtils.savePlayerName("TestPlayer");
      expect(playerNameUtils.hasPlayerName()).toBe(true);
    });

    it("should return false when no player nickname exists", () => {
      expect(playerNameUtils.hasPlayerName()).toBe(false);
    });

    it("should return false when player nickname is empty string", () => {
      localStorage.setItem(PLAYER_NAME_KEY, "");
      expect(playerNameUtils.hasPlayerName()).toBe(false);
    });

    it("should return true for whitespace (localStorage value exists)", () => {
      // Note: savePlayerName would reject whitespace, but if set directly in localStorage,
      // hasPlayerName returns true since a value exists
      localStorage.setItem(PLAYER_NAME_KEY, "   ");
      expect(playerNameUtils.hasPlayerName()).toBe(true);
    });
  });
});
