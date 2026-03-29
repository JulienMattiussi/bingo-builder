import { Card } from "../types/models";

interface CardStatusInfoProps {
  card: Card;
  isOwner: boolean;
}

function CardStatusInfo({ card, isOwner }: CardStatusInfoProps) {
  if (card.isPublished) {
    return (
      <div>
        <p className="status-text">
          ✓ Published
          {card.createdAt &&
            ` on ${new Date(card.createdAt).toLocaleDateString()}`}
        </p>
        {card.createdBy && (
          <p className="status-text">
            Created by {card.createdBy}
            {isOwner && " (you)"}
          </p>
        )}
      </div>
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
