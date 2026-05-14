interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="error-banner">
      <span className="error-banner__icon">⚠</span>
      <span className="error-banner__text">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="error-banner__close"
        >
          ×
        </button>
      )}
    </div>
  );
}