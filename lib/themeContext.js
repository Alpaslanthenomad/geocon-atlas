"use client";
// Theme context — keeps user-chosen theme in localStorage and applies
// `data-theme` attribute on the document root so the token system in
// globals.css swaps palettes instantly.

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({ theme: "light", toggle: () => {}, setTheme: () => {} });

const STORAGE_KEY = "gx-theme";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  // Initial read (runs once on mount). Falls back to system preference
  // when no explicit choice has been saved.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    } else {
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  // Apply attribute on every change
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const persistedSet = (t) => {
    setTheme(t);
    try { window.localStorage.setItem(STORAGE_KEY, t); } catch {}
  };
  const toggle = () => persistedSet(theme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme: persistedSet }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
