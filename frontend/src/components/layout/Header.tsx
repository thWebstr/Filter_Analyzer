import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="header">
      <div className="header__left">
        <Logo size="sm" />
      </div>
      <div className="header__right">
        <span className="header__version">
          v1.0.0
        </span>
      </div>
    </header>
  );
}