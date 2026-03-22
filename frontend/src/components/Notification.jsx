import { useState, useEffect } from "react";

function Notification({ notification, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 4 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out animation
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!notification) return null;

  const { type, message } = notification;
  const isWin = type === "player-won";
  const isUnvalidated = type === "tile-unvalidated";

  // Determine icon based on notification type
  let icon = "✓";
  if (isWin) icon = "🎉";
  if (isUnvalidated) icon = "↩";

  return (
    <div
      className={`notification ${isVisible ? "show" : "hide"} ${isWin ? "win" : ""} ${isUnvalidated ? "unvalidated" : ""}`}
    >
      <div className="notification-content">
        <span className="notification-icon">{icon}</span>
        <span className="notification-message">{message}</span>
      </div>
      <button
        className="notification-close"
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
      >
        ×
      </button>
    </div>
  );
}

function NotificationContainer({ notifications, onDismiss }) {
  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={() => onDismiss(notification.id)}
        />
      ))}
    </div>
  );
}

export default NotificationContainer;
