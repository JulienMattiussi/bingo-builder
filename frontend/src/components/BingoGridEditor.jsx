/**
 * BingoGridEditor Component
 * Editable grid of bingo tiles
 */

function BingoGridEditor({ tiles, rows, columns, onTileChange, onTileClick }) {
  const isMobile = () => window.innerWidth < 768;

  const handleTileClick = (tile, index) => {
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
            maxLength={40}
            rows={3}
            readOnly={onTileClick && isMobile()}
          />
        </div>
      ))}
    </div>
  );
}

export default BingoGridEditor;
