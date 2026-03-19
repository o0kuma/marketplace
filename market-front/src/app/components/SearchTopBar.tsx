"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

/** Slim header for full-screen paper search (btbmarket-style). */
export default function SearchTopBar() {
  const { user, loading } = useAuth();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 lg:px-8">
      <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900">
        BTB<span className="text-teal-700">Market</span>
        <span className="ml-2 text-xs font-normal text-zinc-500">Research</span>
      </Link>
      <nav className="flex items-center gap-3 text-sm sm:gap-4">
        <Link href="/products" className="text-zinc-600 hover:text-zinc-900">
          Shop
        </Link>
        {loading ? (
          <span className="text-zinc-400">…</span>
        ) : user ? (
          <Link href="/mypage" className="text-zinc-600 hover:text-zinc-900">
            My Page
          </Link>
        ) : (
          <>
            <Link href="/login" className="text-zinc-600 hover:text-zinc-900">
              Sign in
            </Link>
            <span className="text-zinc-300">|</span>
            <Link href="/signup" className="font-medium text-teal-800 hover:underline">
              Join
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
