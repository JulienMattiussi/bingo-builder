import { Link } from "react-router-dom";

function CardActions({
  card,
  isOwner,
  isPlayed,
  onDelete,
  onUnpublish,
  compact = false,
}) {
  const buttonClassName = compact ? "button-compact" : "";

  if (card.isPublished) {
    return (
      <>
        <Link to={`/play/${card._id}`}>
          <button className={buttonClassName}>
            {isPlayed ? "Continue" : "Play"}
          </button>
        </Link>
        {isOwner && onUnpublish && (
          <button
            className={`warning ${buttonClassName}`}
            onClick={() => onUnpublish(card._id)}
          >
            Unpublish
          </button>
        )}
      </>
    );
  }

  if (!isOwner) {
    return (
      <p
        className="text-base text-muted"
        style={{ fontStyle: "italic", margin: 0 }}
      >
        Only the owner can edit this card
      </p>
    );
  }

  return (
    <>
      <Link to={`/edit/${card._id}`}>
        <button className={buttonClassName}>Edit</button>
      </Link>
      {onDelete && (
        <button
          className={`danger ${buttonClassName}`}
          onClick={() => onDelete(card._id)}
        >
          Delete
        </button>
      )}
    </>
  );
}

export default CardActions;
