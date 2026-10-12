// Reusable button component that shows a spinner or loading indicator when busy
export default function Button({
  children,
  loading = false,
  loadingText = '...',
  disabled = false,
  type = 'button',
  className = 'btn',
  onClick,
  ...props
}) {
  return (
    <button
      type={type}
      className={className}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="btn-loading-content">
          <span className="btn-spinner" aria-hidden="true" />
          <span>{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
