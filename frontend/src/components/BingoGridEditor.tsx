/**
 * BingoGridEditor Component
 * Editable grid of bingo tiles
 */
import { Tile } from "../types/models";
import config from "../config";

interface BingoGridEditorProps {
  tiles: Tile[];
  rows: number;
  columns: number;
  onTileChange: (position: number, value: string) => void;
  onTileClick?: (tile: Tile) => void;
}

function BingoGridEditor({
  tiles,
  rows,
  columns,
  onTileChange,
  onTileClick,
}: BingoGridEditorProps) {
  const isMobile = () => window.innerWidth < 768;

  const handleTileClick = (tile: Tile, index: number) => {
    // On mobile, open full-size editor modal
    if (onTileClick && isMobile()) {
      onTileClick({ ...tile, position: index });
    }
  };

  return (
    <div
      className="bingo-grid"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {tiles.map((tile, index) => (
        <div
          key={index}
          className="bingo-tile"
          onClick={() => handleTileClick(tile, index)}
        >
          <textarea
            value={tile.value}
            onChange={(e) => onTileChange(index, e.target.value)}
            placeholder={`Tile ${index + 1}`}
            maxLength={config.tileMaxLength}
            rows={3}
            readOnly={onTileClick && isMobile()}
          />
        </div>
      ))}
    </div>
  );
}

export default BingoGridEditor;
