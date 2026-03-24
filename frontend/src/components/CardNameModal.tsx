/**
 * CardNameModal Component
 * Modal for collecting player nickname before creating/editing a card
 */
import { KeyboardEvent } from "react";
import config from "../config";

interface CardNameModalProps {
  show: boolean;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  message?: string;
}

function CardNameModal({
  show,
  playerName,
  onPlayerNameChange,
  onSubmit,
  onCancel,
  message = "Please enter your nickname:",
}: CardNameModalProps) {
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
          placeholder="Your nickname..."
          maxLength={config.playerNameMaxLength}
          className="modal-input"
          autoFocus
          onKeyPress={(e: KeyboardEvent<HTMLInputElement>) =>
            e.key === "Enter" && onSubmit()
          }
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
