import express from "express";
import { z } from "zod";
import Card from "../models/Card.js";
import config from "../config/config.js";
import {
  writeOperationsLimiter,
  listOperationsLimiter,
} from "../middleware/rateLimiter.js";
import {
  CardInputSchema,
  CardUpdateSchema,
  OwnershipSchema,
  UpdateCreatorSchema,
} from "../schemas/card.js";

const router = express.Router();

// Get all cards (with rate limiting to prevent scraping)
router.get("/", listOperationsLimiter, async (_req, res) => {
  try {
    const cards = await Card.find().sort({ createdAt: -1 });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

// Get card statistics (counts)
router.get("/stats/counts", listOperationsLimiter, async (_req, res) => {
  try {
    const publishedCount = await Card.countDocuments({ isPublished: true });
    const unpublishedCount = await Card.countDocuments({ isPublished: false });
    const maxPublished = config.get("limits.maxPublishedCards");
    const maxUnpublished = config.get("limits.maxUnpublishedCards");

    res.json({
      published: publishedCount,
      unpublished: unpublishedCount,
      maxPublished,
      maxUnpublished,
      canCreate: unpublishedCount < maxUnpublished,
      canPublish: publishedCount < maxPublished,
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

// Get a single card by ID
router.get("/:id", async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }
    res.json(card);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

// Create a new card (stricter rate limit for write operations)
router.post("/", writeOperationsLimiter, async (req, res) => {
  try {
    // Validate with Zod - already validated by OpenAPI but gives better type inference
    const validated = CardInputSchema.parse(req.body);

    // Check if unpublished card limit is reached
    const unpublishedCount = await Card.countDocuments({ isPublished: false });
    const maxUnpublished = config.get("limits.maxUnpublishedCards");
    if (unpublishedCount >= maxUnpublished) {
      return res.status(400).json({
        message: `Maximum unpublished cards limit reached (${maxUnpublished}). Please publish or delete existing cards.`,
        limit: maxUnpublished,
        current: unpublishedCount,
      });
    }

    const card = new Card({
      title: validated.title,
      createdBy: validated.createdBy || "",
      ownerId: validated.ownerId,
      rows: validated.rows,
      columns: validated.columns,
      tiles: validated.tiles,
      isPublished: false,
    });

    const newCard = await card.save();
    res.status(201).json(newCard);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    }
    res.status(400).json({ message: (error as Error).message });
  }
});

// Update a card (stricter rate limit for write operations)
router.put("/:id", writeOperationsLimiter, async (req, res) => {
  try {
    // Validate with Zod
    const validated = CardUpdateSchema.parse(req.body);

    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    // Don't allow editing published cards
    if (card.isPublished) {
      return res.status(403).json({ message: "Cannot edit a published card" });
    }

    // Check ownership using secret user ID
    if (card.ownerId !== validated.ownerId) {
      return res
        .status(403)
        .json({ message: "You are not the owner of this card" });
    }

    if (validated.title) card.title = validated.title;
    if (validated.createdBy !== undefined) card.createdBy = validated.createdBy;
    if (validated.rows) card.rows = validated.rows;
    if (validated.columns) card.columns = validated.columns;
    if (validated.tiles) {
      // Validate tiles count if updating
      if (validated.tiles.length !== card.rows * card.columns) {
        return res.status(400).json({
          message: `Number of tiles (${validated.tiles.length}) must match grid size (${card.rows}x${card.columns} = ${card.rows * card.columns})`,
        });
      }
      // Mongoose accepts the Zod validated tiles directly
      card.tiles = validated.tiles as typeof card.tiles;
    }

    const updatedCard = await card.save();
    res.json(updatedCard);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    }
    res.status(400).json({ message: (error as Error).message });
  }
});

// Publish a card (stricter rate limit for write operations)
router.post("/:id/publish", writeOperationsLimiter, async (req, res) => {
  try {
    // Validate with Zod
    const { ownerId } = OwnershipSchema.parse(req.body || {});

    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    if (card.isPublished) {
      return res.status(400).json({ message: "Card is already published" });
    }

    // Check ownership using secret user ID
    if (card.ownerId !== ownerId) {
      return res
        .status(403)
        .json({ message: "Only the owner can publish this card" });
    }

    // Validate that all tiles are filled
    const emptyTiles = card.tiles.filter(
      (tile) => !tile.value || !tile.value.trim(),
    );
    if (emptyTiles.length > 0) {
      return res.status(400).json({
        message: `Cannot publish incomplete card. ${emptyTiles.length} tiles are still empty.`,
      });
    }

    // Check if published card limit is reached
    const publishedCount = await Card.countDocuments({ isPublished: true });
    const maxPublished = config.get("limits.maxPublishedCards");
    if (publishedCount >= maxPublished) {
      return res.status(400).json({
        message: `Maximum published cards limit reached (${maxPublished}). Please unpublish existing cards first.`,
        limit: maxPublished,
        current: publishedCount,
      });
    }

    card.isPublished = true;
    card.publishedAt = new Date();
    const publishedCard = await card.save();
    res.json(publishedCard);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    }
    res.status(500).json({ message: (error as Error).message });
  }
});

// Unpublish a card (stricter rate limit for write operations)
router.post("/:id/unpublish", writeOperationsLimiter, async (req, res) => {
  try {
    // Validate with Zod
    const { ownerId } = OwnershipSchema.parse(req.body || {});

    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    if (!card.isPublished) {
      return res.status(400).json({ message: "Card is not published" });
    }

    // Check ownership using secret user ID
    if (card.ownerId !== ownerId) {
      return res
        .status(403)
        .json({ message: "Only the owner can unpublish this card" });
    }

    card.isPublished = false;
    card.publishedAt = undefined;
    const unpublishedCard = await card.save();
    res.json(unpublishedCard);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    }
    res.status(500).json({ message: (error as Error).message });
  }
});

// Delete a card (optional - for unpublished cards only)
router.delete("/:id", writeOperationsLimiter, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    if (card.isPublished) {
      return res
        .status(403)
        .json({ message: "Cannot delete a published card" });
    }

    // Check ownership using secret user ID
    const { ownerId } = req.query;
    if (!ownerId || card.ownerId !== ownerId) {
      return res
        .status(403)
        .json({ message: "Only the owner can delete this card" });
    }

    await card.deleteOne();
    res.json({ message: "Card deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

// Delete all cards by owner (stricter rate limit)
router.post("/delete-by-creator", writeOperationsLimiter, async (req, res) => {
  try {
    // Validate with Zod - expect ownerId now
    const ownerId = req.body.ownerId || req.body.createdBy; // Backward compatibility
    
    if (!ownerId) {
      return res.status(400).json({ message: "Owner ID is required" });
    }

    // Delete all cards owned by this user
    const result = await Card.deleteMany({ ownerId: ownerId.trim() });

    res.json({
      message: `Successfully deleted ${result.deletedCount} card(s)`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    }
    res.status(500).json({ message: (error as Error).message });
  }
});

// Update creator name for all cards (stricter rate limit)
// This updates the public nickname only, not the ownerId
router.post("/update-creator", writeOperationsLimiter, async (req, res) => {
  try {
    // Validate with Zod
    const { oldName, newName } = UpdateCreatorSchema.parse(req.body);
    const ownerId = req.body.ownerId;

    if (!ownerId) {
      return res.status(400).json({ message: "Owner ID is required" });
    }

    // Update all cards with the old creator name AND matching ownerId (for security)
    const result = await Card.updateMany(
      { createdBy: oldName.trim(), ownerId: ownerId.trim() },
      { $set: { createdBy: newName.trim() } },
    );

    res.json({
      message: `Successfully updated ${result.modifiedCount} card(s)`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    }
    res.status(500).json({ message: (error as Error).message });
  }
});

export default router;
