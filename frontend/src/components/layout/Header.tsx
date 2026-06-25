import { Logo }        from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="header">
      <div className="header__left">
        <Logo size="sm" />
      </div>
      <div className="header__right">
        <ThemeToggle />
        <span className="header__version">
          v1.0.0
        </span>
      </div>
    </header>
  );
}
