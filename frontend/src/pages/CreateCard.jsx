import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { playerNameUtils } from "../utils/playerName";
import MobileActionBar from "../components/MobileActionBar";
import CardNameModal from "../components/CardNameModal";
import BingoGridControls from "../components/BingoGridControls";
import BingoGridEditor from "../components/BingoGridEditor";
import TileEditorModal from "../components/TileEditorModal";

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
  const [selectedTile, setSelectedTile] = useState(null);

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
      await api.createCard({
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
      <CardNameModal
        show={showNameModal}
        playerName={playerName}
        onPlayerNameChange={setPlayerName}
        onSubmit={handleNameSubmit}
        onCancel={() => setShowNameModal(false)}
        message="Please enter your name to create your first bingo card:"
      />

      <h1 style={{ marginBottom: "1rem" }}>Create New Bingo Card</h1>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <BingoGridControls
          title={title}
          onTitleChange={setTitle}
          rows={rows}
          columns={columns}
          onGridSizeChange={handleGridSizeChange}
          tiles={tiles}
          statusBadgeType="draft"
        />

        <BingoGridEditor
          tiles={tiles}
          rows={rows}
          columns={columns}
          onTileChange={handleTileChange}
          onTileClick={setSelectedTile}
        />

        <div className="button-group">
          <button onClick={() => navigate("/")}>Cancel</button>
          <button className="success" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Card"}
          </button>
        </div>
      </div>

      {/* Mobile bottom action bar */}
      <MobileActionBar
        buttons={[
          {
            icon: "✕",
            label: "Cancel",
            onClick: () => navigate("/"),
            ariaLabel: "Cancel and return to home",
          },
          {
            icon: "💾",
            label: saving ? "Saving..." : "Save",
            onClick: handleSave,
            disabled: saving,
            variant: "success",
            ariaLabel: "Save card",
          },
        ]}
      />

      {/* Mobile tile editor modal */}
      <TileEditorModal
        tile={selectedTile}
        onSave={handleTileChange}
        onClose={() => setSelectedTile(null)}
      />
    </div>
  );
}

export default CreateCard;
