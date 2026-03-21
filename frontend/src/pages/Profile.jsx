import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { playerNameUtils } from "../utils/playerName";
import { api } from "../utils/api";

function Profile() {
  const navigate = useNavigate();
  const [currentName, setCurrentName] = useState("");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [ownedCards, setOwnedCards] = useState([]);
  const [playedCards, setPlayedCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);

  useEffect(() => {
    const name = playerNameUtils.getPlayerName();
    if (!name) {
      // No profile exists, redirect to home
      navigate("/");
      return;
    }
    setCurrentName(name);
    setNewName(name);
    loadCards(name);
  }, [navigate]);

  const loadCards = async (playerName) => {
    try {
      setLoadingCards(true);
      const allCards = await api.getCards();

      // Filter owned cards
      const owned = allCards.filter((card) => card.createdBy === playerName);
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
      setError("Please enter a name");
      return;
    }

    if (!playerNameUtils.isValidName(newName)) {
      setError("Name must be 1-10 characters (letters, digits, -, _ only)");
      return;
    }

    if (newName === currentName) {
      setIsEditing(false);
      return;
    }

    try {
      // Update creator name on all existing cards
      const result = await api.updateCreatorName(currentName, newName);

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

      // Reload cards with new name
      loadCards(newName);
    } catch (err) {
      setError(err.message || "Failed to update nickname");
    }
  };

  const getCardProgress = (cardId) => {
    const stored = localStorage.getItem(`bingo-card-${cardId}`);
    if (!stored) return 0;
    try {
      const checkedTiles = JSON.parse(stored);
      return checkedTiles.length;
    } catch {
      return 0;
    }
  };

  const handleUnpublish = async (cardId) => {
    if (
      !window.confirm(
        "Are you sure you want to unpublish this card? It will become editable again.",
      )
    )
      return;

    try {
      await api.unpublishCard(cardId, currentName);
      await loadCards(currentName);
      setSuccess("Card unpublished successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
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

      // Delete all cards created by this user
      await api.deleteCardsByCreator(currentName);

      // Clear profile from localStorage
      playerNameUtils.clearPlayerName();

      // Redirect to home
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to delete profile");
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
                This name appears on all bingo cards you create.
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
                placeholder="Enter new name..."
                maxLength={10}
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

        {/* Owned Cards Section */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
            Your Bingo Cards
          </h2>
          {loadingCards ? (
            <p style={{ color: "#7f8c8d" }}>Loading...</p>
          ) : ownedCards.length === 0 ? (
            <p style={{ color: "#7f8c8d" }}>
              You haven't created any bingo cards yet.{" "}
              <Link to="/create" style={{ color: "#3498db" }}>
                Create one now!
              </Link>
            </p>
          ) : (
            <div className="card-list">
              {ownedCards.map((card) => (
                <div
                  key={card._id}
                  className="card-item"
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, marginBottom: "0.5rem" }}>
                      {card.title}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "#7f8c8d",
                        margin: "0.25rem 0",
                      }}
                    >
                      {card.rows}×{card.columns} grid
                    </p>
                    <p style={{ fontSize: "0.9rem", margin: "0.25rem 0" }}>
                      {card.isPublished ? (
                        <span
                          className="status-badge"
                          style={{ backgroundColor: "#27ae60" }}
                        >
                          Published
                        </span>
                      ) : (
                        <span
                          className="status-badge"
                          style={{ backgroundColor: "#f39c12" }}
                        >
                          Draft
                        </span>
                      )}
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      minWidth: "100px",
                    }}
                  >
                    {card.isPublished ? (
                      <>
                        <Link to={`/play/${card._id}`}>
                          <button
                            style={{
                              width: "100%",
                              fontSize: "0.85rem",
                              padding: "0.4rem 0.6rem",
                            }}
                          >
                            Play
                          </button>
                        </Link>
                        <button
                          className="warning"
                          style={{
                            width: "100%",
                            fontSize: "0.85rem",
                            padding: "0.4rem 0.6rem",
                          }}
                          onClick={() => handleUnpublish(card._id)}
                        >
                          Unpublish
                        </button>
                      </>
                    ) : (
                      <Link to={`/edit/${card._id}`}>
                        <button
                          style={{
                            width: "100%",
                            fontSize: "0.85rem",
                            padding: "0.4rem 0.6rem",
                          }}
                        >
                          Edit
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
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
              You haven't played any bingo cards yet.
            </p>
          ) : (
            <div className="card-list">
              {playedCards.map((card) => {
                const checkedCount = getCardProgress(card._id);
                const totalTiles = card.tiles.length;
                const isCompleted = checkedCount === totalTiles;
                const progressPercent = Math.round(
                  (checkedCount / totalTiles) * 100,
                );

                return (
                  <div
                    key={card._id}
                    className="card-item"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, marginBottom: "0.5rem" }}>
                        {card.title}
                        {isCompleted && (
                          <span style={{ marginLeft: "0.5rem" }}>👑</span>
                        )}
                      </h3>
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "#7f8c8d",
                          margin: "0.25rem 0",
                        }}
                      >
                        Progress: {checkedCount}/{totalTiles} ({progressPercent}
                        %)
                      </p>
                      {card.createdBy && (
                        <p
                          style={{
                            fontSize: "0.8rem",
                            color: "#95a5a6",
                            margin: "0.25rem 0",
                          }}
                        >
                          By {card.createdBy}
                        </p>
                      )}
                    </div>
                    <div style={{ minWidth: "100px" }}>
                      <Link to={`/play/${card._id}`}>
                        <button
                          style={{
                            width: "100%",
                            fontSize: "0.85rem",
                            padding: "0.4rem 0.6rem",
                          }}
                        >
                          {isCompleted ? "View" : "Continue"}
                        </button>
                      </Link>
                    </div>
                  </div>
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
