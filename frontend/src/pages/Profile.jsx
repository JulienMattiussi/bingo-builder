import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { playerNameUtils } from "../utils/playerName";
import { api } from "../utils/api";

function Profile() {
  const navigate = useNavigate();
  const [currentName, setCurrentName] = useState("");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const name = playerNameUtils.getPlayerName();
    if (!name) {
      // No profile exists, redirect to home
      navigate("/");
      return;
    }
    setCurrentName(name);
    setNewName(name);
  }, [navigate]);

  const handleUpdateName = async () => {
    setError(null);
    setSuccess(null);

    if (!newName.trim()) {
      setError("Please enter a name");
      return;
    }

    if (!playerNameUtils.isValidName(newName)) {
      setError("Name must be 1-10 characters (letters, digits, -, _ only)");
      return;
    }

    if (newName === currentName) {
      setIsEditing(false);
      return;
    }

    try {
      // Update creator name on all existing cards
      const result = await api.updateCreatorName(currentName, newName);

      // Update localStorage
      playerNameUtils.savePlayerName(newName);
      setCurrentName(newName);
      setIsEditing(false);

      if (result.modifiedCount > 0) {
        setSuccess(
          `Nickname updated successfully! ${result.modifiedCount} card(s) updated.`,
        );
      } else {
        setSuccess("Nickname updated successfully!");
      }
    } catch (err) {
      setError(err.message || "Failed to update nickname");
    }
  };

  const handleDeleteProfile = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete your profile "${currentName}"?\n\nThis will permanently delete ALL bingo cards you created.\n\nThis action cannot be undone!`,
      )
    ) {
      return;
    }

    // Double confirmation for safety
    if (
      !window.confirm(
        "Final confirmation: Delete your profile and ALL your cards?",
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);

      // Delete all cards created by this user
      await api.deleteCardsByCreator(currentName);

      // Clear profile from localStorage
      playerNameUtils.clearPlayerName();

      // Redirect to home
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to delete profile");
      setDeleting(false);
    }
  };

  const handleCancelEdit = () => {
    setNewName(currentName);
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  if (!currentName) {
    return null;
  }

  return (
    <div>
      <h1 style={{ marginBottom: "1rem" }}>Profile</h1>

      {error && <div className="error">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="card">
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
            Your Nickname
          </h2>

          {!isEditing ? (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <span
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    color: "#2c3e50",
                  }}
                >
                  {currentName}
                </span>
                <button onClick={() => setIsEditing(true)}>
                  Change Nickname
                </button>
              </div>
              <p style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>
                This name appears on all bingo cards you create.
              </p>
            </div>
          ) : (
            <div>
              <p
                style={{
                  marginBottom: "0.5rem",
                  color: "#7f8c8d",
                  fontSize: "0.9rem",
                }}
              >
                (1-10 characters: letters, digits, -, _ only)
              </p>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new name..."
                maxLength={10}
                className="title-input"
                autoFocus
                onKeyPress={(e) => e.key === "Enter" && handleUpdateName()}
                style={{ marginBottom: "1rem" }}
              />
              <div className="button-group" style={{ marginTop: "1rem" }}>
                <button onClick={handleCancelEdit}>Cancel</button>
                <button className="success" onClick={handleUpdateName}>
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>

        <hr style={{ margin: "2rem 0", border: "1px solid #dee2e6" }} />

        <div>
          <h2
            style={{
              marginBottom: "1rem",
              fontSize: "1.5rem",
              color: "#e74c3c",
            }}
          >
            Danger Zone
          </h2>
          <p
            style={{
              color: "#7f8c8d",
              fontSize: "0.9rem",
              marginBottom: "1rem",
            }}
          >
            Deleting your profile will permanently remove:
          </p>
          <ul
            style={{
              color: "#7f8c8d",
              fontSize: "0.9rem",
              marginBottom: "1rem",
              marginLeft: "1.5rem",
            }}
          >
            <li>Your nickname from this device</li>
            <li>ALL bingo cards you created</li>
            <li>This action cannot be undone</li>
          </ul>
          <button
            className="danger"
            onClick={handleDeleteProfile}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Profile & All Cards"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
