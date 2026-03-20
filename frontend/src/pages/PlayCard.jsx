import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../utils/api";
import { playerNameUtils } from "../utils/playerName";

function PlayCard() {
  const { id } = useParams();
  const [card, setCard] = useState(null);
  const [checkedTiles, setCheckedTiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [playerName, setPlayerName] = useState("");

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
  }, [id]);

  const loadCard = async () => {
    try {
      setLoading(true);
      const data = await api.getCard(id);

      if (!data.isPublished) {
        setError("This card is not yet published.");
        return;
      }

      setCard(data);
    } catch (err) {
      setError(err.message);
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

  const checkForBingo = (checked, rows, columns) => {
    const totalTiles = rows * columns;
    // Check if all tiles are checked (full card completion)
    return checked.length === totalTiles;
  };

  const toggleTile = (position) => {
    const newChecked = checkedTiles.includes(position)
      ? checkedTiles.filter((p) => p !== position)
      : [...checkedTiles, position];

    setCheckedTiles(newChecked);
    localStorage.setItem(`bingo-card-${id}`, JSON.stringify(newChecked));

    // Check for bingo
    if (!checkedTiles.includes(position) && card) {
      if (checkForBingo(newChecked, card.rows, card.columns)) {
        setShowCelebration(true);
      }
    }
  };

  const resetCard = () => {
    if (!window.confirm("Are you sure you want to reset all checked tiles?"))
      return;
    setCheckedTiles([]);
    localStorage.removeItem(`bingo-card-${id}`);
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
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1>{card.title}</h1>
        <p style={{ color: "#7f8c8d", marginTop: "0.5rem" }}>
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
              onClick={() => toggleTile(tile.position)}
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
  );
}

export default PlayCard;
