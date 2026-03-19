"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

function navClass(pathname: string, href: string, exact: boolean) {
  const active = exact ? pathname === href || pathname === `${href}/` : pathname.startsWith(href);
  return active ? "text-sm font-semibold text-white" : "text-sm text-white/70 transition hover:text-white";
}

export default function AdminHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-700 bg-stone-900 text-white shadow-md">
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
          <span className="text-white/30">|</span>
          <Link href="/" className="text-sm text-white/70 hover:text-white">
            Storefront
          </Link>
          {user && (
            <>
              <span className="text-sm text-white/50">{user.name}</span>
              <button type="button" onClick={logout} className="text-sm text-white/80 hover:text-white">
                Log out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
