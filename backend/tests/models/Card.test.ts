import { describe, it, expect } from "vitest";
import Card from "../../models/Card.js";

describe("Card Model", () => {
  describe("Validation", () => {
    it("should create a valid card with all required fields", async () => {
      const cardData = {
        title: "Test Bingo Card",
        createdBy: "test-user",
        rows: 3,
        columns: 3,
        tiles: Array.from({ length: 9 }, (_, i) => ({
          value: `Tile ${i + 1}`,
          position: i,
        })),
        isPublished: false,
      };

      const card = new Card(cardData);
      const savedCard = await card.save();

      expect(savedCard._id).toBeDefined();
      expect(savedCard.title).toBe(cardData.title);
      expect(savedCard.createdBy).toBe(cardData.createdBy);
      expect(savedCard.rows).toBe(cardData.rows);
      expect(savedCard.columns).toBe(cardData.columns);
      expect(savedCard.tiles).toHaveLength(9);
      expect(savedCard.isPublished).toBe(false);
      expect(savedCard.createdAt).toBeDefined();
      expect(savedCard.updatedAt).toBeDefined();
    });

    it("should fail validation without title", async () => {
      const cardData = {
        rows: 3,
        columns: 3,
        tiles: [],
      };

      const card = new Card(cardData);
      await expect(card.save()).rejects.toThrow();
    });

    it("should fail validation with title exceeding 25 characters", async () => {
      const cardData = {
        title: "This title is way too long and exceeds the limit",
        rows: 3,
        columns: 3,
        tiles: [],
      };

      const card = new Card(cardData);
      await expect(card.save()).rejects.toThrow();
    });

    it("should fail validation with rows less than 2", async () => {
      const cardData = {
        title: "Test Card",
        rows: 1,
        columns: 3,
        tiles: [],
      };

      const card = new Card(cardData);
      await expect(card.save()).rejects.toThrow();
    });

    it("should fail validation with rows greater than 5", async () => {
      const cardData = {
        title: "Test Card",
        rows: 6,
        columns: 3,
        tiles: [],
      };

      const card = new Card(cardData);
      await expect(card.save()).rejects.toThrow();
    });

    it("should fail validation with columns less than 2", async () => {
      const cardData = {
        title: "Test Card",
        rows: 3,
        columns: 1,
        tiles: [],
      };

      const card = new Card(cardData);
      await expect(card.save()).rejects.toThrow();
    });

    it("should fail validation with columns greater than 6", async () => {
      const cardData = {
        title: "Test Card",
        rows: 3,
        columns: 7,
        tiles: [],
      };

      const card = new Card(cardData);
      await expect(card.save()).rejects.toThrow();
    });

    it("should trim title whitespace", async () => {
      const cardData = {
        title: "  Test Card  ",
        rows: 2,
        columns: 2,
        tiles: Array.from({ length: 4 }, (_, i) => ({
          value: `Tile ${i}`,
          position: i,
        })),
      };

      const card = new Card(cardData);
      const savedCard = await card.save();

      expect(savedCard.title).toBe("Test Card");
    });

    it("should default createdBy to empty string if not provided", async () => {
      const cardData = {
        title: "Test Card",
        rows: 2,
        columns: 2,
        tiles: Array.from({ length: 4 }, (_, i) => ({
          value: `Tile ${i}`,
          position: i,
        })),
      };

      const card = new Card(cardData);
      const savedCard = await card.save();

      expect(savedCard.createdBy).toBe("");
    });

    it("should default isPublished to false", async () => {
      const cardData = {
        title: "Test Card",
        rows: 2,
        columns: 2,
        tiles: Array.from({ length: 4 }, (_, i) => ({
          value: `Tile ${i}`,
          position: i,
        })),
      };

      const card = new Card(cardData);
      const savedCard = await card.save();

      expect(savedCard.isPublished).toBe(false);
    });

    it("should store tiles with correct structure", async () => {
      const tiles = [
        { value: "First", position: 0 },
        { value: "Second", position: 1 },
        { value: "", position: 2 },
        { value: "Fourth", position: 3 },
      ];

      const cardData = {
        title: "Test Card",
        rows: 2,
        columns: 2,
        tiles,
      };

      const card = new Card(cardData);
      const savedCard = await card.save();

      expect(savedCard.tiles).toHaveLength(4);
      expect(savedCard.tiles[0].value).toBe("First");
      expect(savedCard.tiles[0].position).toBe(0);
      expect(savedCard.tiles[2].value).toBe("");
    });
  });

  describe("Published State", () => {
    it("should set publishedAt when isPublished is true", async () => {
      const cardData = {
        title: "Test Card",
        rows: 2,
        columns: 2,
        tiles: Array.from({ length: 4 }, (_, i) => ({
          value: `Tile ${i}`,
          position: i,
        })),
        isPublished: true,
        publishedAt: new Date(),
      };

      const card = new Card(cardData);
      const savedCard = await card.save();

      expect(savedCard.isPublished).toBe(true);
      expect(savedCard.publishedAt).toBeDefined();
    });
  });
});
