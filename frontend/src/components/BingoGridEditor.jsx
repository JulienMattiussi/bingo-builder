/**
 * BingoGridEditor Component
 * Editable grid of bingo tiles
 */

function BingoGridEditor({ tiles, rows, columns, onTileChange }) {
  return (
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
            onChange={(e) => onTileChange(index, e.target.value)}
            placeholder={`Tile ${index + 1}`}
            maxLength={40}
            rows={3}
          />
        </div>
      ))}
    </div>
  );
}

export default BingoGridEditor;
