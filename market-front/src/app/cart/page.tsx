"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface CartItem {
  id: number;
  productId: number;
  productVariantId?: number | null;
  productName: string;
  optionSummary?: string | null;
  price: number;
  quantity: number;
  subtotal: number;
}

interface CartResponse {
  cartId: number;
  items: CartItem[];
  totalAmount: number;
}

export default function CartPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api<CartResponse>("/cart");
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/cart");
      return;
    }
    fetchCart();
  }, [user, router, fetchCart]);

  async function updateQuantity(itemId: number, quantity: number) {
    setError("");
    try {
      const data = await api<CartResponse>(`/cart/items/${itemId}?quantity=${quantity}`, {
        method: "PATCH",
      });
      setCart(data);
      if (typeof window !== "undefined") window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "수량 변경 실패");
    }
  }

  async function removeItem(itemId: number) {
    setError("");
    try {
      await api(`/cart/items/${itemId}`, { method: "DELETE" });
      if (typeof window !== "undefined") window.dispatchEvent(new Event("cart-updated"));
      fetchCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    }
  }

  function goToCheckout(items?: CartItem[]) {
    const list = items ?? cart?.items ?? [];
    if (!list.length) return;
    const params = new URLSearchParams();
    params.append("from", "cart");
    list.forEach((item) => {
      params.append("cartItemId", String(item.id));
    });
    router.push(`/orders/checkout?${params.toString()}`);
  }

  const selectedItems = cart?.items?.filter((i) => selectedIds.has(i.id)) ?? [];
  const allSelected = cart?.items?.length ? selectedIds.size === cart.items.length : false;
  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    if (!cart?.items?.length) return;
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(cart.items.map((i) => i.id)));
  }
  async function removeSelected() {
    if (selectedIds.size === 0) return;
    setError("");
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      setDeletingIds((d) => new Set(d).add(id));
      try {
        await api(`/cart/items/${id}`, { method: "DELETE" });
        if (typeof window !== "undefined") window.dispatchEvent(new Event("cart-updated"));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        fetchCart();
      } catch (err) {
        setError(err instanceof Error ? err.message : "삭제 실패");
      } finally {
        setDeletingIds((d) => {
          const n = new Set(d);
          n.delete(id);
          return n;
        });
      }
    }
    setSelectedIds(new Set());
  }

  if (!user) return null;
  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <p className="section-eyebrow">Your bag</p>
      <h1 className="section-title mb-2">Shopping cart</h1>
      <p className="mb-8 text-[var(--market-text-muted)]">Review items before checkout.</p>
      {error && <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {cart?.items && cart.items.length > 0 ? (
        <div className="grid gap-10 lg:grid-cols-[1fr_minmax(300px,380px)] lg:items-start">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--market-text)]">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-[var(--market-border)] text-[var(--market-accent)] focus:ring-[var(--market-accent)]"
                />
                Select all
              </label>
              <button
                type="button"
                onClick={removeSelected}
                disabled={selectedIds.size === 0 || deletingIds.size > 0}
                  className="text-sm font-medium text-red-500 hover:underline disabled:opacity-50"
              >
                Remove selected
              </button>
            </div>
            <ul className="space-y-4">
              {cart.items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--market-border)] bg-[var(--market-surface)] p-5 shadow-sm"
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="mt-1 h-4 w-4 rounded border-[var(--market-border)] text-[var(--market-accent)]"
                    />
                    <div className="min-w-0">
                      <Link href={`/products/${item.productId}`} className="font-semibold text-[var(--market-text)] hover:text-[var(--market-accent)]">
                        {item.productName}
                      </Link>
                      {item.optionSummary && (
                        <p className="mt-0.5 text-sm text-[var(--market-text-muted)]">{item.optionSummary}</p>
                      )}
                      <p className="mt-1 text-sm text-[var(--market-text-muted)]">
                        ₩{item.price.toLocaleString()} × {item.quantity} ={" "}
                        <span className="font-medium text-[var(--market-text)]">₩{item.subtotal.toLocaleString()}</span>
                      </p>
                    </div>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (v >= 1) updateQuantity(item.id, v);
                      }}
                      className="input-field w-20 text-center"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-sm font-medium text-[var(--market-text-muted)] hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <aside className="market-sticky-summary space-y-6">
            <h2 className="text-lg font-semibold text-[var(--market-text)]">Order summary</h2>
            <div className="flex justify-between text-[var(--market-text-muted)]">
              <span>Subtotal</span>
              <span className="font-medium text-[var(--market-text)]">₩{cart.totalAmount.toLocaleString()}</span>
            </div>
            <p className="text-xs text-[var(--market-text-muted)]">Shipping calculated at checkout.</p>
            <button
              type="button"
              onClick={() => goToCheckout(selectedItems)}
              disabled={selectedItems.length === 0}
              className="btn-primary w-full disabled:opacity-50"
            >
              Checkout selected ({selectedItems.length})
            </button>
            <button type="button" onClick={() => goToCheckout()} className="btn-secondary w-full">
              Checkout all items
            </button>
          </aside>
        </div>
      ) : (
        <div className="empty-state max-w-lg mx-auto">
          <p className="text-lg font-medium text-[var(--market-text)]">Your cart is empty</p>
          <p className="mt-2 text-sm text-[var(--market-text-muted)]">Discover something you love.</p>
          <Link href="/products" className="btn-primary mt-8 inline-flex">
            Continue shopping
          </Link>
        </div>
      )}
    </div>
  );
}
