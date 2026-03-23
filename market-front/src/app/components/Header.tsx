"use client";

import UserMenu from "@/app/components/UserMenu";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const navMuted =
  "text-sm font-medium text-stone-600 transition hover:text-stone-900";
const navActive = "text-sm font-semibold text-teal-800";

function navClass(pathname: string, href: string) {
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return `${active ? navActive : navMuted} outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 rounded`;
}

/** Product catalog or product detail — show header search */
function isProductsSearchPage(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === "/products") return true;
  return /^\/products\/\d+$/.test(pathname);
}

export default function Header() {
  const pathname = usePathname();
  const showProductSearch = isProductsSearchPage(pathname);
  const router = useRouter();
  const { user, loading } = useAuth();
  const [cartCount, setCartCount] = useState<number>(0);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [searchQ, setSearchQ] = useState("");

  const refreshCartCount = useCallback(() => {
    if (!user) {
      setCartCount(0);
      return;
    }
    api<number>("/cart/count")
      .then(setCartCount)
      .catch(() => setCartCount(0));
  }, [user]);

  useEffect(() => {
    refreshCartCount();
  }, [refreshCartCount]);

  useEffect(() => {
    const handler = () => refreshCartCount();
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, [refreshCartCount]);

  useEffect(() => {
    if (!user) {
      setNotificationCount(0);
      return;
    }
    api<number>("/notifications/unread-count")
      .then(setNotificationCount)
      .catch(() => setNotificationCount(0));
  }, [user]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQ.trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  }

  return (
    <header id="site-header" className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/90 shadow-sm backdrop-blur-md">
      <div className="border-b border-teal-900/5 bg-gradient-to-r from-teal-950 via-teal-900 to-stone-900 px-4 py-2 text-center text-xs font-medium tracking-wide text-white/95 sm:text-sm">
        일정 금액 이상 무료 배송 · 판매자 모집 · 다양한 상품을 만나 보세요
      </div>
      <div className="market-container flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="flex items-center justify-between gap-6 lg:justify-start">
          <Link href="/" className="shrink-0 text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl">
            BTB<span className="text-teal-700">Market</span>
          </Link>
          <form
            onSubmit={onSearch}
            className={`hidden max-w-md flex-1 md:block lg:max-w-lg ${showProductSearch ? "" : "md:hidden"}`}
          >
            <div className="flex overflow-hidden rounded-full border border-stone-200 bg-stone-50 shadow-inner">
              <input
                type="search"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="상품명 검색"
                className="min-w-0 flex-1 border-0 bg-transparent px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-0"
                aria-label="상품 검색"
              />
              <button
                type="submit"
                className="shrink-0 bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                검색
              </button>
            </div>
          </form>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-x-7 lg:justify-end">
          <Link href="/products" className={navClass(pathname, "/products")}>
            쇼핑
          </Link>
          <Link href="/notices" className={navClass(pathname, "/notices")}>
            공지
          </Link>
          {loading ? (
            <span className="text-sm text-stone-400">…</span>
          ) : user ? (
            <>
              <Link href="/cart" className={`relative ${navClass(pathname, "/cart")}`}>
                장바구니
                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-700 px-1 text-[10px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
              <Link href="/notifications" className={`relative ${navClass(pathname, "/notifications")}`}>
                알림
                {notificationCount > 0 && (
                  <span className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
                )}
              </Link>
              <Link href="/orders" className={navClass(pathname, "/orders")}>
                주문
              </Link>
              <UserMenu profileImageUrl={user.profileImageUrl} />
            </>
          ) : (
            <>
              <Link href="/login" className={navClass(pathname, "/login")}>
                로그인
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
      <form
        onSubmit={onSearch}
        className={`market-container pb-3 md:hidden ${showProductSearch ? "" : "hidden"}`}
      >
        <div className="flex overflow-hidden rounded-full border border-stone-200 bg-stone-50">
          <input
            type="search"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="상품명 검색"
            className="min-w-0 flex-1 border-0 bg-transparent px-4 py-2 text-sm focus:outline-none"
          />
          <button type="submit" className="bg-teal-800 px-4 py-2 text-sm font-medium text-white">
            검색
          </button>
        </div>
      </form>
    </header>
  );
}
