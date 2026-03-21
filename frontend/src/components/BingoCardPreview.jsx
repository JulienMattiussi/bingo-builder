function BingoCardPreview({ tiles, rows, columns, checkedTiles = [] }) {
  return (
    <div
      className="card-preview"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {tiles.map((tile, index) => {
        const isChecked = checkedTiles.includes(tile.position);
        return (
          <div
            key={index}
            className={`preview-tile ${!tile.value || !tile.value.trim() ? "empty" : ""} ${isChecked ? "checked" : ""}`}
            title={tile.value || "Empty"}
          >
            {tile.value && tile.value.trim() ? (
              <span>
                {tile.value.length > 12
                  ? tile.value.substring(0, 12) + "..."
                  : tile.value}
              </span>
            ) : (
              <span className="empty-marker">●</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default BingoCardPreview;
