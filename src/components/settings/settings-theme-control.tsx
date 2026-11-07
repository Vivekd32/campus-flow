"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect } from "react";

export function SettingsThemeControl() {
  useEffect(() => {
    const savedTheme = window.localStorage.getItem("campusflow-theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      document.documentElement.dataset.theme = savedTheme;
    }
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    const isDark =
      root.dataset.theme === "dark" ||
      (!root.dataset.theme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    const nextTheme = isDark ? "light" : "dark";
    root.dataset.theme = nextTheme;
    window.localStorage.setItem("campusflow-theme", nextTheme);
  }

  return (
    <button
      aria-label="Toggle color theme"
      className="inline-flex size-9 items-center justify-center rounded-control text-muted-foreground transition hover:bg-surface-muted hover:text-foreground"
      onClick={toggleTheme}
      title="Toggle color theme"
      type="button"
    >
      <Sun aria-hidden="true" className="hidden [html[data-theme=dark]_&]:block" size={17} />
      <Moon aria-hidden="true" className="[html[data-theme=dark]_&]:hidden" size={17} />
    </button>
  );
}
