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
      setCards(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        <h1>My Bingo Cards</h1>
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
        <div className="card-list">
          {cards.map((card) => {
            const isOwner = card.createdBy === currentPlayerName;

            return (
              <div key={card._id} className="card-item">
                <h3>{card.title}</h3>

                {/* Card preview grid */}
                <div
                  className="card-preview"
                  style={{
                    gridTemplateColumns: `repeat(${card.columns}, 1fr)`,
                    gridTemplateRows: `repeat(${card.rows}, 1fr)`,
                  }}
                >
                  {card.tiles.map((tile, index) => (
                    <div
                      key={index}
                      className={`preview-tile ${!tile.value || !tile.value.trim() ? "empty" : ""}`}
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
                  ))}
                </div>

                <div style={{ marginTop: "12px", marginBottom: "10px" }}>
                  {card.isPublished ? (
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "#95a5a6",
                      }}
                    >
                      ✓ Published on{" "}
                      {new Date(card.publishedAt).toLocaleDateString()}
                      {card.createdBy && (
                        <span> • Created by {card.createdBy}</span>
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
                        {card.tiles.filter((t) => !t.value || !t.value.trim())
                          .length > 0 ? (
                          <span className="status-badge incomplete">
                            Incomplete
                          </span>
                        ) : (
                          <span className="status-badge complete">
                            Complete
                          </span>
                        )}
                        <span style={{ fontSize: "0.85rem", color: "#95a5a6" }}>
                          {
                            card.tiles.filter((t) => t.value && t.value.trim())
                              .length
                          }
                          /{card.tiles.length} filled
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
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div
                  className="button-group"
                  style={{ justifyContent: "flex-start" }}
                >
                  {card.isPublished ? (
                    <>
                      <Link to={`/play/${card._id}`}>
                        <button>Play</button>
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
          })}
        </div>
      )}
    </div>
  );
}

export default Home;
