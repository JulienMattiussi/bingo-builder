import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { playerNameUtils } from "../utils/playerName";

function CreateCard() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [rows, setRows] = useState(4);
  const [columns, setColumns] = useState(6);
  const [tiles, setTiles] = useState(
    Array(24)
      .fill("")
      .map((_, i) => ({ value: "", position: i })),
  );
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    // Load existing player name
    const existingName = playerNameUtils.getPlayerName();
    if (existingName) {
      setPlayerName(existingName);
    }
  }, []);

  const handleGridSizeChange = (newRows, newColumns) => {
    const totalTiles = newRows * newColumns;
    const newTiles = Array(totalTiles)
      .fill("")
      .map((_, i) => ({
        value: tiles[i]?.value || "",
        position: i,
      }));
    setRows(newRows);
    setColumns(newColumns);
    setTiles(newTiles);
  };

  const handleTileChange = (position, value) => {
    setTiles(
      tiles.map((tile, i) => (i === position ? { ...tile, value } : tile)),
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    // Check if we need to ask for player name
    if (!playerNameUtils.hasPlayerName()) {
      setShowNameModal(true);
      return;
    }

    await saveCard();
  };

  const saveCard = async () => {
    try {
      setSaving(true);
      setError(null);
      const card = await api.createCard({
        title: title.trim(),
        createdBy: playerName.trim(),
        rows,
        columns,
        tiles,
      });
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleNameSubmit = () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!playerNameUtils.isValidName(playerName)) {
      setError("Name must be 1-10 characters (letters, digits, -, _ only)");
      return;
    }
    playerNameUtils.savePlayerName(playerName);
    setShowNameModal(false);
    saveCard();
  };

  return (
    <div>
      {showNameModal && (
        <div className="modal-overlay" onClick={() => setShowNameModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Welcome!</h2>
            <p>Please enter your name to create your first bingo card:</p>
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
              <button onClick={() => setShowNameModal(false)}>Cancel</button>
              <button className="success" onClick={handleNameSubmit}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 style={{ marginBottom: "1rem" }}>Create New Bingo Card</h1>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <div className="grid-controls">
          <div className="dimension-control title-control">
            <label>Card Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter card title..."
              maxLength={100}
              className="title-input"
            />
          </div>

          <div className="dimension-control">
            <label>Columns: {columns}</label>
            <div className="button-group-inline">
              <button
                type="button"
                className="btn-dimension"
                onClick={() =>
                  handleGridSizeChange(rows, Math.max(2, columns - 1))
                }
                disabled={columns <= 2}
              >
                −
              </button>
              <button
                type="button"
                className="btn-dimension"
                onClick={() =>
                  handleGridSizeChange(rows, Math.min(6, columns + 1))
                }
                disabled={columns >= 6}
              >
                +
              </button>
            </div>
          </div>

          <div className="dimension-control">
            <label>Rows: {rows}</label>
            <div className="button-group-inline">
              <button
                type="button"
                className="btn-dimension"
                onClick={() =>
                  handleGridSizeChange(Math.max(2, rows - 1), columns)
                }
                disabled={rows <= 2}
              >
                −
              </button>
              <button
                type="button"
                className="btn-dimension"
                onClick={() =>
                  handleGridSizeChange(Math.min(5, rows + 1), columns)
                }
                disabled={rows >= 5}
              >
                +
              </button>
            </div>
          </div>

          <div className="dimension-control grid-size-display">
            <label>Grid Size</label>
            <div className="grid-size-info">
              {columns} × {rows}
              <span className="tile-count">({rows * columns} tiles)</span>
            </div>
          </div>

          <div className="dimension-control completion-control">
            <label>Progress</label>
            <div className="progress-container">
              <div className="progress-text">
                {tiles.filter((t) => !t.value.trim()).length > 0 ? (
                  <span className="status-badge draft">Draft</span>
                ) : (
                  <span className="status-badge complete">Complete</span>
                )}
              </div>
              <div className="progress-bar-wrapper">
                <div
                  className="progress-bar"
                  style={{
                    width: `${(tiles.filter((t) => t.value.trim()).length / tiles.length) * 100}%`,
                  }}
                />
                <span className="progress-count">
                  {tiles.filter((t) => t.value.trim()).length} / {tiles.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="bingo-grid"
          style={{
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
          }}
        >
          {tiles.map((tile, index) => (
            <div key={index} className="bingo-tile">
              <textarea
                value={tile.value}
                onChange={(e) => handleTileChange(index, e.target.value)}
                placeholder={`Tile ${index + 1}`}
                maxLength={40}
                rows={3}
              />
            </div>
          ))}
        </div>

        <div className="button-group">
          <button onClick={() => navigate("/")}>Cancel</button>
          <button className="success" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Card"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateCard;
