"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

function navClass(pathname: string, href: string, exact: boolean) {
  const active = exact ? pathname === href || pathname === `${href}/` : pathname.startsWith(href);
  return active
    ? "text-sm font-semibold text-white"
    : "text-sm text-indigo-100/75 transition hover:text-white";
}

export default function AdminHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-indigo-300/25 bg-gradient-to-r from-[var(--market-dark)] via-[var(--market-accent)] to-[var(--market-secondary)] text-white shadow-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/admin" className="text-lg font-semibold tracking-tight text-white">
          Admin
        </Link>
        <nav className="flex flex-wrap items-center gap-3 sm:gap-5">
          <Link href="/admin" className={navClass(pathname, "/admin", true)}>
            Dashboard
          </Link>
          <Link href="/admin/members" className={navClass(pathname, "/admin/members", false)}>
            Members
          </Link>
          <Link href="/admin/products" className={navClass(pathname, "/admin/products", false)}>
            Products
          </Link>
          <Link href="/admin/orders" className={navClass(pathname, "/admin/orders", false)}>
            Orders
          </Link>
          <Link href="/admin/categories" className={navClass(pathname, "/admin/categories", false)}>
            Categories
          </Link>
          <Link href="/admin/notices" className={navClass(pathname, "/admin/notices", false)}>
            Notices
          </Link>
          <Link href="/admin/site-documents" className={navClass(pathname, "/admin/site-documents", false)}>
            Legal
          </Link>
          <span className="text-indigo-100/40">|</span>
          <Link href="/" className="text-sm text-indigo-100/80 hover:text-white">
            Storefront
          </Link>
          {user && (
            <>
              <span className="text-sm text-indigo-100/70">{user.name}</span>
              <button type="button" onClick={logout} className="text-sm text-indigo-100/90 hover:text-white">
                Log out
              </button>
            </>
          )}
          <ThemeToggle className="border-white/25 bg-white/10 text-white hover:border-white/50 hover:text-white focus-visible:ring-white/70 focus-visible:ring-offset-0" />
        </nav>
      </div>
    </header>
  );
}
