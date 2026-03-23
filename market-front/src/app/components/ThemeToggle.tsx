"use client";

import { useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "theme-mode";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const resolved = mode === "system" ? getSystemTheme() : mode;
  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.style.colorScheme = resolved;
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const saved = (typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null) as ThemeMode | null;
    const next = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
    setMode(next);
    applyTheme(next);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, mode);
    applyTheme(mode);
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const label = useMemo(() => {
    if (mode === "dark") return "다크";
    if (mode === "light") return "라이트";
    return "시스템";
  }, [mode]);

  function cycleMode() {
    setMode((prev) => (prev === "light" ? "dark" : prev === "dark" ? "system" : "light"));
  }

  return (
    <button
      type="button"
      onClick={cycleMode}
      className="rounded-full border border-[var(--market-border)] bg-[var(--market-surface)]/90 px-3 py-1.5 text-xs font-medium text-[var(--market-text-muted)] transition hover:border-[var(--market-accent)] hover:text-[var(--market-accent)]"
      title={`테마: ${label}`}
      aria-label={`테마 변경: 현재 ${label}`}
    >
      테마 {label}
    </button>
  );
}

