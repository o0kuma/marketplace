"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

/** Slim header for full-screen paper search (btbmarket-style). */
export default function SearchTopBar() {
  const { user, loading } = useAuth();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--market-border)] bg-white px-4 lg:px-8">
      <Link href="/" className="text-lg font-semibold tracking-tight text-[var(--market-text)]">
        BTB<span className="text-[var(--market-accent)]">Market</span>
        <span className="ml-2 text-xs font-normal text-[var(--market-text-muted)]">Research</span>
      </Link>
      <nav className="flex items-center gap-3 text-sm sm:gap-4">
        <ThemeToggle />
        <Link href="/products" className="text-[var(--market-text-muted)] hover:text-[var(--market-text)]">
          Shop
        </Link>
        {loading ? (
          <span className="text-[var(--market-text-muted)]">…</span>
        ) : user ? (
          <Link href="/mypage" className="text-[var(--market-text-muted)] hover:text-[var(--market-text)]">
            My Page
          </Link>
        ) : (
          <>
            <Link href="/login" className="text-[var(--market-text-muted)] hover:text-[var(--market-text)]">
              Sign in
            </Link>
            <span className="text-[var(--market-border)]">|</span>
            <Link href="/signup" className="font-medium text-[var(--market-accent)] hover:underline">
              Join
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
