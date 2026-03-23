"use client";

import Header from "@/app/components/Header";
import MarketFooter from "@/app/components/MarketFooter";
import SearchTopBar from "@/app/components/SearchTopBar";
import { usePathname } from "next/navigation";

/**
 * Renders general Header + main only for non-seller, non-admin routes.
 * /search uses slim bar + full-bleed btbmarket-style layout.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSeller = pathname?.startsWith("/seller");
  const isAdmin = pathname?.startsWith("/admin");
  const isPaperSearch = pathname?.startsWith("/search");
  const isHome = pathname === "/";

  if (isSeller || isAdmin) {
    return <>{children}</>;
  }

  if (isPaperSearch) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--market-bg)]">
        <SearchTopBar />
        <main id="main-content" className="min-h-0 flex-1 overflow-hidden" tabIndex={-1}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--market-bg)]">
      <Header />
      <main
        id="main-content"
        className={
          isHome
            ? "min-h-0 w-full max-w-none flex-1 px-0 pb-10 pt-0 sm:pb-12"
            : "market-container min-h-[calc(100vh-12rem)] flex-1 py-10 sm:py-12"
        }
        tabIndex={-1}
      >
        {children}
      </main>
      <MarketFooter />
    </div>
  );
}
