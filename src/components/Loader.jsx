export default function Loader({ size = 40, text = "Cargando..." }) {
  return (
    <div className="loader-container">
      <div className="loader-spinner" style={{ width: size, height: size }}>
        <svg viewBox="0 0 50 50">
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            className="loader-circle"
          />
        </svg>
      </div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
}
