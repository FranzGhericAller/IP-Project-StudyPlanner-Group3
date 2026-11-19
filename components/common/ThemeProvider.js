"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

function applyDarkClass(isDark) {
  document.documentElement.classList.toggle("dark", Boolean(isDark));
}

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialDark = saved !== null ? saved === "dark" : prefersDark;
    setDarkMode(initialDark);
    applyDarkClass(initialDark);
  }, []);

  function updateDarkMode(nextDark) {
    const value = Boolean(nextDark);
    setDarkMode(value);
    localStorage.setItem("theme", value ? "dark" : "light");
    applyDarkClass(value);
  }

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode: updateDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}