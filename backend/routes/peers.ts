import express from "express";

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

// Register or update a peer
router.post("/:cardId/register", (req, res) => {
  const { cardId } = req.params;
  const { peerId, playerName, checkedCount = 0 } = req.body;

  if (!peerId || !playerName) {
    return res.status(400).json({ message: "Missing peerId or playerName" });
  }

  // Initialize card's peer set if it doesn't exist
  if (!activePeers.has(cardId)) {
    activePeers.set(cardId, new Map());
  }

  const cardPeers = activePeers.get(cardId)!;

  // Check if we've reached max peers (excluding the registering peer)
  if (!cardPeers.has(peerId) && cardPeers.size >= 6) {
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
});

// Get list of active peers for a card
router.get("/:cardId/peers", (req, res) => {
  const { cardId } = req.params;
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

// Unregister a peer (when leaving)
router.delete("/:cardId/unregister/:peerId", (req, res) => {
  const { cardId, peerId } = req.params;

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
});

// Heartbeat endpoint to keep peer alive
router.post("/:cardId/heartbeat/:peerId", (req, res) => {
  const { cardId, peerId } = req.params;
  const { checkedCount } = req.body;

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
});

export default router;
