import Peer, { DataConnection } from "peerjs";
import { api } from "./api";

const MAX_PEERS = 6;

class PeerConnectionManager {
  peer: Peer | null;
  connections: Map<string, DataConnection>;
  cardId: string | null;
  playerName: string | null;
  myPeerId?: string;
  playerProgress: Map<string, { name: string; checkedCount: number }>;
  onNotificationCallback: ((notification: any) => void) | null;
  onPlayerListUpdateCallback: ((playerList: any) => void) | null;
  heartbeatInterval: NodeJS.Timeout | null;

  constructor() {
    this.peer = null;
    this.connections = new Map(); // peerId -> connection
    this.cardId = null;
    this.playerName = null;
    this.playerProgress = new Map(); // peerId -> {name, checkedCount}
    this.onNotificationCallback = null;
    this.onPlayerListUpdateCallback = null;
    this.heartbeatInterval = null;
  }

  // Initialize peer connection for a specific card
  async initialize(
    cardId: string,
    playerName: string,
    initialCheckedCount = 0,
  ) {
    this.cardId = cardId;
    this.playerName = playerName;

    // Create a unique peer ID based on card ID, player name, and random suffix
    const randomId = Math.random().toString(36).substring(2, 8);
    const peerId = `bingo-${cardId}-${playerName}-${randomId}`;

    return new Promise((resolve, reject) => {
      this.peer = new Peer(peerId, {
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" },
          ],
        },
      });

      this.peer.on("open", async (id) => {
        console.log("Peer connection opened with ID:", id);
        this.myPeerId = id;

        // Initialize our own progress
        this.playerProgress.set(id, {
          name: playerName,
          checkedCount: initialCheckedCount,
        });

        this.notifyPlayerListUpdate();

        // Register with backend
        try {
          await api.registerPeer(cardId, id, playerName, initialCheckedCount);
          console.log("Registered with backend signaling service");

          // Start heartbeat
          this.startHeartbeat();

          // Discover and connect to peers
          await this.discoverPeers();
        } catch (error) {
          console.error("Failed to register with backend:", error);
        }

        resolve(id);
      });

      this.peer.on("error", (error) => {
        console.error("Peer error:", error);
        reject(error);
      });

      // Handle incoming connections
      this.peer.on("connection", (conn) => {
        this.handleIncomingConnection(conn);
      });
    });
  }

  // Discover and connect to other peers on the same card
  async discoverPeers() {
    try {
      // Fetch active peers from backend
      const { peers } = await api.getActivePeers(this.cardId!, this.myPeerId);
      console.log(`Discovered ${peers.length} active peers:`, peers);

      // Connect to each discovered peer
      peers.forEach((peer: any) => {
        if (
          !this.connections.has(peer.peerId) &&
          this.connections.size < MAX_PEERS
        ) {
          console.log(
            `Attempting to connect to peer: ${peer.peerId} (${peer.playerName})`,
          );
          this.connectToPeer(peer.peerId);
        }
      });
    } catch (error) {
      console.error("Failed to discover peers:", error);
    }
  }

  // Start heartbeat to keep peer registered
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(async () => {
      try {
        const checkedCount =
          this.playerProgress.get(this.myPeerId!)?.checkedCount || 0;
        await api.peerHeartbeat(this.cardId!, this.myPeerId!, checkedCount);

        // Also re-discover peers periodically
        this.discoverPeers();
      } catch (error) {
        console.error("Heartbeat failed:", error);
      }
    }, 30000); // Every 30 seconds
  }

  // Connect to a specific peer
  connectToPeer(peerId: string) {
    if (this.connections.size >= MAX_PEERS) {
      console.log("Max peer connections reached");
      return;
    }

    if (this.connections.has(peerId)) {
      return; // Already connected
    }

    try {
      const conn = this.peer!.connect(peerId);
      this.setupConnection(conn);
    } catch (error) {
      console.error("Error connecting to peer:", error);
    }
  }

  // Handle incoming connection from another peer
  handleIncomingConnection(conn: DataConnection) {
    if (this.connections.size >= MAX_PEERS) {
      console.log("Max peer connections reached, rejecting connection");
      conn.close();
      return;
    }

    this.setupConnection(conn);
  }

  // Setup event handlers for a connection
  setupConnection(conn: DataConnection) {
    conn.on("open", () => {
      console.log("Connected to peer:", conn.peer);
      this.connections.set(conn.peer, conn);

      // Send our initial state
      this.sendMessage(conn.peer, {
        type: "player-join",
        playerName: this.playerName!,
        peerId: this.myPeerId!,
        checkedCount:
          this.playerProgress.get(this.myPeerId!)?.checkedCount || 0,
      });
    });

    conn.on("data", (data: any) => {
      this.handleMessage(conn.peer, data);
    });

    conn.on("close", () => {
      console.log("Connection closed with peer:", conn.peer);
      this.connections.delete(conn.peer);
      this.playerProgress.delete(conn.peer);
      this.notifyPlayerListUpdate();
    });

    conn.on("error", (error: any) => {
      console.error("Connection error with peer:", conn.peer, error);
      this.connections.delete(conn.peer);
      this.playerProgress.delete(conn.peer);
      this.notifyPlayerListUpdate();
    });
  }

  // Handle incoming messages from peers
  handleMessage(peerId: string, data: any) {
    console.log("Received message from", peerId, ":", data);

    switch (data.type) {
      case "player-join":
        this.playerProgress.set(peerId, {
          name: data.playerName,
          checkedCount: data.checkedCount,
        });
        this.notifyPlayerListUpdate();

        // Send our state back
        this.sendMessage(peerId, {
          type: "player-state",
          playerName: this.playerName,
          peerId: this.myPeerId,
          checkedCount:
            this.playerProgress.get(this.myPeerId!)?.checkedCount || 0,
        });
        break;

      case "player-state":
        this.playerProgress.set(peerId, {
          name: data.playerName,
          checkedCount: data.checkedCount,
        });
        this.notifyPlayerListUpdate();
        break;

      case "tile-validated":
        this.playerProgress.set(peerId, {
          name: data.playerName,
          checkedCount: data.checkedCount,
        });
        this.notifyPlayerListUpdate();

        if (this.onNotificationCallback) {
          this.onNotificationCallback({
            type: "tile-validated",
            playerName: data.playerName,
            message: `${data.playerName} validated a new tile`,
          });
        }
        break;

      case "tile-unvalidated":
        this.playerProgress.set(peerId, {
          name: data.playerName,
          checkedCount: data.checkedCount,
        });
        this.notifyPlayerListUpdate();

        if (this.onNotificationCallback) {
          this.onNotificationCallback({
            type: "tile-unvalidated",
            playerName: data.playerName,
            message: `${data.playerName} unchecked a tile`,
          });
        }
        break;

      case "player-won":
        if (this.onNotificationCallback) {
          this.onNotificationCallback({
            type: "player-won",
            playerName: data.playerName,
            message: `${data.playerName} just won this card!`,
          });
        }
        break;
    }
  }

  // Send a message to a specific peer or all peers
  sendMessage(peerId: string | null, message: any) {
    if (peerId) {
      const conn = this.connections.get(peerId);
      if (conn && conn.open) {
        conn.send(message);
      }
    } else {
      // Broadcast to all connections
      this.connections.forEach((conn) => {
        if (conn.open) {
          conn.send(message);
        }
      });
    }
  }

  // Broadcast that a tile was validated
  broadcastTileValidation(checkedCount: number) {
    // Update our own progress
    if (this.myPeerId) {
      const current = this.playerProgress.get(this.myPeerId);
      if (current) {
        current.checkedCount = checkedCount;
        this.notifyPlayerListUpdate();
      }
    }

    this.sendMessage(null, {
      type: "tile-validated",
      playerName: this.playerName,
      checkedCount,
    });

    // Update backend with new progress
    if (this.cardId && this.myPeerId) {
      api
        .peerHeartbeat(this.cardId, this.myPeerId, checkedCount)
        .catch((err) => {
          console.error("Failed to update progress on backend:", err);
        });
    }
  }

  // Broadcast that a tile was unvalidated
  broadcastTileUnvalidation(checkedCount: number) {
    // Update our own progress
    if (this.myPeerId) {
      const current = this.playerProgress.get(this.myPeerId);
      if (current) {
        current.checkedCount = checkedCount;
        this.notifyPlayerListUpdate();
      }
    }

    this.sendMessage(null, {
      type: "tile-unvalidated",
      playerName: this.playerName,
      checkedCount,
    });

    // Update backend with new progress
    if (this.cardId && this.myPeerId) {
      api
        .peerHeartbeat(this.cardId, this.myPeerId, checkedCount)
        .catch((err) => {
          console.error("Failed to update progress on backend:", err);
        });
    }
  }

  // Broadcast that player won
  broadcastWin() {
    this.sendMessage(null, {
      type: "player-won",
      playerName: this.playerName,
    });
  }

  // Get list of connected players with their progress
  getPlayerList() {
    return Array.from(this.playerProgress.entries()).map(([peerId, data]) => ({
      peerId,
      name: data.name,
      checkedCount: data.checkedCount,
      isMe: peerId === this.myPeerId,
    }));
  }

  // Notify callback when player list updates
  notifyPlayerListUpdate() {
    if (this.onPlayerListUpdateCallback) {
      this.onPlayerListUpdateCallback(this.getPlayerList());
    }
  }

  // Set callback for notifications
  onNotification(callback: (notification: any) => void) {
    this.onNotificationCallback = callback;
  }

  // Set callback for player list updates
  onPlayerListUpdate(callback: (playerList: any) => void) {
    this.onPlayerListUpdateCallback = callback;
  }

  // Disconnect and cleanup
  disconnect() {
    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close all connections
    this.connections.forEach((conn) => {
      conn.close();
    });
    this.connections.clear();

    // Unregister from backend
    if (this.cardId && this.myPeerId) {
      api.unregisterPeer(this.cardId, this.myPeerId).catch((err) => {
        console.error("Failed to unregister peer:", err);
      });
    }

    // Destroy peer
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}

export const createPeerConnection = () => new PeerConnectionManager();
