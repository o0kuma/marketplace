"use client";

import { useAuth } from "@/context/AuthContext";
import type { MemberRole } from "@/types/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

function roleLabel(role: MemberRole): string {
  switch (role) {
    case "SELLER":
      return "Seller";
    case "ADMIN":
      return "Admin";
    default:
      return "Member";
  }
}

interface UserMenuProps {
  /** Optional profile image URL when API provides it */
  profileImageUrl?: string | null;
}

export default function UserMenu({ profileImageUrl }: UserMenuProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent | PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const sellerActive = pathname?.startsWith("/seller");
  const adminActive = pathname?.startsWith("/admin");

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        id="user-menu-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--market-border)] bg-[var(--market-accent-subtle)] text-sm font-semibold text-[var(--market-accent)] shadow-sm outline-none transition hover:border-[var(--market-accent)] hover:ring-2 hover:ring-[var(--market-accent)]/20 focus-visible:ring-2 focus-visible:ring-[var(--market-accent)] focus-visible:ring-offset-2"
        title={user.name}
      >
        {profileImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profileImageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span aria-hidden>{initialsFromName(user.name)}</span>
        )}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-labelledby="user-menu-trigger"
          className="absolute right-0 z-[60] mt-2 w-72 origin-top-right rounded-xl border border-[var(--market-border)] bg-[var(--market-surface)] py-2 shadow-lg ring-1 ring-[var(--market-border)]"
        >
          <div className="border-b border-[var(--market-border)] px-4 py-3">
            <p className="truncate text-sm font-semibold text-[var(--market-text)]">{user.name}</p>
            <p className="mt-0.5 truncate text-xs text-[var(--market-text-muted)]">{user.email}</p>
            <span className="mt-2 inline-block rounded-full bg-[var(--market-accent-subtle)] px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-[var(--market-accent)]">
              {roleLabel(user.role)}
            </span>
          </div>

          <div className="py-1" role="none">
            <Link
              href="/mypage"
              role="menuitem"
              onClick={close}
              className="block px-4 py-2.5 text-sm font-medium text-[var(--market-text)] hover:bg-[var(--market-accent-subtle)]"
            >
              My page
            </Link>
            {user.role === "SELLER" && (
              <Link
                href="/seller"
                role="menuitem"
                onClick={close}
                className={`block px-4 py-2.5 text-sm font-medium hover:bg-[var(--market-accent-subtle)] ${
                  sellerActive ? "text-[var(--market-accent)]" : "text-[var(--market-text)]"
                }`}
              >
                Seller hub
              </Link>
            )}
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                role="menuitem"
                onClick={close}
                className={`block px-4 py-2.5 text-sm font-medium hover:bg-[var(--market-accent-subtle)] ${
                  adminActive ? "text-[var(--market-accent)]" : "text-[var(--market-text)]"
                }`}
              >
                Admin console
              </Link>
            )}
          </div>

          <div className="border-t border-[var(--market-border)] pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                logout();
              }}
              className="w-full px-4 py-2.5 text-left text-sm font-medium text-[var(--market-text-muted)] hover:bg-[var(--market-accent-subtle)] hover:text-[var(--market-text)]"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
