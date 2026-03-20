import express from "express";
import Card from "../models/Card.js";

const router = express.Router();

// Get all cards
router.get("/", async (req, res) => {
  try {
    const cards = await Card.find().sort({ createdAt: -1 });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
  }
});

// Create a new card
router.post("/", async (req, res) => {
  const { title, createdBy, rows, columns, tiles } = req.body;

  // Validate required fields
  if (!title || !rows || !columns || !tiles) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Validate tiles count
  if (tiles.length !== rows * columns) {
    return res.status(400).json({
      message: `Number of tiles (${tiles.length}) must match grid size (${rows}x${columns} = ${rows * columns})`,
    });
  }

  try {
    const card = new Card({
      title,
      createdBy: createdBy || "",
      rows,
      columns,
      tiles,
      isPublished: false,
    });

    const newCard = await card.save();
    res.status(201).json(newCard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a card
router.put("/:id", async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    // Don't allow editing published cards
    if (card.isPublished) {
      return res.status(403).json({ message: "Cannot edit a published card" });
    }

    const { title, createdBy, rows, columns, tiles } = req.body;

    if (title) card.title = title;
    if (createdBy !== undefined) card.createdBy = createdBy;
    if (rows) card.rows = rows;
    if (columns) card.columns = columns;
    if (tiles) {
      // Validate tiles count if updating
      if (tiles.length !== card.rows * card.columns) {
        return res.status(400).json({
          message: `Number of tiles (${tiles.length}) must match grid size (${card.rows}x${card.columns} = ${card.rows * card.columns})`,
        });
      }
      card.tiles = tiles;
    }

    const updatedCard = await card.save();
    res.json(updatedCard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Publish a card
router.post("/:id/publish", async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    if (card.isPublished) {
      return res.status(400).json({ message: "Card is already published" });
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

    card.isPublished = true;
    card.publishedAt = new Date();
    const publishedCard = await card.save();
    res.json(publishedCard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Unpublish a card
router.post("/:id/unpublish", async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    if (!card.isPublished) {
      return res.status(400).json({ message: "Card is not published" });
    }

    card.isPublished = false;
    card.publishedAt = null;
    const unpublishedCard = await card.save();
    res.json(unpublishedCard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a card (optional - for unpublished cards only)
router.delete("/:id", async (req, res) => {
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

    await card.deleteOne();
    res.json({ message: "Card deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete all cards by creator
router.post("/delete-by-creator", async (req, res) => {
  try {
    const { createdBy } = req.body;

    if (!createdBy || !createdBy.trim()) {
      return res.status(400).json({ message: "Creator name is required" });
    }

    // Delete all cards created by this user
    const result = await Card.deleteMany({ createdBy: createdBy.trim() });

    res.json({
      message: `Successfully deleted ${result.deletedCount} card(s)`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update creator name for all cards
router.post("/update-creator", async (req, res) => {
  try {
    const { oldName, newName } = req.body;

    if (!oldName || !oldName.trim() || !newName || !newName.trim()) {
      return res
        .status(400)
        .json({ message: "Both old and new names are required" });
    }

    // Update all cards with the old creator name
    const result = await Card.updateMany(
      { createdBy: oldName.trim() },
      { $set: { createdBy: newName.trim() } },
    );

    res.json({
      message: `Successfully updated ${result.modifiedCount} card(s)`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
