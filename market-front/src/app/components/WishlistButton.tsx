"use client";

import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

interface WishlistButtonProps {
  productId: number;
  /** Initial state; will be refetched when user changes. */
  initialInWishlist?: boolean;
  /** Called after toggle (success). */
  onToggled?: (inWishlist: boolean) => void;
  /** Compact for list, normal for detail. */
  variant?: "compact" | "normal";
  className?: string;
}

export default function WishlistButton({
  productId,
  initialInWishlist = false,
  onToggled,
  variant = "normal",
  className = "",
}: WishlistButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!user) {
        router.push("/login");
        return;
      }
      setLoading(true);
      try {
        if (inWishlist) {
          await api(`/wishlist/products/${productId}`, { method: "DELETE" });
          setInWishlist(false);
          onToggled?.(false);
        } else {
          await api(`/wishlist/products/${productId}`, { method: "POST" });
          setInWishlist(true);
          onToggled?.(true);
        }
      } catch {
        // keep state on error
      } finally {
        setLoading(false);
      }
    },
    [user, productId, inWishlist, onToggled, router]
  );

  if (!user) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          router.push("/login");
        }}
        aria-label="찜하기 (로그인 필요)"
        className={`inline-flex items-center justify-center rounded-full border border-[var(--market-border)] bg-[var(--market-surface)] text-[var(--market-text-muted)] hover:bg-[var(--market-accent-subtle)] ${variant === "compact" ? "h-8 w-8" : "h-10 w-10"} ${className}`}
      >
        <HeartIcon filled={false} className={variant === "compact" ? "h-4 w-4" : "h-5 w-5"} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={inWishlist ? "찜 해제" : "찜하기"}
      className={`inline-flex items-center justify-center rounded-full border border-[var(--market-border)] bg-[var(--market-surface)] text-[var(--market-text)] hover:bg-[var(--market-accent-subtle)] disabled:opacity-50 ${variant === "compact" ? "h-8 w-8" : "h-10 w-10"} ${inWishlist ? "border-red-200 text-red-500 hover:bg-red-50" : ""} ${className}`}
    >
      <HeartIcon filled={inWishlist} className={variant === "compact" ? "h-4 w-4" : "h-5 w-5"} />
    </button>
  );
}

function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
