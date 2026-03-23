"use client";

import Link from "next/link";

const colTitle = "text-xs font-semibold uppercase tracking-[0.15em] text-[var(--market-text-muted)]";
const linkClass = "text-sm text-[var(--market-text-muted)] transition hover:text-[var(--market-accent)]";

export default function MarketFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--market-border)] bg-white/90 backdrop-blur">
      <div className="market-container py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-semibold tracking-tight text-[var(--market-text)]">BTB Market</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--market-text-muted)]">
              Curated products, secure checkout, and seller tools — a modern marketplace experience.
            </p>
          </div>
          <div>
            <h3 className={colTitle}>Shop</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/products" className={linkClass}>
                  All products
                </Link>
              </li>
              <li>
                <Link href="/notices" className={linkClass}>
                  Announcements
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className={colTitle}>Account</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/login" className={linkClass}>
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/orders" className={linkClass}>
                  Orders
                </Link>
              </li>
              <li>
                <Link href="/cart" className={linkClass}>
                  Cart
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className={colTitle}>Legal</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/terms" className={linkClass}>
                  Terms of service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={linkClass}>
                  Privacy policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--market-border)] pt-8 sm:flex-row">
          <p className="text-center text-xs text-[var(--market-text-muted)] sm:text-left">
            © {new Date().getFullYear()} Open Market. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-[var(--market-text-muted)]">
            <span>Secure payments</span>
            <span>·</span>
            <span>Buyer protection</span>
            <span>·</span>
            <span>24/7 support</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
