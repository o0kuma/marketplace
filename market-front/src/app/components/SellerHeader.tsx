"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinkClass = (pathname: string, href: string) => {
  const active =
    pathname === href ||
    pathname === href + "/" ||
    (href !== "/seller" && pathname.startsWith(href));
  return `text-sm outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:rounded ${active ? "font-semibold text-teal-900" : "text-stone-600 hover:text-stone-900"}`;
};

export default function SellerHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/seller" className="text-lg font-semibold tracking-tight text-stone-900">
          Seller <span className="text-teal-700">Hub</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-4 sm:gap-5">
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
          <span className="hidden text-stone-300 sm:inline">|</span>
          <Link href="/" className="text-sm font-medium text-stone-500 hover:text-teal-800">
            View store
          </Link>
          {user && (
            <>
              <span className="text-sm text-stone-400">{user.name}</span>
              <button type="button" onClick={logout} className="text-sm font-medium text-stone-600 hover:text-stone-900">
                Log out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
