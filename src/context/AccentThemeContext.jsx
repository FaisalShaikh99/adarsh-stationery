"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const AccentThemeContext = createContext({
  accentTheme: "indigo-ink",
  setAccentTheme: () => {},
});

export function AccentThemeProvider({ children }) {
  const [accentTheme, setAccentThemeState] = useState("indigo-ink");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("accent-theme");
    if (saved === "violet-dusk" || saved === "indigo-ink") {
      setAccentThemeState(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      document.documentElement.setAttribute("data-theme", "indigo-ink");
    }
  }, []);

  const setAccentTheme = (theme) => {
    if (theme !== "indigo-ink" && theme !== "violet-dusk") return;
    setAccentThemeState(theme);
    localStorage.setItem("accent-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  };

  return (
    <AccentThemeContext.Provider value={{ accentTheme, setAccentTheme, mounted }}>
      {children}
    </AccentThemeContext.Provider>
  );
}

export function useAccentTheme() {
  return useContext(AccentThemeContext);
}
