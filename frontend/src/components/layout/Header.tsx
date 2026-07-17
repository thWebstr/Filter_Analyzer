import { Logo }        from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

interface Props {
  onToggleSidebar: () => void;
  sidebarOpen:     boolean;
}

export function Header({ onToggleSidebar, sidebarOpen }: Props) {
  return (
    <header className="header">
      <div className="header__left">
        <button
          className={`mobile-toggle ${sidebarOpen ? "active" : ""}`}
          onClick={onToggleSidebar}
          aria-label="Toggle Specification Sidebar"
        >
          {sidebarOpen ? "✕" : "☰"}
        </button>
        <Logo size="sm" />
      </div>
      <div className="header__right">
        <ThemeToggle />
        <span className="header__version">
          v1.1.0
        </span>
      </div>
    </header>
  );
}
