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
router.get("/", listOperationsLimiter, async (req, res) => {
  try {
    const cards = await Card.find().sort({ createdAt: -1 });
    const userId = req.query.userId as string | undefined;

    // Transform cards to exclude ownerId and add isOwner flag
    const transformedCards = cards.map((card) => {
      const cardObj = card.toObject();
      const isOwner = userId ? cardObj.ownerId === userId : false;
      // Remove ownerId from response for security using destructuring
      const { ownerId: _, ...cardWithoutOwnerId } = cardObj;
      return { ...cardWithoutOwnerId, isOwner };
    });

    res.json(transformedCards);
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

// Export user's cards (MUST be before /:id route to avoid matching "export" as an ID)
router.get("/export", listOperationsLimiter, async (req, res) => {
  try {
    const { ownerId } = req.query;

    if (!ownerId || typeof ownerId !== "string") {
      return res.status(400).json({ message: "Owner ID is required" });
    }

    // Get all cards owned by this user
    const cards = await Card.find({ ownerId: ownerId.trim() }).sort({
      createdAt: -1,
    });

    // Include _id for de-duplication on import
    const exportData = cards.map((card) => card.toObject());

    // Return export data with metadata
    // Note: User nickname comes from frontend, backend doesn't store it
    res.json({
      version: "2.0",
      exportDate: new Date().toISOString(),
      user: {
        ownerId: ownerId.trim(),
        nickname: "", // Frontend will fill this in
      },
      cardCount: cards.length,
      cards: exportData,
      progress: {}, // Frontend will fill this in
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

    const userId = req.query.userId as string | undefined;
    const cardObj = card.toObject();
    const isOwner = userId ? cardObj.ownerId === userId : false;
    // Remove ownerId from response for security using destructuring
    const { ownerId: _, ...cardWithoutOwnerId } = cardObj;

    res.json({ ...cardWithoutOwnerId, isOwner });
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
    const cardObj = newCard.toObject();
    // Remove ownerId from response for security using destructuring
    const { ownerId: _, ...cardWithoutOwnerId } = cardObj;
    res.status(201).json({ ...cardWithoutOwnerId, isOwner: true });
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
    const cardObj = updatedCard.toObject();
    // Remove ownerId from response for security using destructuring
    const { ownerId: _, ...cardWithoutOwnerId } = cardObj;
    res.json({ ...cardWithoutOwnerId, isOwner: true });
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
    const cardObj = publishedCard.toObject();
    // Remove ownerId from response for security using destructuring
    const { ownerId: _, ...cardWithoutOwnerId } = cardObj;
    res.json({ ...cardWithoutOwnerId, isOwner: true });
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
    const cardObj = unpublishedCard.toObject();
    // Remove ownerId from response for security using destructuring
    const { ownerId: _, ...cardWithoutOwnerId } = cardObj;
    res.json({ ...cardWithoutOwnerId, isOwner: true });
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

// Import user's cards
router.post("/import", writeOperationsLimiter, async (req, res) => {
  try {
    const { cards, ownerId } = req.body;

    if (!ownerId) {
      return res.status(400).json({ message: "Owner ID is required" });
    }

    if (!Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ message: "No cards to import" });
    }

    // Count new cards only (cards without _id or with _id that doesn't exist)
    const existingIds = cards
      .filter((c) => c._id)
      .map((c) => c._id)
      .filter((id) => id);
    const existingCards = await Card.find({
      _id: { $in: existingIds },
      ownerId,
    });
    const existingCardIds = new Set(existingCards.map((c) => c._id.toString()));

    const newCards = cards.filter((c) => !c._id || !existingCardIds.has(c._id));
    const unpublishedToImport = newCards.filter((c) => !c.isPublished).length;
    const publishedToImport = newCards.filter((c) => c.isPublished).length;

    // Check unpublished card limit (only count new cards)
    const currentUnpublishedCount = await Card.countDocuments({
      ownerId,
      isPublished: false,
    });
    const maxUnpublished = config.get("limits.maxUnpublishedCards");

    if (currentUnpublishedCount + unpublishedToImport > maxUnpublished) {
      return res.status(400).json({
        message: `Import would exceed unpublished cards limit. You have ${currentUnpublishedCount} unpublished cards, trying to import ${unpublishedToImport} more. Maximum is ${maxUnpublished}.`,
        limit: maxUnpublished,
        current: currentUnpublishedCount,
        importing: unpublishedToImport,
      });
    }

    // Check published card limit (only count new cards)
    const currentPublishedCount = await Card.countDocuments({
      ownerId,
      isPublished: true,
    });
    const maxPublished = config.get("limits.maxPublishedCards");

    if (currentPublishedCount + publishedToImport > maxPublished) {
      return res.status(400).json({
        message: `Import would exceed published cards limit. You have ${currentPublishedCount} published cards, trying to import ${publishedToImport} more. Maximum is ${maxPublished}.`,
        limit: maxPublished,
        current: currentPublishedCount,
        importing: publishedToImport,
      });
    }

    // Import/update cards
    const importedCards = [];
    const skippedCards = [];
    const errors = [];

    for (let i = 0; i < cards.length; i++) {
      try {
        const cardData = cards[i];

        // Validate basic structure
        if (
          !cardData.title ||
          !cardData.rows ||
          !cardData.columns ||
          !cardData.tiles
        ) {
          errors.push({
            index: i,
            message: "Missing required fields",
          });
          continue;
        }

        // Check if card already exists with this _id
        if (cardData._id) {
          const existingCard = await Card.findOne({
            _id: cardData._id,
            ownerId,
          });

          if (existingCard) {
            // Card already exists - skip it (already imported)
            skippedCards.push(cardData._id);
            continue;
          }
        }

        // Create new card (with or without preserving _id)
        const newCardData: {
          _id?: string;
          title: string;
          createdBy: string;
          ownerId: string;
          rows: number;
          columns: number;
          tiles: Array<{ value: string }>;
          isPublished: boolean;
        } = {
          title: cardData.title,
          createdBy: cardData.createdBy || "",
          ownerId: ownerId, // Use current user's ID, not the imported one
          rows: cardData.rows,
          columns: cardData.columns,
          tiles: cardData.tiles,
          isPublished: cardData.isPublished || false,
        };

        // Preserve _id if provided (for device sync)
        if (cardData._id) {
          newCardData._id = cardData._id;
        }

        const newCard = new Card(newCardData);
        const savedCard = await newCard.save();
        importedCards.push(savedCard._id);
      } catch (err) {
        errors.push({
          index: i,
          message: (err as Error).message,
        });
      }
    }

    res.status(201).json({
      message: `Successfully imported ${importedCards.length} cards, skipped ${skippedCards.length} existing`,
      importedCount: importedCards.length,
      skippedCount: skippedCards.length,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

export default router;
