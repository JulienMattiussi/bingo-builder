import { describe, it, expect, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import cardRoutes from "../../routes/cards.js";
import Card from "../../models/Card.js";

// Create minimal express app for testing (avoids double DB connection)
const app = express();
app.use(express.json());
app.use("/api/cards", cardRoutes);

describe("Card Ownership Verification", () => {
  const validUserId1 = "550e8400-e29b-41d4-a716-446655440000";
  const validUserId2 = "660e8400-e29b-41d4-a716-446655440111";

  beforeEach(async () => {
    // Clean up before each test
    await Card.deleteMany({});
  });

  afterEach(async () => {
    // Clean up after each test
    await Card.deleteMany({});
  });

  describe("POST /api/cards - Create card", () => {
    it("should create a card with ownerId", async () => {
      const cardData = {
        title: "Test Card",
        createdBy: "TestUser",
        ownerId: validUserId1,
        rows: 3,
        columns: 3,
        tiles: Array(9)
          .fill("")
          .map((_, i) => ({ value: `Tile ${i + 1}`, position: i })),
      };

      const response = await request(app)
        .post("/api/cards")
        .send(cardData)
        .expect(201);

      expect(response.body).toHaveProperty("_id");
      expect(response.body.isOwner).toBe(true);
      expect(response.body.ownerId).toBeUndefined(); // ownerId should not be exposed
      expect(response.body.createdBy).toBe("TestUser");
    });

    it("should reject card creation without ownerId", async () => {
      const cardData = {
        title: "Test Card",
        createdBy: "TestUser",
        rows: 3,
        columns: 3,
        tiles: Array(9)
          .fill("")
          .map((_, i) => ({ value: `Tile ${i + 1}`, position: i })),
      };

      const response = await request(app)
        .post("/api/cards")
        .send(cardData)
        .expect(400);

      expect(response.body.message).toContain("Validation failed");
    });

    it("should reject card creation with invalid ownerId format", async () => {
      const cardData = {
        title: "Test Card",
        createdBy: "TestUser",
        ownerId: "invalid-uuid",
        rows: 3,
        columns: 3,
        tiles: Array(9)
          .fill("")
          .map((_, i) => ({ value: `Tile ${i + 1}`, position: i })),
      };

      const response = await request(app)
        .post("/api/cards")
        .send(cardData)
        .expect(400);

      expect(response.body.message).toContain("Validation failed");
    });
  });

  describe("PUT /api/cards/:id - Update card", () => {
    it("should allow owner to update their card", async () => {
      const card = new Card({
        title: "Original Title",
        createdBy: "TestUser",
        ownerId: validUserId1,
        rows: 3,
        columns: 3,
        tiles: Array(9)
          .fill("")
          .map((_, i) => ({ value: `Tile ${i + 1}`, position: i })),
      });
      const savedCard = await card.save();

      const response = await request(app)
        .put(`/api/cards/${savedCard._id}`)
        .send({
          title: "Updated Title",
          ownerId: validUserId1,
        })
        .expect(200);

      expect(response.body.title).toBe("Updated Title");
    });

    it("should prevent non-owner from updating card", async () => {
      const card = new Card({
        title: "Original Title",
        createdBy: "TestUser",
        ownerId: validUserId1,
        rows: 3,
        columns: 3,
        tiles: Array(9)
          .fill("")
          .map((_, i) => ({ value: `Tile ${i + 1}`, position: i })),
      });
      const savedCard = await card.save();

      const response = await request(app)
        .put(`/api/cards/${savedCard._id}`)
        .send({
          title: "Hacked Title",
          ownerId: validUserId2, // Different user ID
        })
        .expect(403);

      expect(response.body.message).toContain("not the owner");
    });
  });

  describe("POST /api/cards/:id/publish - Publish card", () => {
    it("should allow owner to publish their card", async () => {
      const card = new Card({
        title: "Complete Card",
        createdBy: "TestUser",
        ownerId: validUserId1,
        rows: 2,
        columns: 2,
        tiles: Array(4)
          .fill("")
          .map((_, i) => ({ value: `Tile ${i + 1}`, position: i })),
      });
      const savedCard = await card.save();

      const response = await request(app)
        .post(`/api/cards/${savedCard._id}/publish`)
        .send({ ownerId: validUserId1 })
        .expect(200);

      expect(response.body.isPublished).toBe(true);
    });

    it("should prevent non-owner from publishing card", async () => {
      const card = new Card({
        title: "Complete Card",
        createdBy: "TestUser",
        ownerId: validUserId1,
        rows: 2,
        columns: 2,
        tiles: Array(4)
          .fill("")
          .map((_, i) => ({ value: `Tile ${i + 1}`, position: i })),
      });
      const savedCard = await card.save();

      const response = await request(app)
        .post(`/api/cards/${savedCard._id}/publish`)
        .send({ ownerId: validUserId2 }) // Different user ID
        .expect(403);

      expect(response.body.message).toContain("owner can publish");
    });
  });

  describe("POST /api/cards/:id/unpublish - Unpublish card", () => {
    it("should allow owner to unpublish their card", async () => {
      const card = new Card({
        title: "Published Card",
        createdBy: "TestUser",
        ownerId: validUserId1,
        rows: 2,
        columns: 2,
        tiles: Array(4)
          .fill("")
          .map((_, i) => ({ value: `Tile ${i + 1}`, position: i })),
        isPublished: true,
        publishedAt: new Date(),
      });
      const savedCard = await card.save();

      const response = await request(app)
        .post(`/api/cards/${savedCard._id}/unpublish`)
        .send({ ownerId: validUserId1 })
        .expect(200);

      expect(response.body.isPublished).toBe(false);
    });

    it("should prevent non-owner from unpublishing card", async () => {
      const card = new Card({
        title: "Published Card",
        createdBy: "TestUser",
        ownerId: validUserId1,
        rows: 2,
        columns: 2,
        tiles: Array(4)
          .fill("")
          .map((_, i) => ({ value: `Tile ${i + 1}`, position: i })),
        isPublished: true,
        publishedAt: new Date(),
      });
      const savedCard = await card.save();

      const response = await request(app)
        .post(`/api/cards/${savedCard._id}/unpublish`)
        .send({ ownerId: validUserId2 }) // Different user ID
        .expect(403);

      expect(response.body.message).toContain("owner can unpublish");
    });
  });

  describe("DELETE /api/cards/:id - Delete card", () => {
    it("should allow owner to delete their card", async () => {
      const card = new Card({
        title: "Card to Delete",
        createdBy: "TestUser",
        ownerId: validUserId1,
        rows: 2,
        columns: 2,
        tiles: Array(4)
          .fill("")
          .map((_, i) => ({ value: `Tile ${i + 1}`, position: i })),
      });
      const savedCard = await card.save();

      await request(app)
        .delete(`/api/cards/${savedCard._id}?ownerId=${validUserId1}`)
        .expect(200);

      const deletedCard = await Card.findById(savedCard._id);
      expect(deletedCard).toBeNull();
    });

    it("should prevent non-owner from deleting card", async () => {
      const card = new Card({
        title: "Card to Delete",
        createdBy: "TestUser",
        ownerId: validUserId1,
        rows: 2,
        columns: 2,
        tiles: Array(4)
          .fill("")
          .map((_, i) => ({ value: `Tile ${i + 1}`, position: i })),
      });
      const savedCard = await card.save();

      const response = await request(app)
        .delete(`/api/cards/${savedCard._id}?ownerId=${validUserId2}`) // Different user ID
        .expect(403);

      expect(response.body.message).toContain("owner can delete");

      // Card should still exist
      const stillExists = await Card.findById(savedCard._id);
      expect(stillExists).not.toBeNull();
    });

    it("should require ownerId for deletion", async () => {
      const card = new Card({
        title: "Card to Delete",
        createdBy: "TestUser",
        ownerId: validUserId1,
        rows: 2,
        columns: 2,
        tiles: Array(4)
          .fill("")
          .map((_, i) => ({ value: `Tile ${i + 1}`, position: i })),
      });
      const savedCard = await card.save();

      const response = await request(app)
        .delete(`/api/cards/${savedCard._id}`) // No ownerId provided
        .expect(403);

      expect(response.body.message).toContain("owner can delete");
    });
  });

  describe("POST /api/cards/delete-by-creator - Delete all cards by owner", () => {
    it("should delete all cards owned by user", async () => {
      // Create cards with user1
      await Card.create({
        title: "Card 1",
        createdBy: "User1",
        ownerId: validUserId1,
        rows: 2,
        columns: 2,
        tiles: Array(4)
          .fill("")
          .map((_, i) => ({ value: `Tile ${i}`, position: i })),
      });
      await Card.create({
        title: "Card 2",
        createdBy: "User1",
        ownerId: validUserId1,
        rows: 2,
        columns: 2,
        tiles: Array(4)
          .fill("")
          .map((_, i) => ({ value: `Tile ${i}`, position: i })),
      });

      // Create card with user2
      await Card.create({
        title: "Card 3",
        createdBy: "User2",
        ownerId: validUserId2,
        rows: 2,
        columns: 2,
        tiles: Array(4)
          .fill("")
          .map((_, i) => ({ value: `Tile ${i}`, position: i })),
      });

      const response = await request(app)
        .post("/api/cards/delete-by-creator")
        .send({ ownerId: validUserId1 })
        .expect(200);

      expect(response.body.deletedCount).toBe(2);

      // Verify user1's cards are deleted
      const user1Cards = await Card.find({ ownerId: validUserId1 });
      expect(user1Cards).toHaveLength(0);

      // Verify user2's card still exists
      const user2Cards = await Card.find({ ownerId: validUserId2 });
      expect(user2Cards).toHaveLength(1);
    });
  });

  describe("POST /api/cards/update-creator - Update creator name", () => {
    it("should update creator name only for owned cards", async () => {
      // Create card with user1
      const card1 = await Card.create({
        title: "Card 1",
        createdBy: "OldName",
        ownerId: validUserId1,
        rows: 2,
        columns: 2,
        tiles: Array(4)
          .fill("")
          .map((_, i) => ({ value: `Tile ${i}`, position: i })),
      });

      // Create card with user2 but same old name (should not be updated)
      const card2 = await Card.create({
        title: "Card 2",
        createdBy: "OldName",
        ownerId: validUserId2,
        rows: 2,
        columns: 2,
        tiles: Array(4)
          .fill("")
          .map((_, i) => ({ value: `Tile ${i}`, position: i })),
      });

      const response = await request(app)
        .post("/api/cards/update-creator")
        .send({
          oldName: "OldName",
          newName: "NewName",
          ownerId: validUserId1,
        })
        .expect(200);

      expect(response.body.modifiedCount).toBe(1);

      // Verify user1's card is updated
      const updatedCard1 = await Card.findById(card1._id);
      expect(updatedCard1?.createdBy).toBe("NewName");

      // Verify user2's card is NOT updated
      const unchangedCard2 = await Card.findById(card2._id);
      expect(unchangedCard2?.createdBy).toBe("OldName");
    });
  });
});
