import { useEffect, useState } from "react";
import { api } from "../utils/api";
import { playerNameUtils } from "../utils/playerName";
import { useCardProgress } from "../hooks/useCardProgress";
import BingoCardItem from "../components/BingoCardItem";

function Home() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentPlayerName = playerNameUtils.getPlayerName();
  const { getCardProgress } = useCardProgress();

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
      setError(err.message);
    } finally {
      setLoading(false);
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
