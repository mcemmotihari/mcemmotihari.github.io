import { useState } from "react";
import { readTheme, writeTheme } from "./theme.js";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(readTheme);

  function toggle() {
    setTheme(writeTheme(theme === "dark" ? "light" : "dark"));
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      <span className="theme-ico" aria-hidden="true" />
      <span>{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}
