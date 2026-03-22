import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import cardRoutes from "../../routes/cards.js";
import Card from "../../models/Card.js";

const app = express();
app.use(express.json());
app.use("/api/cards", cardRoutes);

describe("Card Routes", () => {
  describe("GET /api/cards", () => {
    it("should return all cards sorted by createdAt descending", async () => {
      // Create test cards
      await Card.create({
        title: "First Card",
        rows: 2,
        columns: 2,
        tiles: Array.from({ length: 4 }, (_, i) => ({
          value: `Tile ${i}`,
          position: i,
        })),
      });

      await Card.create({
        title: "Second Card",
        rows: 3,
        columns: 3,
        tiles: Array.from({ length: 9 }, (_, i) => ({
          value: `Tile ${i}`,
          position: i,
        })),
      });

      const response = await request(app).get("/api/cards");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe("Second Card"); // Most recent first
      expect(response.body[1].title).toBe("First Card");
    });

    it("should return empty array when no cards exist", async () => {
      const response = await request(app).get("/api/cards");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("GET /api/cards/:id", () => {
    it("should return a specific card by ID", async () => {
      const card = await Card.create({
        title: "Test Card",
        rows: 2,
        columns: 3,
        tiles: Array.from({ length: 6 }, (_, i) => ({
          value: `Tile ${i}`,
          position: i,
        })),
      });

      const response = await request(app).get(`/api/cards/${card._id}`);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("Test Card");
      expect(response.body.rows).toBe(2);
      expect(response.body.columns).toBe(3);
    });

    it("should return 404 for non-existent card", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const response = await request(app).get(`/api/cards/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Card not found");
    });

    it("should return 500 for invalid ID format", async () => {
      const response = await request(app).get("/api/cards/invalid-id");

      expect(response.status).toBe(500);
    });
  });

  describe("POST /api/cards", () => {
    it("should create a new card with valid data", async () => {
      const cardData = {
        title: "New Card",
        createdBy: "test-user",
        rows: 3,
        columns: 3,
        tiles: Array.from({ length: 9 }, (_, i) => ({
          value: `Tile ${i + 1}`,
          position: i,
        })),
      };

      const response = await request(app).post("/api/cards").send(cardData);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(cardData.title);
      expect(response.body.createdBy).toBe(cardData.createdBy);
      expect(response.body.isPublished).toBe(false);
      expect(response.body._id).toBeDefined();
    });

    it("should return 400 when missing required fields", async () => {
      const invalidData = {
        title: "Incomplete Card",
        rows: 2,
        // Missing columns and tiles
      };

      const response = await request(app).post("/api/cards").send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Missing required fields");
    });

    it("should return 400 when tiles count does not match grid size", async () => {
      const invalidData = {
        title: "Invalid Card",
        rows: 3,
        columns: 3,
        tiles: Array.from({ length: 5 }, (_, i) => ({
          value: `Tile ${i}`,
          position: i,
        })), // Should be 9 tiles
      };

      const response = await request(app).post("/api/cards").send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("must match grid size");
    });

    it("should default createdBy to empty string if not provided", async () => {
      const cardData = {
        title: "Anonymous Card",
        rows: 2,
        columns: 2,
        tiles: Array.from({ length: 4 }, (_, i) => ({
          value: `Tile ${i}`,
          position: i,
        })),
      };

      const response = await request(app).post("/api/cards").send(cardData);

      expect(response.status).toBe(201);
      expect(response.body.createdBy).toBe("");
    });
  });

  describe("PUT /api/cards/:id", () => {
    it("should update an unpublished card", async () => {
      const card = await Card.create({
        title: "Original Title",
        createdBy: "user1",
        rows: 2,
        columns: 2,
        tiles: Array.from({ length: 4 }, (_, i) => ({
          value: `Tile ${i}`,
          position: i,
        })),
        isPublished: false,
      });

      const updateData = {
        title: "Updated Title",
        createdBy: "user1",
      };

      const response = await request(app)
        .put(`/api/cards/${card._id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("Updated Title");
    });

    it("should return 404 for non-existent card", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const response = await request(app)
        .put(`/api/cards/${fakeId}`)
        .send({ title: "Test" });

      expect(response.status).toBe(404);
    });

    it("should return 403 when editing published card", async () => {
      const card = await Card.create({
        title: "Published Card",
        rows: 2,
        columns: 2,
        tiles: Array.from({ length: 4 }, (_, i) => ({
          value: `Tile ${i}`,
          position: i,
        })),
        isPublished: true,
      });

      const response = await request(app)
        .put(`/api/cards/${card._id}`)
        .send({ title: "New Title" });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Cannot edit a published card");
    });

    it("should return 403 when non-owner tries to edit", async () => {
      const card = await Card.create({
        title: "User Card",
        createdBy: "user1",
        rows: 2,
        columns: 2,
        tiles: Array.from({ length: 4 }, (_, i) => ({
          value: `Tile ${i}`,
          position: i,
        })),
      });

      const response = await request(app)
        .put(`/api/cards/${card._id}`)
        .send({ title: "Hacked", createdBy: "user2" });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("You are not the owner of this card");
    });

    it("should validate tiles count when updating tiles", async () => {
      const card = await Card.create({
        title: "Test Card",
        rows: 2,
        columns: 2,
        tiles: Array.from({ length: 4 }, (_, i) => ({
          value: `Tile ${i}`,
          position: i,
        })),
      });

      const response = await request(app)
        .put(`/api/cards/${card._id}`)
        .send({
          tiles: Array.from({ length: 3 }, (_, i) => ({
            value: `Tile ${i}`,
            position: i,
          })),
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("must match grid size");
    });
  });

  describe("POST /api/cards/:id/publish", () => {
    it("should publish a complete card", async () => {
      const card = await Card.create({
        title: "Complete Card",
        createdBy: "user1",
        rows: 2,
        columns: 2,
        tiles: Array.from({ length: 4 }, (_, i) => ({
          value: `Tile ${i + 1}`,
          position: i,
        })),
      });

      const response = await request(app)
        .post(`/api/cards/${card._id}/publish`)
        .send({ createdBy: "user1" });

      expect(response.status).toBe(200);
      expect(response.body.isPublished).toBe(true);
      expect(response.body.publishedAt).toBeDefined();
    });

    it("should return 404 for non-existent card", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const response = await request(app).post(`/api/cards/${fakeId}/publish`);

      expect(response.status).toBe(404);
    });

    it("should return 400 when card is already published", async () => {
      const card = await Card.create({
        title: "Already Published",
        rows: 2,
        columns: 2,
        tiles: Array.from({ length: 4 }, (_, i) => ({
          value: `Tile ${i}`,
          position: i,
        })),
        isPublished: true,
      });

      const response = await request(app).post(
        `/api/cards/${card._id}/publish`,
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Card is already published");
    });

    it("should return 403 when non-owner tries to publish", async () => {
      const card = await Card.create({
        title: "User Card",
        createdBy: "user1",
        rows: 2,
        columns: 2,
        tiles: Array.from({ length: 4 }, (_, i) => ({
          value: `Tile ${i}`,
          position: i,
        })),
      });

      const response = await request(app)
        .post(`/api/cards/${card._id}/publish`)
        .send({ createdBy: "user2" });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        "Only the owner can publish this card",
      );
    });

    it("should return 400 when card has empty tiles", async () => {
      const card = await Card.create({
        title: "Incomplete Card",
        rows: 2,
        columns: 2,
        tiles: [
          { value: "Tile 1", position: 0 },
          { value: "", position: 1 },
          { value: "Tile 3", position: 2 },
          { value: "Tile 4", position: 3 },
        ],
      });

      const response = await request(app).post(
        `/api/cards/${card._id}/publish`,
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Cannot publish incomplete card");
    });
  });

  describe("POST /api/cards/:id/unpublish", () => {
    it("should unpublish a published card", async () => {
      const card = await Card.create({
        title: "Published Card",
        createdBy: "user1",
        rows: 2,
        columns: 2,
        tiles: Array.from({ length: 4 }, (_, i) => ({
          value: `Tile ${i}`,
          position: i,
        })),
        isPublished: true,
        publishedAt: new Date(),
      });

      const response = await request(app)
        .post(`/api/cards/${card._id}/unpublish`)
        .send({ createdBy: "user1" });

      expect(response.status).toBe(200);
      expect(response.body.isPublished).toBe(false);
      expect(response.body.publishedAt).toBeNull();
    });

    it("should return 400 when card is not published", async () => {
      const card = await Card.create({
        title: "Unpublished Card",
        rows: 2,
        columns: 2,
        tiles: Array.from({ length: 4 }, (_, i) => ({
          value: `Tile ${i}`,
          position: i,
        })),
      });

      const response = await request(app).post(
        `/api/cards/${card._id}/unpublish`,
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Card is not published");
    });

    it("should return 403 when non-owner tries to unpublish", async () => {
      const card = await Card.create({
        title: "User Card",
        createdBy: "user1",
        rows: 2,
        columns: 2,
        tiles: Array.from({ length: 4 }, (_, i) => ({
          value: `Tile ${i}`,
          position: i,
        })),
        isPublished: true,
      });

      const response = await request(app)
        .post(`/api/cards/${card._id}/unpublish`)
        .send({ createdBy: "user2" });

      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /api/cards/:id", () => {
    it("should delete an unpublished card", async () => {
      const card = await Card.create({
        title: "To Delete",
        createdBy: "user1",
        rows: 2,
        columns: 2,
        tiles: Array.from({ length: 4 }, (_, i) => ({
          value: `Tile ${i}`,
          position: i,
        })),
      });

      const response = await request(app)
        .delete(`/api/cards/${card._id}`)
        .query({ createdBy: "user1" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Card deleted successfully");

      // Verify deletion
      const deletedCard = await Card.findById(card._id);
      expect(deletedCard).toBeNull();
    });

    it("should return 404 for non-existent card", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const response = await request(app).delete(`/api/cards/${fakeId}`);

      expect(response.status).toBe(404);
    });

    it("should return 403 when trying to delete published card", async () => {
      const card = await Card.create({
        title: "Published Card",
        rows: 2,
        columns: 2,
        tiles: Array.from({ length: 4 }, (_, i) => ({
          value: `Tile ${i}`,
          position: i,
        })),
        isPublished: true,
      });

      const response = await request(app).delete(`/api/cards/${card._id}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Cannot delete a published card");
    });

    it("should return 403 when non-owner tries to delete", async () => {
      const card = await Card.create({
        title: "User Card",
        createdBy: "user1",
        rows: 2,
        columns: 2,
        tiles: Array.from({ length: 4 }, (_, i) => ({
          value: `Tile ${i}`,
          position: i,
        })),
      });

      const response = await request(app)
        .delete(`/api/cards/${card._id}`)
        .query({ createdBy: "user2" });

      expect(response.status).toBe(403);
    });
  });
});
