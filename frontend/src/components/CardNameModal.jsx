/**
 * CardNameModal Component
 * Modal for collecting player name before creating/editing a card
 */

function CardNameModal({
  show,
  playerName,
  onPlayerNameChange,
  onSubmit,
  onCancel,
  message = "Please enter your name:",
}) {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Welcome!</h2>
        <p>{message}</p>
        <p
          style={{
            fontSize: "0.85rem",
            color: "#95a5a6",
            marginTop: "-0.5rem",
          }}
        >
          (1-10 characters: letters, digits, -, _ only)
        </p>
        <input
          type="text"
          value={playerName}
          onChange={(e) => onPlayerNameChange(e.target.value)}
          placeholder="Your name..."
          maxLength={10}
          className="modal-input"
          autoFocus
          onKeyPress={(e) => e.key === "Enter" && onSubmit()}
        />
        <div className="modal-buttons">
          <button onClick={onCancel}>Cancel</button>
          <button className="success" onClick={onSubmit}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default CardNameModal;
