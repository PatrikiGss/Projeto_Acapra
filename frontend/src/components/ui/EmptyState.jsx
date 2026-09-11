import "./ui.css";

function EmptyState({ title, description, action = null, className = "", ...props }) {
  return (
    <div
      className={`acapra-empty-state ${className}`.trim()}
      role="status"
      aria-live="polite"
      {...props}
    >
      <h3 className="acapra-empty-state__title">{title}</h3>
      {description && <p className="acapra-empty-state__description">{description}</p>}
      {action}
    </div>
  );
}

export default EmptyState;
