import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { playerNameUtils } from "../utils/playerName";
import MobileActionBar from "../components/MobileActionBar";
import CardNameModal from "../components/CardNameModal";
import BingoGridControls from "../components/BingoGridControls";
import BingoGridEditor from "../components/BingoGridEditor";
import TileEditorModal from "../components/TileEditorModal";
import { Card, Tile } from "../types/models";

function EditCard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<Card | null>(null);
  const [title, setTitle] = useState("");
  const [rows, setRows] = useState(4);
  const [columns, setColumns] = useState(6);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [hasAskedName, setHasAskedName] = useState(false);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);

  useEffect(() => {
    loadCard();
    // Load existing player name
    const existingName = playerNameUtils.getPlayerName();
    if (existingName) {
      setPlayerName(existingName);
      setHasAskedName(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, setHasAskedName, setPlayerName]);

  const loadCard = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.getCard(id);

      if (data.isPublished) {
        setError("This card is already published and cannot be edited.");
        return;
      }

      // Check if current player is the owner
      const currentPlayerName = playerNameUtils.getPlayerName();
      if (data.createdBy && data.createdBy !== currentPlayerName) {
        setError(
          "You are not the owner of this card. Only the owner can edit it.",
        );
        setTimeout(() => navigate("/"), 3000);
        return;
      }

      setCard(data);
      setTitle(data.title);
      setRows(data.rows);
      setColumns(data.columns);
      setTiles(data.tiles);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

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

    // Check if we need to ask for player name
    if (!hasAskedName && !playerNameUtils.hasPlayerName()) {
      setShowNameModal(true);
      return;
    }

    await saveCard();
  };

  const saveCard = async () => {
    if (!id) return;
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
      const currentPlayerName = playerNameUtils.getPlayerName();
      await api.publishCard(id!, currentPlayerName);
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading card...</div>;
  if (error && !card) return <div className="error">Error: {error}</div>;

  return (
    <div>
      <CardNameModal
        show={showNameModal}
        playerName={playerName}
        onPlayerNameChange={setPlayerName}
        onSubmit={handleNameSubmit}
        onCancel={() => setShowNameModal(false)}
        message="Please enter your name to edit this card:"
      />

      <h1 style={{ marginBottom: "1rem" }}>Edit Bingo Card</h1>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <BingoGridControls
          title={title}
          onTitleChange={setTitle}
          rows={rows}
          columns={columns}
          onGridSizeChange={handleGridSizeChange}
          tiles={tiles}
          statusBadgeType="incomplete"
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
            ariaLabel: "Save changes",
          },
          {
            icon: "✅",
            label: saving ? "Publishing..." : "Publish",
            onClick: handlePublish,
            disabled: saving || tiles.filter((t) => !t.value.trim()).length > 0,
            variant: "success",
            ariaLabel: "Publish card",
            title:
              tiles.filter((t) => !t.value.trim()).length > 0
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

export default EditCard;
