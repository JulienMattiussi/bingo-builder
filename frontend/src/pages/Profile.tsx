import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { playerNameUtils } from "../utils/playerName";
import { userIdUtils } from "../utils/userId";
import { api } from "../utils/api";
import { useCardProgress } from "../hooks/useCardProgress";
import BingoCardItem from "../components/BingoCardItem";
import PlayedCardItem from "../components/PlayedCardItem";
import { Card } from "../types/models";
import config from "../config";

function Profile() {
  const navigate = useNavigate();
  const [currentName, setCurrentName] = useState("");
  const [newName, setNewName] = useState("");
  const [userId, setUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [ownedCards, setOwnedCards] = useState<Card[]>([]);
  const [playedCards, setPlayedCards] = useState<Card[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const { getCardProgress } = useCardProgress();

  useEffect(() => {
    const name = playerNameUtils.getPlayerName();
    if (!name) {
      // No profile exists, redirect to home
      navigate("/");
      return;
    }
    setCurrentName(name);
    setNewName(name);
    
    // Get user ID
    const id = userIdUtils.getUserId();
    setUserId(id);
    
    loadCards(id);
  }, [navigate]);

  const loadCards = async (currentUserId: string) => {
    try {
      setLoadingCards(true);
      const allCards = await api.getCards();

      // Filter owned cards using ownerId
      const owned = allCards.filter((card) => card.ownerId === currentUserId);
      setOwnedCards(owned);

      // Find played cards by checking localStorage
      const played = allCards.filter((card) => {
        const storedProgress = localStorage.getItem(`bingo-card-${card._id}`);
        return storedProgress !== null;
      });
      setPlayedCards(played);

      setLoadingCards(false);
    } catch (err) {
      console.error("Failed to load cards:", err);
      setLoadingCards(false);
    }
  };

  const handleUpdateName = async () => {
    setError(null);
    setSuccess(null);

    if (!newName.trim()) {
      setError("Please enter a nickname");
      return;
    }

    if (!playerNameUtils.isValidName(newName)) {
      setError("Nickname must be 1-10 characters (letters, digits, -, _ only)");
      return;
    }

    if (newName === currentName) {
      setIsEditing(false);
      return;
    }

    try {
      // Update creator name on all existing cards
      const result = await api.updateCreatorName(currentName, newName, userId);

      // Update localStorage
      playerNameUtils.savePlayerName(newName);
      setCurrentName(newName);
      setIsEditing(false);

      if (result.modifiedCount > 0) {
        setSuccess(
          `Nickname updated successfully! ${result.modifiedCount} card(s) updated.`,
        );
      } else {
        setSuccess("Nickname updated successfully!");
      }

      // Reload cards with same user ID
      loadCards(userId);
    } catch (err) {
      setError((err as Error).message || "Failed to update nickname");
    }
  };

  const handleUnpublish = async (cardId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to unpublish this card? It will become editable again.",
      )
    )
      return;

    try {
      await api.unpublishCard(cardId, userId);
      await loadCards(userId);
      setSuccess("Card unpublished successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError((err as Error).message);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteProfile = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete your profile "${currentName}"?\n\nThis will permanently delete ALL bingo cards you created.\n\nThis action cannot be undone!`,
      )
    ) {
      return;
    }

    // Double confirmation for safety
    if (
      !window.confirm(
        "Final confirmation: Delete your profile and ALL your cards?",
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);

      // Delete all cards owned by this user
      await api.deleteCardsByCreator(userId);

      // Clear profile and user ID from localStorage
      playerNameUtils.clearPlayerName();
      userIdUtils.clearUserId();

      // Redirect to home
      navigate("/");
    } catch (err) {
      setError((err as Error).message || "Failed to delete profile");
      setDeleting(false);
    }
  };

  const handleCancelEdit = () => {
    setNewName(currentName);
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  if (!currentName) {
    return null;
  }

  return (
    <div>
      <h1 style={{ marginBottom: "1rem" }}>Profile</h1>

      {error && <div className="error">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="card">
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
            Your Nickname
          </h2>

          {!isEditing ? (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <span
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    color: "#2c3e50",
                  }}
                >
                  {currentName}
                </span>
                <button onClick={() => setIsEditing(true)}>
                  Change Nickname
                </button>
              </div>
              <p style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>
                This nickname appears on all bingo cards you create.
              </p>
            </div>
          ) : (
            <div>
              <p
                style={{
                  marginBottom: "0.5rem",
                  color: "#7f8c8d",
                  fontSize: "0.9rem",
                }}
              >
                (1-10 characters: letters, digits, -, _ only)
              </p>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new nickname..."
                maxLength={config.playerNameMaxLength}
                className="title-input"
                autoFocus
                onKeyPress={(e) => e.key === "Enter" && handleUpdateName()}
                style={{ marginBottom: "1rem" }}
              />
              <div className="button-group" style={{ marginTop: "1rem" }}>
                <button onClick={handleCancelEdit}>Cancel</button>
                <button className="success" onClick={handleUpdateName}>
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>

        <hr style={{ margin: "2rem 0", border: "1px solid #dee2e6" }} />

        {/* User ID Section */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
            Your User ID
          </h2>
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#f8f9fa",
              borderRadius: "0.5rem",
              border: "1px solid #dee2e6",
            }}
          >
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "0.9rem",
                color: "#2c3e50",
                wordBreak: "break-all",
                marginBottom: "0.5rem",
              }}
            >
              {userId}
            </p>
            <p style={{ color: "#7f8c8d", fontSize: "0.85rem", margin: 0 }}>
              🔒 This is your secret ownership ID. Keep it private! It proves
              you own your cards and cannot be changed.
            </p>
          </div>
        </div>

        <hr style={{ margin: "2rem 0", border: "1px solid #dee2e6" }} />

        {/* Owned Cards Section */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
            Your Bingo Cards
          </h2>
          {loadingCards ? (
            <p style={{ color: "#7f8c8d" }}>Loading...</p>
          ) : ownedCards.length === 0 ? (
            <p style={{ color: "#7f8c8d" }}>
              You haven&apos;t created any bingo cards yet.{" "}
              <Link to="/create" style={{ color: "#3498db" }}>
                Create one now!
              </Link>
            </p>
          ) : (
            <div className="card-list">
              {ownedCards.map((card) => {
                const progress = getCardProgress(card._id, card.tiles.length);
                return (
                  <BingoCardItem
                    key={card._id}
                    card={card}
                    currentPlayerName={currentName}
                    progress={progress}
                    onUnpublish={handleUnpublish}
                    showPreview={false}
                    layout="horizontal"
                  />
                );
              })}
            </div>
          )}
        </div>

        <hr style={{ margin: "2rem 0", border: "1px solid #dee2e6" }} />

        {/* Played Cards Section */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
            Played Bingo Cards
          </h2>
          {loadingCards ? (
            <p style={{ color: "#7f8c8d" }}>Loading...</p>
          ) : playedCards.length === 0 ? (
            <p style={{ color: "#7f8c8d" }}>
              You haven&apos;t played any bingo cards yet.
            </p>
          ) : (
            <div className="card-list">
              {playedCards.map((card) => {
                const progress = getCardProgress(card._id, card.tiles.length);
                return (
                  <PlayedCardItem
                    key={card._id}
                    card={card}
                    checkedCount={progress.checkedCount}
                    totalTiles={card.tiles.length}
                  />
                );
              })}
            </div>
          )}
        </div>

        <hr style={{ margin: "2rem 0", border: "1px solid #dee2e6" }} />

        <div>
          <h2
            style={{
              marginBottom: "1rem",
              fontSize: "1.5rem",
              color: "#e74c3c",
            }}
          >
            Danger Zone
          </h2>
          <p
            style={{
              color: "#7f8c8d",
              fontSize: "0.9rem",
              marginBottom: "1rem",
            }}
          >
            Deleting your profile will permanently remove:
          </p>
          <ul
            style={{
              color: "#7f8c8d",
              fontSize: "0.9rem",
              marginBottom: "1rem",
              marginLeft: "1.5rem",
            }}
          >
            <li>Your nickname from this device</li>
            <li>ALL bingo cards you created</li>
            <li>This action cannot be undone</li>
          </ul>
          <button
            className="danger"
            onClick={handleDeleteProfile}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Profile & All Cards"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
