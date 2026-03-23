import express from "express";
import { z } from "zod";
import config from "../config/config.js";
import { peerOperationsLimiter } from "../middleware/rateLimiter.js";
import {
  PeerRegistrationSchema,
  PeerHeartbeatSchema,
} from "../schemas/peer.js";

const router = express.Router();

interface PeerData {
  name: string;
  timestamp: number;
  checkedCount: number;
}

// In-memory store for active peers per card
// Structure: { cardId: { peerId: { name, timestamp, checkedCount } } }
const activePeers = new Map<string, Map<string, PeerData>>();

// Cleanup interval - remove peers inactive for more than 2 minutes
const PEER_TIMEOUT = 2 * 60 * 1000; // 2 minutes
setInterval(() => {
  const now = Date.now();
  activePeers.forEach((peers, cardId) => {
    const peerEntries = Array.from(peers.entries());
    peerEntries.forEach(([peerId, data]: [string, PeerData]) => {
      if (now - data.timestamp > PEER_TIMEOUT) {
        peers.delete(peerId);
        console.log(`Removed inactive peer ${peerId} from card ${cardId}`);
      }
    });
    // Remove empty card entries
    if (peers.size === 0) {
      activePeers.delete(cardId);
    }
  });
}, 30000); // Check every 30 seconds

// Register or update a peer (rate limited to prevent flooding)
router.post("/:cardId/register", peerOperationsLimiter, (req, res) => {
  try {
    const cardId = String(req.params.cardId);
    const {
      peerId,
      playerName,
      checkedCount = 0,
    } = PeerRegistrationSchema.parse(req.body);

    // Initialize card's peer set if it doesn't exist
    if (!activePeers.has(cardId)) {
      activePeers.set(cardId, new Map());
    }

    const cardPeers = activePeers.get(cardId)!;

    // Check if we've reached max peers (excluding the registering peer)
    const maxPlayers = config.get("limits.maxPlayersPerCard");
    if (!cardPeers.has(peerId) && cardPeers.size >= maxPlayers) {
      return res
        .status(429)
        .json({ message: "Maximum peers reached for this card" });
    }

    // Register/update peer
    cardPeers.set(peerId, {
      name: playerName,
      timestamp: Date.now(),
      checkedCount,
    });

    console.log(`Registered peer ${peerId} (${playerName}) for card ${cardId}`);

    res.json({ success: true, activePeerCount: cardPeers.size });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    }
    console.error("Error registering peer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get list of active peers for a card (rate limited)
router.get("/:cardId/peers", peerOperationsLimiter, (req, res) => {
  const cardId = String(req.params.cardId);
  const { excludePeerId } = req.query;

  const cardPeers = activePeers.get(cardId);

  if (!cardPeers) {
    return res.json({ peers: [] });
  }

  // Convert to array and filter out the requesting peer
  const peers = Array.from(cardPeers.entries())
    .filter(([peerId]: [string, PeerData]) => peerId !== excludePeerId)
    .map(([peerId, data]: [string, PeerData]) => ({
      peerId,
      playerName: data.name,
      checkedCount: data.checkedCount,
    }));

  res.json({ peers });
});

// Unregister a peer (when leaving) - rate limited
router.delete(
  "/:cardId/unregister/:peerId",
  peerOperationsLimiter,
  (req, res) => {
    const cardId = String(req.params.cardId);
    const peerId = String(req.params.peerId);

    const cardPeers = activePeers.get(cardId);
    if (cardPeers) {
      cardPeers.delete(peerId);
      console.log(`Unregistered peer ${peerId} from card ${cardId}`);

      // Clean up empty card entry
      if (cardPeers.size === 0) {
        activePeers.delete(cardId);
      }
    }

    res.json({ success: true });
  },
);

// Heartbeat endpoint to keep peer alive (rate limited)
router.post("/:cardId/heartbeat/:peerId", peerOperationsLimiter, (req, res) => {
  try {
    const cardId = String(req.params.cardId);
    const peerId = String(req.params.peerId);
    const { checkedCount } = PeerHeartbeatSchema.parse(req.body || {});

    const cardPeers = activePeers.get(cardId);
    if (cardPeers && cardPeers.has(peerId)) {
      const peerData = cardPeers.get(peerId)!;
      peerData.timestamp = Date.now();
      if (checkedCount !== undefined) {
        peerData.checkedCount = checkedCount;
      }
      res.json({ success: true });
    } else {
      res.status(404).json({ message: "Peer not found" });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    }
    console.error("Error updating peer heartbeat:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
