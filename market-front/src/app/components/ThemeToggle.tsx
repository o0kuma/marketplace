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

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SystemIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
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
    if (mode === "dark") return "Dark mode";
    if (mode === "light") return "Light mode";
    return "Match system";
  }, [mode]);

  function cycleMode() {
    setMode((prev) => (prev === "light" ? "dark" : prev === "dark" ? "system" : "light"));
  }

  const iconClass = "h-[1.15rem] w-[1.15rem]";

  return (
    <button
      type="button"
      onClick={cycleMode}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--market-border)] bg-[var(--market-surface)] text-[var(--market-text-muted)] transition hover:border-[var(--market-accent)] hover:text-[var(--market-accent)] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[var(--market-accent)] focus-visible:ring-offset-2 ${className}`}
      title={`Theme: ${label} (click to cycle)`}
      aria-label={`Change theme, currently ${label}`}
    >
      {mode === "light" ? <SunIcon className={iconClass} /> : mode === "dark" ? <MoonIcon className={iconClass} /> : <SystemIcon className={iconClass} />}
    </button>
  );
}
