import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../utils/api";
import { playerNameUtils } from "../utils/playerName";
import { userIdUtils } from "../utils/userId";
import { useCardStats } from "../hooks/useCardStats";
import MobileActionBar from "../components/MobileActionBar";
import CardNameModal from "../components/CardNameModal";
import BingoGridControls from "../components/BingoGridControls";
import BingoGridEditor from "../components/BingoGridEditor";
import TileEditorModal from "../components/TileEditorModal";
import { Tile } from "../types/models";

function CreateCard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { stats, reload: reloadStats } = useCardStats();
  const [title, setTitle] = useState("");
  const [rows, setRows] = useState(4);
  const [columns, setColumns] = useState(6);
  const [tiles, setTiles] = useState<Tile[]>(
    Array(24)
      .fill("")
      .map((_, i) => ({ value: "", position: i })),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [publishMode, setPublishMode] = useState(false);

  useEffect(() => {
    // Load existing player nickname
    const existingName = playerNameUtils.getPlayerName();
    if (existingName) {
      setPlayerName(existingName);
    }
  }, []);

  // Reset form when navigating to this page while already on it
  useEffect(() => {
    if (location.state?.reload) {
      setTitle("");
      setRows(4);
      setColumns(6);
      setTiles(
        Array(24)
          .fill("")
          .map((_, i) => ({ value: "", position: i })),
      );
      setError(null);
      setSelectedTile(null);
    }
  }, [location.state]);

  const handleGridSizeChange = (newRows: number, newColumns: number) => {
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

  const handleTileChange = (position: number, value: string) => {
    setTiles(
      tiles.map((tile, i) => (i === position ? { ...tile, value } : tile)),
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    // Check if we need to ask for player nickname
    if (!playerNameUtils.hasPlayerName()) {
      setPublishMode(false);
      setShowNameModal(true);
      return;
    }

    await saveCard();
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    // Check card limits
    if (stats && !stats.canPublish) {
      setError(
        `Maximum published cards limit reached (${stats.published}/${stats.maxPublished}). Please unpublish existing cards first.`,
      );
      return;
    }

    // Check if all tiles are filled
    const emptyTiles = tiles.filter((t) => !t.value.trim());
    if (emptyTiles.length > 0) {
      setError(
        `Cannot publish incomplete card. ${emptyTiles.length} tiles are still empty.`,
      );
      return;
    }

    // Check if we need to ask for player nickname
    if (!playerNameUtils.hasPlayerName()) {
      setPublishMode(true);
      setShowNameModal(true);
      return;
    }

    await saveAndPublishCard();
  };

  const saveCard = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Get or create user ID for ownership
      const userId = userIdUtils.getUserId();
      
      await api.createCard({
        title: title.trim(),
        createdBy: playerName.trim(),
        ownerId: userId,
        rows,
        columns,
        tiles,
      });
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const saveAndPublishCard = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Get or create user ID for ownership
      const userId = userIdUtils.getUserId();
      
      // Create the card
      const newCard = await api.createCard({
        title: title.trim(),
        createdBy: playerName.trim(),
        ownerId: userId,
        rows,
        columns,
        tiles,
      });
      
      // Immediately publish it
      await api.publishCard(newCard._id, userId);
      reloadStats(); // Refresh stats after publish
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
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
    
    // Call the appropriate save function based on mode
    if (publishMode) {
      saveAndPublishCard();
    } else {
      saveCard();
    }
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
          <button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save as Draft"}
          </button>
          <button
            className="success"
            onClick={handlePublish}
            disabled={
              saving ||
              tiles.filter((t) => !t.value.trim()).length > 0 ||
              (stats ? !stats.canPublish : false)
            }
            title={
              stats && !stats.canPublish
                ? `Limit reached: ${stats.published}/${stats.maxPublished} published cards`
                : tiles.filter((t) => !t.value.trim()).length > 0
                  ? "Fill all tiles to publish"
                  : ""
            }
          >
            {saving ? "Publishing..." : "Save & Publish"}
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
            label: saving ? "Saving..." : "Draft",
            onClick: handleSave,
            disabled: saving,
            ariaLabel: "Save as draft",
          },
          {
            icon: "✅",
            label: saving ? "Publishing..." : "Publish",
            onClick: handlePublish,
            disabled:
              saving ||
              tiles.filter((t) => !t.value.trim()).length > 0 ||
              (stats ? !stats.canPublish : false),
            variant: "success",
            ariaLabel: "Save and publish card",
            title:
              stats && !stats.canPublish
                ? `Limit reached: ${stats.published}/${stats.maxPublished} published cards`
                : tiles.filter((t) => !t.value.trim()).length > 0
                  ? "Fill all tiles to publish"
                  : "",
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
