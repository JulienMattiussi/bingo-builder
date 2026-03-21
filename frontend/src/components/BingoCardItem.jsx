import BingoCardPreview from "./BingoCardPreview";
import CardStatusInfo from "./CardStatusInfo";
import CardActions from "./CardActions";

function BingoCardItem({
  card,
  currentPlayerName,
  progress,
  onDelete,
  onUnpublish,
  showPreview = true,
  layout = "default", // 'default' or 'horizontal'
}) {
  const isOwner = card.createdBy === currentPlayerName;

  const cardTitle = (
    <h3 className={layout === "horizontal" ? "card-title-spacing" : ""}>
      {isOwner && <span className="player-icon owner-icon mr-xs">⭐</span>}
      {card.title}
      {progress.completed && (
        <span className="player-icon winner-icon ml-xs">👑</span>
      )}
    </h3>
  );

  if (layout === "horizontal") {
    return (
      <div className="card-item horizontal-card">
        <div className="flex-1">
          {cardTitle}
          <p className="grid-info-text">
            {card.rows}×{card.columns} grid
          </p>
          <p className="text-base mb-xs">
            {card.isPublished ? (
              <span className="status-badge status-badge-published">
                Published
              </span>
            ) : (
              <span className="status-badge status-badge-draft">Draft</span>
            )}
          </p>
        </div>
        <div className="button-column">
          <CardActions
            card={card}
            isOwner={isOwner}
            isPlayed={progress.played}
            onDelete={onDelete}
            onUnpublish={onUnpublish}
            compact={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="card-item">
      {cardTitle}

      {showPreview && (
        <BingoCardPreview
          tiles={card.tiles}
          rows={card.rows}
          columns={card.columns}
          checkedTiles={progress.checkedTiles}
        />
      )}

      <div style={{ marginTop: "12px", marginBottom: "10px" }}>
        <CardStatusInfo card={card} isOwner={isOwner} />
      </div>

      <div className="button-group" style={{ justifyContent: "flex-start" }}>
        <CardActions
          card={card}
          isOwner={isOwner}
          isPlayed={progress.played}
          onDelete={onDelete}
          onUnpublish={onUnpublish}
        />
      </div>
    </div>
  );
}

export default BingoCardItem;
