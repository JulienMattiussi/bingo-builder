import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import { playerNameUtils } from "../utils/playerName";

function Home() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentPlayerName = playerNameUtils.getPlayerName();

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      const data = await api.getCards();
      // Sort cards by priority
      const sortedCards = sortCardsByPriority(data);
      setCards(sortedCards);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCardProgress = (cardId, totalTiles) => {
    const stored = localStorage.getItem(`bingo-card-${cardId}`);
    if (!stored)
      return {
        played: false,
        completed: false,
        checkedCount: 0,
        checkedTiles: [],
      };
    try {
      const checkedTiles = JSON.parse(stored);
      return {
        played: true,
        completed: checkedTiles.length === totalTiles,
        checkedCount: checkedTiles.length,
        checkedTiles: checkedTiles,
      };
    } catch {
      return {
        played: false,
        completed: false,
        checkedCount: 0,
        checkedTiles: [],
      };
    }
  };

  const sortCardsByPriority = (cardsData) => {
    const currentPlayer = currentPlayerName;

    return cardsData.sort((a, b) => {
      const aOwner = a.createdBy === currentPlayer;
      const bOwner = b.createdBy === currentPlayer;
      const aProgress = getCardProgress(a._id, a.tiles.length);
      const bProgress = getCardProgress(b._id, b.tiles.length);

      // Priority 1: Cards I started but not won yet
      const aPlayedNotWon = aProgress.played && !aProgress.completed;
      const bPlayedNotWon = bProgress.played && !bProgress.completed;
      if (aPlayedNotWon && !bPlayedNotWon) return -1;
      if (!aPlayedNotWon && bPlayedNotWon) return 1;

      // Priority 2: Cards I created and not published
      const aMyUnpublished = aOwner && !a.isPublished;
      const bMyUnpublished = bOwner && !b.isPublished;
      if (aMyUnpublished && !bMyUnpublished) return -1;
      if (!aMyUnpublished && bMyUnpublished) return 1;

      // Priority 3: Cards I published
      const aMyPublished = aOwner && a.isPublished;
      const bMyPublished = bOwner && b.isPublished;
      if (aMyPublished && !bMyPublished) return -1;
      if (!aMyPublished && bMyPublished) return 1;

      // Priority 4: Cards published by others
      const aOthersPublished = !aOwner && a.isPublished;
      const bOthersPublished = !bOwner && b.isPublished;
      if (aOthersPublished && !bOthersPublished) return -1;
      if (!aOthersPublished && bOthersPublished) return 1;

      // Priority 5: Cards created by others but not published
      // (already at the bottom by default)

      return 0;
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this card?")) return;

    try {
      await api.deleteCard(id, currentPlayerName);
      await loadCards();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUnpublish = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to unpublish this card? It will become editable again.",
      )
    )
      return;

    try {
      await api.unpublishCard(id, currentPlayerName);
      await loadCards();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="loading">Loading cards...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const publishedCards = cards.filter((card) => card.isPublished);
  const unpublishedCards = cards.filter((card) => !card.isPublished);

  const renderCard = (card) => {
    const isOwner = card.createdBy === currentPlayerName;
    const progress = getCardProgress(card._id, card.tiles.length);

    return (
      <div key={card._id} className="card-item">
        <h3>
          {isOwner && (
            <span
              className="player-icon owner-icon"
              style={{ marginRight: "0.25rem" }}
            >
              ⭐
            </span>
          )}
          {card.title}
          {progress.completed && (
            <span
              className="player-icon winner-icon"
              style={{ marginLeft: "0.25rem" }}
            >
              👑
            </span>
          )}
        </h3>

        {/* Card preview grid */}
        <div
          className="card-preview"
          style={{
            gridTemplateColumns: `repeat(${card.columns}, 1fr)`,
            gridTemplateRows: `repeat(${card.rows}, 1fr)`,
          }}
        >
          {card.tiles.map((tile, index) => {
            const isChecked = progress.checkedTiles.includes(tile.position);
            return (
              <div
                key={index}
                className={`preview-tile ${!tile.value || !tile.value.trim() ? "empty" : ""} ${isChecked ? "checked" : ""}`}
                title={tile.value || "Empty"}
              >
                {tile.value && tile.value.trim() ? (
                  <span>
                    {tile.value.length > 12
                      ? tile.value.substring(0, 12) + "..."
                      : tile.value}
                  </span>
                ) : (
                  <span className="empty-marker">●</span>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: "12px", marginBottom: "10px" }}>
          {card.isPublished ? (
            <p
              style={{
                fontSize: "0.85rem",
                color: "#95a5a6",
              }}
            >
              ✓ Published on {new Date(card.publishedAt).toLocaleDateString()}
              {card.createdBy && (
                <span>
                  {" • Created by "}
                  {card.createdBy}
                  {isOwner && " (you)"}
                </span>
              )}
            </p>
          ) : (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {card.tiles.filter((t) => !t.value || !t.value.trim()).length >
                0 ? (
                  <span className="status-badge incomplete">Incomplete</span>
                ) : (
                  <span className="status-badge complete">Complete</span>
                )}
                <span style={{ fontSize: "0.85rem", color: "#95a5a6" }}>
                  {card.tiles.filter((t) => t.value && t.value.trim()).length}/
                  {card.tiles.length} filled
                </span>
              </div>
              {card.createdBy && (
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#95a5a6",
                    marginTop: "4px",
                  }}
                >
                  Created by {card.createdBy}
                  {isOwner && " (you)"}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="button-group" style={{ justifyContent: "flex-start" }}>
          {card.isPublished ? (
            <>
              <Link to={`/play/${card._id}`}>
                <button>{progress.played ? "Continue" : "Play"}</button>
              </Link>
              {isOwner && (
                <button
                  className="warning"
                  onClick={() => handleUnpublish(card._id)}
                >
                  Unpublish
                </button>
              )}
            </>
          ) : (
            <>
              {isOwner ? (
                <>
                  <Link to={`/edit/${card._id}`}>
                    <button>Edit</button>
                  </Link>
                  <button
                    className="danger"
                    onClick={() => handleDelete(card._id)}
                  >
                    Delete
                  </button>
                </>
              ) : (
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#95a5a6",
                    fontStyle: "italic",
                    margin: 0,
                  }}
                >
                  Only the owner can edit this card
                </p>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1>Bingo Cards</h1>
        <Link to="/create">
          <button className="success">+ Create New Card</button>
        </Link>
      </div>

      {cards.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: "center", padding: "2rem", color: "#7f8c8d" }}>
            No cards yet. Create your first bingo card!
          </p>
        </div>
      ) : (
        <>
          {/* Published Cards Section */}
          {publishedCards.length > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontSize: "1.3rem",
                  marginBottom: "1rem",
                  color: "#2c3e50",
                }}
              >
                Published Cards
              </h2>
              <div className="card-list">{publishedCards.map(renderCard)}</div>
            </div>
          )}

          {/* Unpublished Cards Section */}
          {unpublishedCards.length > 0 && (
            <div>
              <h2
                style={{
                  fontSize: "1.3rem",
                  marginBottom: "1rem",
                  color: "#2c3e50",
                }}
              >
                Unpublished Cards
              </h2>
              <div className="card-list">
                {unpublishedCards.map(renderCard)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Home;
