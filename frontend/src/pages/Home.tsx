import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { playerNameUtils } from "../utils/playerName";
import { userIdUtils } from "../utils/userId";
import { useCardProgress } from "../hooks/useCardProgress";
import { sortCardsByPriority } from "../utils/cardSort";
import BingoCardItem from "../components/BingoCardItem";
import { Card } from "../types/models";

function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentPlayerName = playerNameUtils.getPlayerName();
  const { getCardProgress } = useCardProgress();

  useEffect(() => {
    loadCards();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const loadCards = async () => {
    try {
      setLoading(true);
      const data = await api.getCards();
      const currentUserId = userIdUtils.getUserId();
      
      // Filter out unpublished cards that don't belong to the current user
      const visibleCards = data.filter(
        (card) => card.isPublished || card.ownerId === currentUserId,
      );
      
      // Sort cards by priority
      const sortedCards = sortCardsByPriority(visibleCards, currentUserId, getCardProgress);
      setCards(sortedCards);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this card?")) return;

    try {
      const userId = userIdUtils.getUserId();
      await api.deleteCard(id, userId);
      await loadCards();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleUnpublish = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to unpublish this card? It will become editable again.",
      )
    )
      return;

    try {
      const userId = userIdUtils.getUserId();
      await api.unpublishCard(id, userId);
      await loadCards();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (loading) return <div className="loading">Loading cards...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const publishedCards = cards.filter((card) => card.isPublished);
  const unpublishedCards = cards.filter((card) => !card.isPublished);

  const renderCard = (card: Card) => {
    const progress = getCardProgress(card._id, card.tiles.length);

    return (
      <BingoCardItem
        key={card._id}
        card={card}
        currentPlayerName={currentPlayerName}
        progress={progress}
        onDelete={handleDelete}
        onUnpublish={handleUnpublish}
        showPreview={true}
      />
    );
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1>Bingo Cards</h1>
      </div>

      {cards.length === 0 ? (
        <div className="card">
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p style={{ color: "#7f8c8d", marginBottom: "1.5rem" }}>
              No cards yet. Create your first bingo card!
            </p>
            <button
              className="success"
              onClick={() => navigate("/create")}
              style={{ fontSize: "1rem", padding: "0.75rem 1.5rem" }}
            >
              Create Your First Card
            </button>
          </div>
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
