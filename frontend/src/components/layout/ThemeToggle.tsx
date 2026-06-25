import { useState } from "react";
import { toggleTheme, getTheme } from "../../utils/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<string>(getTheme);

  const handleClick = () => {
    const next = toggleTheme();
    setTheme(next);
  };

  return (
    <button
      className="theme-toggle"
      onClick={handleClick}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle colour theme"
    >
      {theme === "dark" ? "☀" : "🌙"}
    </button>
  );
}
