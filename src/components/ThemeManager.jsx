import { useEffect, useState } from "react";

export function ThemeManager() {
  const [theme, setTheme] = useState(() => {
    // Check local storage or system preference, but default to 'dark' for this overhaul
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = window.localStorage.getItem("theme");
      if (stored) return stored;
    }
    return "dark"; // Force default dark
  });

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove both to ensure clean state
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Listen for storage changes in other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "theme") {
        setTheme(e.newValue || "dark");
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return null; // This component handles side effects only
}
