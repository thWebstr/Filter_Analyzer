interface SpinnerProps {
  light?: boolean;
  size?: number;
}

export function Spinner({ light = false, size = 16 }: SpinnerProps) {
  return (
    <span
      className={`spinner ${light ? "light" : ""} ${size === 10 ? "spinner--small" : ""}`}
    />
  );
}