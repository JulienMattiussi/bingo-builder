import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { playerNameUtils } from "../utils/playerName";
import { userIdUtils } from "../utils/userId";
import { api } from "../utils/api";
import { useCardProgress } from "../hooks/useCardProgress";
import BingoCardItem from "../components/BingoCardItem";
import PlayedCardItem from "../components/PlayedCardItem";
import { Card } from "../types/models";
import config from "../config";

// Key sequence for super admin: "admin"
const ADMIN_KEY_SEQUENCE = ["a", "d", "m", "i", "n"];
const SEQUENCE_TIMEOUT = 2000; // 2 seconds to complete sequence

function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
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

  // Super admin state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminCards, setAdminCards] = useState<Card[]>([]);
  const [adminStats, setAdminStats] = useState<{
    totalCards: number;
    publishedCards: number;
    unpublishedCards: number;
    totalUsers: number;
  } | null>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

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

    loadCards();
  }, [navigate, location.state]);

  const loadCards = async () => {
    try {
      setLoadingCards(true);
      const allCards = await api.getCards();

      // Filter owned cards using isOwner flag
      const owned = allCards.filter((card) => card.isOwner);
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
  // Key sequence detection for super admin access
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let keySequence: string[] = []; // Local sequence tracking

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input fields or if admin mode already active
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        adminToken
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Add key to sequence
      keySequence = [...keySequence, key];

      // Check if sequence matches
      if (keySequence.length === ADMIN_KEY_SEQUENCE.length) {
        const matches = ADMIN_KEY_SEQUENCE.every(
          (k, i) => k === keySequence[i],
        );
        if (matches) {
          setShowPasswordModal(true);
        }
        keySequence = []; // Reset sequence
      }

      // Reset sequence after timeout
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        keySequence = [];
      }, SEQUENCE_TIMEOUT);
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      clearTimeout(timeoutId);
    };
  }, [adminToken]);

  // Super admin functions
  const handleAdminLogin = async () => {
    try {
      setAdminError(null);
      setLoadingAdmin(true);

      const result = await api.superAdminLogin(adminPassword);
      setAdminToken(result.token);
      setShowPasswordModal(false);
      setAdminPassword("");
      setShowPassword(false);

      // Load admin data
      await loadAdminData(result.token);
    } catch (err) {
      setAdminError((err as Error).message || "Login failed");
    } finally {
      setLoadingAdmin(false);
    }
  };

  const loadAdminData = async (token: string) => {
    try {
      setLoadingAdmin(true);
      const [cards, stats] = await Promise.all([
        api.superAdminListAllCards(token),
        api.superAdminGetStats(token),
      ]);
      setAdminCards(cards);
      setAdminStats(stats);
    } catch (err) {
      setAdminError((err as Error).message || "Failed to load admin data");
      // Token might be expired
      if ((err as Error).message.includes("token")) {
        setAdminToken(null);
      }
    } finally {
      setLoadingAdmin(false);
    }
  };

  const handleAdminDeleteCard = async (cardId: string) => {
    if (!adminToken) return;

    if (!window.confirm("Delete this card? This action cannot be undone.")) {
      return;
    }

    try {
      await api.superAdminDeleteCard(adminToken, cardId);
      await loadAdminData(adminToken);
      setSuccess("Card deleted successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setAdminError((err as Error).message || "Failed to delete card");
      setTimeout(() => setAdminError(null), 3000);
    }
  };

  const handleAdminDeleteUser = async (ownerId: string) => {
    if (!adminToken) return;

    const userCards = adminCards.filter((c) => c.ownerId === ownerId);
    if (
      !window.confirm(
        `Delete user ${userCards[0]?.createdBy || ownerId} and all their ${userCards.length} cards? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const result = await api.superAdminDeleteUser(adminToken, ownerId);
      await loadAdminData(adminToken);
      setSuccess(
        `User deleted successfully (${result.deletedCardsCount} cards removed)`,
      );
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setAdminError((err as Error).message || "Failed to delete user");
      setTimeout(() => setAdminError(null), 3000);
    }
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    setAdminCards([]);
    setAdminStats(null);
    setAdminError(null);
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

      // Reload cards
      loadCards();
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
      await loadCards();
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
      {/* Super Admin Password Modal */}
      {showPasswordModal && !adminToken && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => {
            setShowPasswordModal(false);
            setAdminPassword("");
            setShowPassword(false);
            setAdminError(null);
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: "400px",
              width: "90%",
              padding: "2rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: "1rem" }}>🔐 Super Admin</h2>
            {adminError && (
              <div className="error" style={{ marginBottom: "1rem" }}>
                {adminError}
              </div>
            )}
            <div style={{ position: "relative", marginBottom: "1rem" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password..."
                className="title-input"
                autoFocus
                onKeyPress={(e) => e.key === "Enter" && handleAdminLogin()}
                style={{
                  paddingRight: "3rem",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "0.5rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.5rem",
                  fontSize: "1.2rem",
                  lineHeight: 1,
                  opacity: 0.6,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <div className="button-group">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setAdminPassword("");
                  setShowPassword(false);
                  setAdminError(null);
                }}
              >
                Cancel
              </button>
              <button
                className="success"
                onClick={handleAdminLogin}
                disabled={loadingAdmin || !adminPassword}
              >
                {loadingAdmin ? "Logging in..." : "Login"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Panel */}
      {adminToken && (
        <div
          className="card"
          style={{
            marginBottom: "2rem",
            border: "2px solid #e74c3c",
            backgroundColor: "#fff5f5",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h2 style={{ margin: 0, color: "#e74c3c" }}>
              🔐 Super Admin Panel
            </h2>
            <button onClick={handleAdminLogout}>Logout</button>
          </div>

          {adminError && (
            <div className="error" style={{ marginBottom: "1rem" }}>
              {adminError}
            </div>
          )}

          {/* Statistics */}
          {adminStats && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "1rem",
                marginBottom: "2rem",
              }}
            >
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#fff",
                  borderRadius: "0.5rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
                  {adminStats.totalCards}
                </div>
                <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>
                  Total Cards
                </div>
              </div>
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#fff",
                  borderRadius: "0.5rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
                  {adminStats.publishedCards}
                </div>
                <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>
                  Published
                </div>
              </div>
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#fff",
                  borderRadius: "0.5rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
                  {adminStats.unpublishedCards}
                </div>
                <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>
                  Unpublished
                </div>
              </div>
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#fff",
                  borderRadius: "0.5rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
                  {adminStats.totalUsers}
                </div>
                <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>
                  Total Users
                </div>
              </div>
            </div>
          )}

          {/* All Cards List */}
          <h3 style={{ marginBottom: "1rem" }}>All System Cards</h3>
          {loadingAdmin ? (
            <p>Loading...</p>
          ) : adminCards.length === 0 ? (
            <p style={{ color: "#7f8c8d" }}>No cards in the system.</p>
          ) : (
            <div
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                backgroundColor: "#fff",
                borderRadius: "0.5rem",
                padding: "1rem",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid #dee2e6",
                      textAlign: "left",
                    }}
                  >
                    <th style={{ padding: "0.5rem" }}>Title</th>
                    <th style={{ padding: "0.5rem" }}>Creator</th>
                    <th style={{ padding: "0.5rem" }}>Status</th>
                    <th style={{ padding: "0.5rem" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminCards.map((card) => (
                    <tr
                      key={card._id}
                      style={{ borderBottom: "1px solid #dee2e6" }}
                    >
                      <td style={{ padding: "0.5rem" }}>{card.title}</td>
                      <td
                        style={{
                          padding: "0.5rem",
                          fontFamily: "monospace",
                          fontSize: "0.85rem",
                        }}
                      >
                        {card.createdBy}
                      </td>
                      <td style={{ padding: "0.5rem" }}>
                        {card.isPublished ? (
                          <span
                            style={{
                              color: "#27ae60",
                              fontWeight: "bold",
                              fontSize: "0.9rem",
                            }}
                          >
                            ✓ Published
                          </span>
                        ) : (
                          <span
                            style={{
                              color: "#7f8c8d",
                              fontSize: "0.9rem",
                            }}
                          >
                            Draft
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "0.5rem" }}>
                        <button
                          onClick={() => handleAdminDeleteCard(card._id)}
                          style={{
                            fontSize: "0.85rem",
                            padding: "0.25rem 0.5rem",
                          }}
                          className="danger"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* User Management */}
          <h3 style={{ marginTop: "2rem", marginBottom: "1rem" }}>
            User Management
          </h3>
          {adminCards.length > 0 && (
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "0.5rem",
                padding: "1rem",
              }}
            >
              {/* Group cards by owner */}
              {Object.entries(
                adminCards.reduce(
                  (acc, card) => {
                    // Admin endpoint includes ownerId
                    const ownerId = card.ownerId || "unknown";
                    if (!acc[ownerId]) {
                      acc[ownerId] = {
                        createdBy: card.createdBy,
                        cards: [],
                      };
                    }
                    acc[ownerId].cards.push(card);
                    return acc;
                  },
                  {} as Record<
                    string,
                    { createdBy: string; cards: typeof adminCards }
                  >,
                ),
              ).map(([ownerId, userData]) => (
                <div
                  key={ownerId}
                  style={{
                    marginBottom: "1rem",
                    padding: "1rem",
                    border: "1px solid #dee2e6",
                    borderRadius: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "bold" }}>
                        {userData.createdBy}
                      </div>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: "#7f8c8d",
                          fontFamily: "monospace",
                        }}
                      >
                        {ownerId}
                      </div>
                      <div style={{ fontSize: "0.9rem", color: "#7f8c8d" }}>
                        {userData.cards.length} card(s)
                      </div>
                    </div>
                    <button
                      onClick={() => handleAdminDeleteUser(ownerId)}
                      className="danger"
                      style={{ fontSize: "0.9rem" }}
                    >
                      Delete User & Cards
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
