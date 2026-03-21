import { Link } from "react-router-dom";

function PlayedCardItem({ card, checkedCount, totalTiles }) {
  const isCompleted = checkedCount === totalTiles;
  const progressPercent = Math.round((checkedCount / totalTiles) * 100);

  return (
    <div
      className="card-item"
      style={{ display: "flex", alignItems: "center", gap: "1rem" }}
    >
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: 0, marginBottom: "0.5rem" }}>
          {card.title}
          {isCompleted && <span style={{ marginLeft: "0.5rem" }}>👑</span>}
        </h3>
        <p
          style={{
            fontSize: "0.85rem",
            color: "#7f8c8d",
            margin: "0.25rem 0",
          }}
        >
          Progress: {checkedCount}/{totalTiles} ({progressPercent}%)
        </p>
        {card.createdBy && (
          <p
            style={{
              fontSize: "0.8rem",
              color: "#95a5a6",
              margin: "0.25rem 0",
            }}
          >
            By {card.createdBy}
          </p>
        )}
      </div>
      <div style={{ minWidth: "100px" }}>
        <Link to={`/play/${card._id}`}>
          <button
            style={{
              width: "100%",
              fontSize: "0.85rem",
              padding: "0.4rem 0.6rem",
            }}
          >
            {isCompleted ? "View" : "Continue"}
          </button>
        </Link>
      </div>
    </div>
  );
}

export default PlayedCardItem;
