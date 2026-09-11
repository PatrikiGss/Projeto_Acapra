import "./ui.css";

function LoadingSpinner({ label = "Carregando...", className = "", ...props }) {
  return (
    <div
      className={`acapra-spinner ${className}`.trim()}
      role="status"
      aria-live="polite"
      {...props}
    >
      <span className="acapra-spinner__ring" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export default LoadingSpinner;
