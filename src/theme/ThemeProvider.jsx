import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { runViewTransition } from "../ui/viewTransition.js";
import { readTheme, writeTheme } from "./storage.js";

const ThemeContext = createContext(null);

/**
 * Single source of truth for color theme so Home and inner pages stay in sync.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readTheme);

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    runViewTransition(() => {
      writeTheme(next);
      setTheme(next);
    });
  }, [theme]);

  const value = useMemo(
    () => ({ theme, toggleTheme }),
    [theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
