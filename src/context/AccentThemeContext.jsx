"use client";

// Deprecated: Accent theme layer removed in favor of single brand theme tokens + next-themes
export function AccentThemeProvider({ children }) {
  return <>{children}</>;
}

export function useAccentTheme() {
  return { accentTheme: "default", setAccentTheme: () => {} };
}
