import { THEME_STORAGE_KEY } from "../constants/site.js";

/**
 * @return {"dark"|"light"}
 */
export function readTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

/**
 * Persists theme on <html> and in localStorage.
 * @param {"dark"|"light"} theme
 * @return {"dark"|"light"}
 */
export function writeTheme(theme) {
  const next = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(THEME_STORAGE_KEY, next);
  return next;
}
