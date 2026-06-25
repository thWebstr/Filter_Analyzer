import { useEffect } from "react";

const STORAGE_KEY = "fa_theme";
const DEFAULT_THEME = "dark";

function applyTheme(theme: string) {
  document.documentElement.dataset.theme = theme;
}

export function useThemeInit() {
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME;
    applyTheme(saved);
  }, []);
}

export function toggleTheme() {
  const current = document.documentElement.dataset.theme ?? DEFAULT_THEME;
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(STORAGE_KEY, next);
  return next;
}

export function getTheme(): string {
  return document.documentElement.dataset.theme ?? DEFAULT_THEME;
}
