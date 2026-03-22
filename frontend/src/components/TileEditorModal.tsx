/**
 * TileEditorModal Component
 * Full-screen tile editor for mobile devices
 */
import { useState, useEffect, FormEvent } from "react";
import { Tile } from "../types/models";
import config from "../config";

interface TileEditorModalProps {
  tile: Tile | null;
  onSave: (position: number, value: string) => void;
  onClose: () => void;
}

function TileEditorModal({ tile, onSave, onClose }: TileEditorModalProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (tile) {
      setValue(tile.value);
    }
  }, [tile]);

  if (!tile) return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(tile.position, value);
    onClose();
  };

  const handleCancel = () => {
    setValue(tile.value); // Reset to original value
    onClose();
  };

  return (
    <div className="tile-viewer-overlay" onClick={handleCancel}>
      <div className="tile-viewer-content" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="tile-editor-container">
            <label htmlFor="tile-editor-input">
              Edit Tile {tile.position + 1}
            </label>
            <textarea
              id="tile-editor-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Tile ${tile.position + 1}`}
              maxLength={config.tileMaxLength}
              rows={6}
              autoFocus
              className="tile-editor-textarea"
            />
            <div className="tile-char-count">{value.length} / 40</div>
          </div>
          <div className="tile-viewer-actions">
            <button
              type="submit"
              className="tile-viewer-btn check-btn"
              aria-label="Save and close"
            >
              <span className="btn-icon">✓</span>
              <span className="btn-text">Done</span>
            </button>
            <button
              type="button"
              className="tile-viewer-btn close-btn"
              onClick={handleCancel}
              aria-label="Cancel"
            >
              <span className="btn-icon">×</span>
              <span className="btn-text">Cancel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TileEditorModal;
