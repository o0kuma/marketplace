"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const navLinkClass = (pathname: string, href: string) => {
  const active =
    pathname === href ||
    pathname === href + "/" ||
    (href !== "/seller" && pathname.startsWith(href));
  return `text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-accent)] focus-visible:ring-offset-2 focus-visible:rounded ${active ? "font-semibold text-[var(--market-accent)]" : "text-[var(--market-text-muted)] hover:text-[var(--market-text)]"}`;
};

export default function SellerHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--market-border)] bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/seller" className="text-lg font-semibold tracking-tight text-[var(--market-text)]">
          Seller <span className="text-[var(--market-accent)]">Hub</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-4 sm:gap-5">
          <ThemeToggle />
          <Link href="/seller" className={navLinkClass(pathname, "/seller")}>
            Dashboard
          </Link>
          <Link href="/seller/products" className={navLinkClass(pathname, "/seller/products")}>
            Listings
          </Link>
          <Link href="/seller/products/new" className={navLinkClass(pathname, "/seller/products/new")}>
            Add product
          </Link>
          <Link href="/seller/orders" className={navLinkClass(pathname, "/seller/orders")}>
            Orders
          </Link>
          <Link href="/seller/questions" className={navLinkClass(pathname, "/seller/questions")}>
            Q&amp;A
          </Link>
          <Link href="/seller/reviews" className={navLinkClass(pathname, "/seller/reviews")}>
            Reviews
          </Link>
          <span className="hidden text-[var(--market-border)] sm:inline">|</span>
          <Link href="/" className="text-sm font-medium text-[var(--market-text-muted)] hover:text-[var(--market-accent)]">
            View store
          </Link>
          {user && (
            <>
              <span className="text-sm text-[var(--market-text-muted)]">{user.name}</span>
              <button type="button" onClick={logout} className="text-sm font-medium text-[var(--market-text-muted)] hover:text-[var(--market-text)]">
                Log out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
