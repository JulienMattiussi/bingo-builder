import { useEffect, useState } from "react";
import { api } from "../utils/api";
import { playerNameUtils } from "../utils/playerName";
import { userIdUtils } from "../utils/userId";
import { useCardProgress } from "../hooks/useCardProgress";
import { useCardStats } from "../hooks/useCardStats";
import BingoCardItem from "../components/BingoCardItem";
import { Card } from "../types/models";

function Home() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentPlayerName = playerNameUtils.getPlayerName();
  const { getCardProgress } = useCardProgress();
  const { stats, reload: reloadStats } = useCardStats();

  useEffect(() => {
    loadCards();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      const data = await api.getCards();
      // Sort cards by priority
      const sortedCards = sortCardsByPriority(data);
      setCards(sortedCards);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const sortCardsByPriority = (cardsData: Card[]) => {
    const currentPlayer = currentPlayerName;
    const currentUserId = userIdUtils.getUserId();

    return cardsData.sort((a, b) => {
      const aOwner = a.ownerId === currentUserId;
      const bOwner = b.ownerId === currentUserId;
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

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this card?")) return;

    try {
      const userId = userIdUtils.getUserId();
      await api.deleteCard(id, userId);
      await loadCards();
      reloadStats(); // Refresh stats after delete
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
      reloadStats(); // Refresh stats after unpublish
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
        {stats && (
          <div
            style={{
              display: "flex",
              gap: "1rem",
              marginTop: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                backgroundColor:
                  stats.published >= stats.maxPublished
                    ? "#fee"
                    : stats.published / stats.maxPublished >= 0.8
                      ? "#ffeaa7"
                      : "#d5f4e6",
                color: "#2c3e50",
                fontSize: "0.9rem",
              }}
            >
              <strong>Published:</strong> {stats.published}/{stats.maxPublished}
            </div>
            <div
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                backgroundColor:
                  stats.unpublished >= stats.maxUnpublished
                    ? "#fee"
                    : stats.unpublished / stats.maxUnpublished >= 0.8
                      ? "#ffeaa7"
                      : "#d5f4e6",
                color: "#2c3e50",
                fontSize: "0.9rem",
              }}
            >
              <strong>Unpublished:</strong> {stats.unpublished}/
              {stats.maxUnpublished}
            </div>
          </div>
        )}
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
