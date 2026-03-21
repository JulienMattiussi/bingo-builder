/**
 * BingoGridControls Component
 * Controls for editing grid dimensions, title, and showing progress
 */

function BingoGridControls({
  title,
  onTitleChange,
  rows,
  columns,
  onGridSizeChange,
  tiles,
  statusBadgeType = "draft", // "draft" or "incomplete"
}) {
  const filledTiles = tiles.filter((t) => t.value.trim()).length;
  const emptyTiles = tiles.filter((t) => !t.value.trim()).length;
  const completionPercentage = (filledTiles / tiles.length) * 100;

  return (
    <div className="grid-controls">
      <div className="dimension-control title-control">
        <label>Card Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter card title..."
          maxLength={100}
          className="title-input"
        />
      </div>

      <div className="dimension-controls-row">
        <div className="dimension-control">
          <label>Columns: {columns}</label>
          <div className="button-group-inline">
            <button
              type="button"
              className="btn-dimension"
              onClick={() => onGridSizeChange(rows, Math.max(2, columns - 1))}
              disabled={columns <= 2}
            >
              −
            </button>
            <button
              type="button"
              className="btn-dimension"
              onClick={() => onGridSizeChange(rows, Math.min(6, columns + 1))}
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
              onClick={() => onGridSizeChange(Math.max(2, rows - 1), columns)}
              disabled={rows <= 2}
            >
              −
            </button>
            <button
              type="button"
              className="btn-dimension"
              onClick={() => onGridSizeChange(Math.min(5, rows + 1), columns)}
              disabled={rows >= 5}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="dimension-controls-row">
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
              {emptyTiles > 0 ? (
                <span className={`status-badge ${statusBadgeType}`}>
                  {statusBadgeType === "draft" ? "Draft" : "Incomplete"}
                </span>
              ) : (
                <span className="status-badge complete">Complete</span>
              )}
            </div>
            <div className="progress-bar-wrapper">
              <div
                className="progress-bar"
                style={{
                  width: `${completionPercentage}%`,
                }}
              />
              <span className="progress-count">
                {filledTiles} / {tiles.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BingoGridControls;
