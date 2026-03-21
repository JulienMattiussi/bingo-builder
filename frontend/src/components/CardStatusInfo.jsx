function CardStatusInfo({ card, isOwner }) {
  if (card.isPublished) {
    return (
      <p className="status-text">
        ✓ Published on {new Date(card.publishedAt).toLocaleDateString()}
        {card.createdBy && (
          <span>
            {" • Created by "}
            {card.createdBy}
            {isOwner && " (you)"}
          </span>
        )}
      </p>
    );
  }

  const emptyTilesCount = card.tiles.filter(
    (t) => !t.value || !t.value.trim(),
  ).length;
  const filledTilesCount = card.tiles.filter(
    (t) => t.value && t.value.trim(),
  ).length;

  return (
    <div>
      <div className="flex items-center" style={{ gap: "8px" }}>
        {emptyTilesCount > 0 ? (
          <span className="status-badge incomplete">Incomplete</span>
        ) : (
          <span className="status-badge complete">Complete</span>
        )}
        <span className="status-text">
          {filledTilesCount}/{card.tiles.length} filled
        </span>
      </div>
      {card.createdBy && (
        <p className="status-text mt-xs">
          Created by {card.createdBy}
          {isOwner && " (you)"}
        </p>
      )}
    </div>
  );
}

export default CardStatusInfo;
