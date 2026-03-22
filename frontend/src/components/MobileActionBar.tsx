/**
 * MobileActionBar Component
 * Reusable bottom action bar for mobile views
 * Displays buttons with icons and labels in a fixed bottom bar
 */

interface MobileActionButton {
  icon: string;
  label: string;
  onClick: () => void;
  variant?: string;
  active?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  title?: string;
}

interface MobileActionBarProps {
  buttons: MobileActionButton[];
}

function MobileActionBar({ buttons }: MobileActionBarProps) {
  return (
    <div className="mobile-action-bar">
      {buttons.map((button, index) => (
        <button
          key={index}
          className={`mobile-action-btn ${button.variant || ""} ${button.active ? "active" : ""}`}
          onClick={button.onClick}
          disabled={button.disabled}
          aria-label={button.ariaLabel}
          aria-expanded={button.ariaExpanded}
          title={button.title}
        >
          <span className="btn-icon">{button.icon}</span>
          <span className="btn-label">{button.label}</span>
        </button>
      ))}
    </div>
  );
}

export default MobileActionBar;
