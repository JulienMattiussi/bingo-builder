import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { playerNameUtils } from "../utils/playerName";

function EditCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [title, setTitle] = useState("");
  const [rows, setRows] = useState(4);
  const [columns, setColumns] = useState(6);
  const [tiles, setTiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [hasAskedName, setHasAskedName] = useState(false);

  useEffect(() => {
    loadCard();
    // Load existing player name
    const existingName = playerNameUtils.getPlayerName();
    if (existingName) {
      setPlayerName(existingName);
      setHasAskedName(true);
    }
  }, [id]);

  const loadCard = async () => {
    try {
      setLoading(true);
      const data = await api.getCard(id);

      if (data.isPublished) {
        setError("This card is already published and cannot be edited.");
        return;
      }

      setCard(data);
      setTitle(data.title);
      setRows(data.rows);
      setColumns(data.columns);
      setTiles(data.tiles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
    if (!hasAskedName && !playerNameUtils.hasPlayerName()) {
      setShowNameModal(true);
      return;
    }

    await saveCard();
  };

  const saveCard = async () => {
    try {
      setSaving(true);
      setError(null);
      await api.updateCard(id, {
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
    setHasAskedName(true);
    setShowNameModal(false);
    saveCard();
  };

  const handlePublish = async () => {
    // Check if all tiles are filled
    const emptyTiles = tiles.filter((t) => !t.value.trim());
    if (emptyTiles.length > 0) {
      setError(
        `Cannot publish incomplete card. ${emptyTiles.length} tiles are still empty.`,
      );
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to publish this card? Once published, it cannot be edited.",
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await api.publishCard(id);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading card...</div>;
  if (error && !card) return <div className="error">Error: {error}</div>;

  return (
    <div>
      {showNameModal && (
        <div className="modal-overlay" onClick={() => setShowNameModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Welcome!</h2>
            <p>Please enter your name to edit this card:</p>
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

      <h1 style={{ marginBottom: "1rem" }}>Edit Bingo Card</h1>

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

          <div className="dimension-control completion-control">
            <div className="progress-container">
              <div className="progress-text">
                {tiles.filter((t) => !t.value.trim()).length > 0 ? (
                  <span className="status-badge incomplete">Incomplete</span>
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
          <button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            className="success"
            onClick={handlePublish}
            disabled={saving || tiles.filter((t) => !t.value.trim()).length > 0}
            title={
              tiles.filter((t) => !t.value.trim()).length > 0
                ? "Fill all tiles to publish"
                : ""
            }
          >
            {saving ? "Publishing..." : "Publish Card"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditCard;
