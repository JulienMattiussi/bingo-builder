import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { api } from "../utils/api";
import { playerNameUtils } from "../utils/playerName";
import { createPeerConnection } from "../utils/peerConnection";
import NotificationContainer from "../components/Notification";
import PlayerList from "../components/PlayerList";
import MobileActionBar from "../components/MobileActionBar";
import { Card, Tile, Notification } from "../types/models";

interface NotificationWithLocalId extends Omit<Notification, "id"> {
  id: number;
}

interface Player {
  peerId: string;
  name: string;
  checkedCount: number;
  isMe: boolean;
}

function PlayCard() {
  const { id } = useParams<{ id: string }>();
  const [card, setCard] = useState<Card | null>(null);
  const [checkedTiles, setCheckedTiles] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [notifications, setNotifications] = useState<NotificationWithLocalId[]>(
    [],
  );
  const [players, setPlayers] = useState<Player[]>([]);
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  // Player list is hidden by default on mobile, can be toggled open
  const [isPlayerListOpen, setIsPlayerListOpen] = useState(false);
  // Selected tile for mobile full-size view
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);

  const peerConnectionRef = useRef<ReturnType<
    typeof createPeerConnection
  > | null>(null);
  const notificationIdRef = useRef(0);

  useEffect(() => {
    loadCard();
    loadCheckedTiles();

    // Check if we need to ask for player name
    const existingName = playerNameUtils.getPlayerName();
    if (existingName) {
      setPlayerName(existingName);
    } else {
      // Show name modal on first play
      setShowNameModal(true);
    }

    // Cleanup peer connection on unmount
    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.disconnect();
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, setPlayerName, setShowNameModal]);

  // Initialize peer connection when both card and playerName are available
  useEffect(() => {
    if (card && playerName && !peerConnectionRef.current && !showNameModal) {
      initializePeerConnection();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card, playerName, showNameModal]);

  const initializePeerConnection = async () => {
    try {
      console.log("[P2P] Initializing peer connection...");
      const peerConnection = createPeerConnection();
      peerConnectionRef.current = peerConnection;

      // Set up callbacks BEFORE initializing
      peerConnection.onNotification((notification) => {
        console.log("[P2P] Received notification:", notification);
        addNotification(notification);
      });

      peerConnection.onPlayerListUpdate((playerList) => {
        console.log("[P2P] Player list updated:", playerList);
        setPlayers(playerList);
      });

      // Initialize connection
      console.log(
        "[P2P] Calling initialize with cardId:",
        id,
        "playerName:",
        playerName,
      );
      await peerConnection.initialize(id!, playerName, checkedTiles.length);
      setIsPeerConnected(true);
      console.log("[P2P] Peer connection initialized successfully");
    } catch (error) {
      console.error("[P2P] Failed to initialize peer connection:", error);
      // Continue without P2P functionality
    }
  };

  const addNotification = (
    notification: Omit<NotificationWithLocalId, "id">,
  ) => {
    const localId = notificationIdRef.current++;
    const notif: NotificationWithLocalId = {
      ...notification,
      id: localId,
    };
    setNotifications((prev) => [...prev, notif]);
  };

  const dismissNotification = (notificationId: string | number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const loadCard = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.getCard(id);

      if (!data.isPublished) {
        setError("This card is not yet published.");
        return;
      }

      setCard(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadCheckedTiles = () => {
    const stored = localStorage.getItem(`bingo-card-${id}`);
    if (stored) {
      setCheckedTiles(JSON.parse(stored));
    }
  };

  const checkForBingo = (checked: number[], rows: number, columns: number) => {
    const totalTiles = rows * columns;
    // Check if all tiles are checked (full card completion)
    return checked.length === totalTiles;
  };

  const handleTileClick = (tile: Tile) => {
    // On mobile (screen width < 768px), open full-size viewer
    if (window.innerWidth < 768) {
      setSelectedTile(tile);
    } else {
      // On desktop, toggle directly
      toggleTile(tile.position);
    }
  };

  const toggleTile = (position: number) => {
    const wasChecked = checkedTiles.includes(position);
    const newChecked = wasChecked
      ? checkedTiles.filter((p) => p !== position)
      : [...checkedTiles, position];

    setCheckedTiles(newChecked);
    localStorage.setItem(`bingo-card-${id}`, JSON.stringify(newChecked));

    // Broadcast tile changes to other players
    if (peerConnectionRef.current) {
      if (wasChecked) {
        // Tile was unchecked
        peerConnectionRef.current.broadcastTileUnvalidation(newChecked.length);
      } else {
        // Tile was checked
        peerConnectionRef.current.broadcastTileValidation(newChecked.length);
      }
    }

    // Check for bingo (only when checking a tile)
    if (!wasChecked && card) {
      if (checkForBingo(newChecked, card.rows, card.columns)) {
        setShowCelebration(true);
        // Broadcast win
        if (peerConnectionRef.current) {
          peerConnectionRef.current.broadcastWin();
        }
      }
    }
  };

  const resetCard = () => {
    if (!window.confirm("Are you sure you want to reset all checked tiles?"))
      return;
    setCheckedTiles([]);
    localStorage.removeItem(`bingo-card-${id}`);

    // Broadcast reset progress
    if (peerConnectionRef.current) {
      peerConnectionRef.current.broadcastTileValidation(0);
    }
  };

  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Share link copied to clipboard!");
  };

  const handleNameSubmit = () => {
    if (!playerName.trim()) {
      return;
    }
    if (!playerNameUtils.isValidName(playerName)) {
      alert("Name must be 1-10 characters (letters, digits, -, _ only)");
      return;
    }
    playerNameUtils.savePlayerName(playerName);
    setShowNameModal(false);
  };

  if (loading) return <div className="loading">Loading card...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!card) return null;

  return (
    <div>
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      {showNameModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Welcome!</h2>
            <p>Please enter your name to start playing:</p>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#95a5a6",
                marginTop: "-0.5rem",
              }}
            >
              (1-10 characters: letters, digits, -, _ only)
            </p>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your name..."
              maxLength={10}
              className="modal-input"
              autoFocus
              onKeyPress={(e) => e.key === "Enter" && handleNameSubmit()}
            />
            <div className="modal-buttons">
              <button className="success" onClick={handleNameSubmit}>
                Start Playing
              </button>
            </div>
          </div>
        </div>
      )}
      {showCelebration && (
        <div
          className="celebration-overlay"
          onClick={() => setShowCelebration(false)}
        >
          <div className="celebration-content">
            <h1 className="celebration-text">
              CONGRATULATIONS{playerName ? ` ${playerName.toUpperCase()}` : ""}!
            </h1>
            <p className="celebration-subtext">You got a BINGO! 🎉</p>
            <button
              className="celebration-button"
              onClick={() => setShowCelebration(false)}
            >
              Continue Playing
            </button>
          </div>
          <div className="fireworks">
            <div className="firework"></div>
            <div className="firework"></div>
            <div className="firework"></div>
            <div className="firework"></div>
            <div className="firework"></div>
          </div>
        </div>
      )}
      <div className="play-card-layout">
        {isPeerConnected && (
          <>
            {/* Mobile backdrop overlay - click to close player list */}
            {isPlayerListOpen && (
              <div
                className="player-list-backdrop"
                onClick={() => setIsPlayerListOpen(false)}
                aria-hidden="true"
              />
            )}

            {/* Mobile: Toggle button for player list (hidden by default) */}
            <button
              className="player-list-toggle"
              onClick={() => setIsPlayerListOpen(!isPlayerListOpen)}
              aria-label={
                isPlayerListOpen ? "Hide player list" : "Show player list"
              }
              aria-expanded={isPlayerListOpen}
            >
              👥 Active Players ({players.length})
              <span className={`toggle-icon ${isPlayerListOpen ? "open" : ""}`}>
                {isPlayerListOpen ? "▼" : "▶"}
              </span>
            </button>

            {/* Player list sidebar (hidden by default on mobile) */}
            <aside
              className={`player-list-sidebar ${isPlayerListOpen ? "mobile-open" : ""}`}
              aria-hidden={!isPlayerListOpen}
            >
              <PlayerList players={players} totalTiles={card.tiles.length} />
            </aside>
          </>
        )}

        <div className="play-card-main">
          <div className="play-card-header">
            <h1>{card.title}</h1>
            <p className="progress-info">
              {checkedTiles.length} / {card.tiles.length} tiles checked
            </p>
          </div>

          <div className="card">
            <div
              className="bingo-grid play-mode"
              style={{
                gridTemplateColumns: `repeat(${card.columns}, 1fr)`,
                gridTemplateRows: `repeat(${card.rows}, 1fr)`,
              }}
            >
              {card.tiles.map((tile) => (
                <div
                  key={tile.position}
                  className={`bingo-tile ${checkedTiles.includes(tile.position) ? "checked" : ""}`}
                  onClick={() => handleTileClick(tile)}
                >
                  <span>{tile.value}</span>
                </div>
              ))}
            </div>

            <div className="button-group" style={{ marginTop: "2rem" }}>
              <button onClick={copyShareLink}>Share Link</button>
              <button className="danger" onClick={resetCard}>
                Reset
              </button>
            </div>

            <p
              style={{
                textAlign: "center",
                marginTop: "1rem",
                fontSize: "0.9rem",
                color: "#95a5a6",
              }}
            >
              Click on tiles to check them off. Your progress is saved in your
              browser.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile bottom action bar - fixed at bottom on mobile */}
      <MobileActionBar
        buttons={[
          ...(isPeerConnected
            ? [
                {
                  icon: "👥",
                  label: `Players ${isPlayerListOpen ? "▼" : "▲"}`,
                  onClick: () => setIsPlayerListOpen(!isPlayerListOpen),
                  active: isPlayerListOpen,
                  ariaLabel: isPlayerListOpen
                    ? "Hide player list"
                    : "Show player list",
                  ariaExpanded: isPlayerListOpen,
                },
              ]
            : []),
          {
            icon: "🔗",
            label: "Share",
            onClick: copyShareLink,
            ariaLabel: "Share card link",
          },
          {
            icon: "↻",
            label: "Reset",
            onClick: resetCard,
            variant: "danger",
            ariaLabel: "Reset card progress",
          },
        ]}
      />

      {/* Mobile tile viewer modal */}
      {selectedTile && (
        <div
          className="tile-viewer-overlay"
          onClick={() => setSelectedTile(null)}
        >
          <div
            className="tile-viewer-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tile-viewer-tile">
              <span>{selectedTile.value}</span>
            </div>
            <div className="tile-viewer-actions">
              <button
                className={`tile-viewer-btn ${checkedTiles.includes(selectedTile.position) ? "uncheck-btn" : "check-btn"}`}
                onClick={() => {
                  toggleTile(selectedTile.position);
                  setSelectedTile(null);
                }}
                aria-label={
                  checkedTiles.includes(selectedTile.position)
                    ? "Uncheck tile"
                    : "Check tile"
                }
              >
                {checkedTiles.includes(selectedTile.position) ? (
                  <>
                    <span className="btn-icon">✕</span>
                    <span className="btn-text">Uncheck</span>
                  </>
                ) : (
                  <>
                    <span className="btn-icon">✓</span>
                    <span className="btn-text">Check</span>
                  </>
                )}
              </button>
              <button
                className="tile-viewer-btn close-btn"
                onClick={() => setSelectedTile(null)}
                aria-label="Close"
              >
                <span className="btn-icon">×</span>
                <span className="btn-text">Close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayCard;
