"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Product } from "@/types/product";
import type { Order } from "@/types/order";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, Suspense } from "react";

interface OrderItemInput {
  productId: number;
  productVariantId?: number | null;
  quantity: number;
  product?: Product | null;
  cartItemId?: number;
  optionSummary?: string | null;
  /** Unit price for display when variant is selected (variant price). */
  displayPrice?: number;
}

interface ShippingQuote {
  subtotalKrw: number;
  shippingFeeKrw: number;
  totalKrw: number;
  freeShippingThresholdKrw: number;
}

interface CheckoutPreviewLine {
  cartItemId: number;
  productId: number;
  productVariantId?: number | null;
  productName: string;
  optionSummary?: string | null;
  price: number;
  quantity: number;
  lineTotal: number;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const fromCart = searchParams.get("from") === "cart";
  const cartItemIds = searchParams.getAll("cartItemId").map((id) => Number(id)).filter((n) => !Number.isNaN(n));

  const productIds = searchParams.getAll("productId").map((id) => Number(id)).filter((n) => !Number.isNaN(n));
  const quantities = searchParams.getAll("quantity").map((q) => Number(q) || 1);
  const variantIds = searchParams.getAll("productVariantId").map((id) => Number(id)).filter((n) => !Number.isNaN(n));
  const itemsFromParams: OrderItemInput[] = productIds.slice(0, quantities.length).map((id, i) => ({
    productId: id,
    quantity: quantities[i] ?? 1,
    productVariantId: variantIds[i] ?? undefined,
    product: null,
  }));
  if (itemsFromParams.length === 0 && searchParams.get("productId")) {
    const singleId = Number(searchParams.get("productId"));
    const singleQty = Number(searchParams.get("quantity")) || 1;
    const singleVariantId = searchParams.get("productVariantId");
    const variantId = singleVariantId ? Number(singleVariantId) : undefined;
    if (!Number.isNaN(singleId)) {
      itemsFromParams.push({
        productId: singleId,
        quantity: singleQty,
        productVariantId: !Number.isNaN(variantId as number) ? variantId : undefined,
        product: null,
      });
    }
  }

  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<OrderItemInput[]>(itemsFromParams);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState("");
  const [quote, setQuote] = useState<ShippingQuote | null>(null);

  const refreshQuote = useCallback(async (subtotal: number) => {
    try {
      const q = await api<ShippingQuote>("/shipping/quote", { params: { subtotalKrw: String(subtotal) } });
      setQuote(q);
    } catch {
      setQuote({
        subtotalKrw: subtotal,
        shippingFeeKrw: 0,
        totalKrw: subtotal,
        freeShippingThresholdKrw: 50000,
      });
    }
  }, []);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    setRecipientName(user.name ?? "");
    setRecipientPhone(user.phone ?? "");
    setRecipientAddress(user.address ?? "");
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      if (fromCart) {
        try {
          const preview = await api<{
            lines: CheckoutPreviewLine[];
            subtotalKrw: number;
            shippingFeeKrw: number;
            totalKrw: number;
            freeShippingThresholdKrw: number;
          }>("/cart/checkout-preview", {
            method: "POST",
            body: JSON.stringify({ cartItemIds: cartItemIds.length ? cartItemIds : [] }),
          });
          if (cancelled) return;
          if (!preview.lines.length) {
            setItems([]);
            setLoading(false);
            setQuote({
              subtotalKrw: 0,
              shippingFeeKrw: 0,
              totalKrw: 0,
              freeShippingThresholdKrw: preview.freeShippingThresholdKrw,
            });
            return;
          }
          const mapped: OrderItemInput[] = preview.lines.map((l) => ({
            productId: l.productId,
            productVariantId: l.productVariantId ?? undefined,
            quantity: l.quantity,
            cartItemId: l.cartItemId,
            optionSummary: l.optionSummary ?? undefined,
            displayPrice: l.price,
            product: {
              id: l.productId,
              name: l.productName,
              price: l.price,
            } as Product,
          }));
          setItems(mapped);
          setQuote({
            subtotalKrw: preview.subtotalKrw,
            shippingFeeKrw: preview.shippingFeeKrw,
            totalKrw: preview.totalKrw,
            freeShippingThresholdKrw: preview.freeShippingThresholdKrw,
          });
        } catch {
          if (!cancelled) setError("장바구니 정보를 불러올 수 없습니다.");
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }

      if (itemsFromParams.length === 0) {
        setLoading(false);
        return;
      }
      Promise.all(
        itemsFromParams.map((it) =>
          api<Product>(`/products/${it.productId}`)
            .then((p) => {
              const variant = it.productVariantId && p.variants?.length
                ? p.variants.find((v) => v.id === it.productVariantId)
                : null;
              return {
                ...it,
                product: p,
                displayPrice: variant ? variant.price : p.price,
                optionSummary: variant?.optionSummary ?? undefined,
              };
            })
            .catch(() => ({ ...it, product: null }))
        )
      ).then((results) => {
        if (cancelled) return;
        setItems(results);
        const sub = results.reduce(
          (s, it) => s + (it.displayPrice != null ? it.displayPrice * it.quantity : it.product ? it.product.price * it.quantity : 0),
          0
        );
        refreshQuote(sub);
      }).catch(() => {
        if (!cancelled) setError("상품을 불러올 수 없습니다.");
      }).finally(() => {
        if (!cancelled) setLoading(false);
      });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, fromCart, searchParams.toString(), refreshQuote]);

  useEffect(() => {
    if (fromCart || !items.length) return;
    const sub = items.reduce(
      (s, it) => s + (it.displayPrice != null ? it.displayPrice * it.quantity : it.product ? it.product.price * it.quantity : 0),
      0
    );
    refreshQuote(sub);
  }, [items, fromCart, refreshQuote]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validItems = items.filter((it) => it.product && it.quantity >= 1);
    if (validItems.length === 0 || !user) return;
    if (!recipientName.trim() || !recipientPhone.trim() || !recipientAddress.trim()) {
      setError("배송 정보를 모두 입력해 주세요.");
      return;
    }
    setError("");
    setSubmitting("order");
    try {
      const created = await api<Order>("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: validItems.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            ...(it.productVariantId ? { productVariantId: it.productVariantId } : {}),
          })),
          recipientName: recipientName.trim(),
          recipientPhone: recipientPhone.trim(),
          recipientAddress: recipientAddress.trim(),
        }),
      });
      const idsToRemove = validItems.map((it) => it.cartItemId).filter((id): id is number => id != null);
      for (const cid of idsToRemove) {
        try {
          await api(`/cart/items/${cid}`, { method: "DELETE" });
        } catch {
          /* ignore */
        }
      }
      if (idsToRemove.length && typeof window !== "undefined") {
        window.dispatchEvent(new Event("cart-updated"));
      }
      await refreshUser();
      router.push(`/orders/${created.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "주문 실패");
    } finally {
      setSubmitting("");
    }
  }

  if (!user) return null;
  if (loading && items.some((i) => !i.product) && !fromCart) return <LoadingSpinner />;
  if (loading && fromCart && items.length === 0 && !error) return <LoadingSpinner />;
  const validItems = items.filter((i) => i.product);
  if (validItems.length === 0 && items.length > 0) {
    return <p className="py-8 text-red-600">{error || "상품을 불러올 수 없습니다."}</p>;
  }
  if (items.length === 0) {
    return (
      <p className="py-8 text-zinc-600">
        주문할 상품이 없습니다.{" "}
        <Link href="/products" className="underline">
          상품 목록
        </Link>
      </p>
    );
  }

  const subtotal =
    quote?.subtotalKrw ??
    validItems.reduce(
      (sum, it) => sum + (it.displayPrice ?? it.product!.price) * it.quantity,
      0
    );
  const shippingFee = quote?.shippingFeeKrw ?? 0;
  const finalAmount = quote?.totalKrw ?? subtotal + shippingFee;
  const threshold = quote?.freeShippingThresholdKrw ?? 50000;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="section-title">주문하기</h1>
      {fromCart && (
        <p className="text-sm text-zinc-500">장바구니에서 선택한 상품으로 주문합니다.</p>
      )}
      <div className="card space-y-2">
        <h2 className="text-sm font-semibold text-zinc-700">주문 상품</h2>
        {validItems.map((it) => {
          const unitPrice = it.displayPrice ?? it.product!.price;
          return (
            <p key={`${it.productId}-${it.cartItemId ?? ""}-${it.productVariantId ?? ""}`} className="text-sm">
              <Link href={`/products/${it.productId}`} className="font-medium text-zinc-900 hover:underline">
                {it.product!.name}
              </Link>
              {it.optionSummary && <span className="text-zinc-600"> ({it.optionSummary})</span>}{" "}
              {unitPrice.toLocaleString()}원 × {it.quantity} = {(unitPrice * it.quantity).toLocaleString()}원
            </p>
          );
        })}
      </div>
      <div className="card space-y-2">
        <h2 className="text-sm font-semibold text-zinc-700">결제 금액 요약</h2>
        <div className="flex justify-between text-sm text-zinc-600">
          <span>상품 금액</span>
          <span>{subtotal.toLocaleString()}원</span>
        </div>
        <div className="flex justify-between text-sm text-zinc-600">
          <span>배송비</span>
          <span>
            {shippingFee === 0 && subtotal > 0 ? (
              <span className="text-teal-700">무료</span>
            ) : (
              `${shippingFee.toLocaleString()}원`
            )}
          </span>
        </div>
        {subtotal > 0 && subtotal < threshold && (
          <p className="text-xs text-zinc-500">
            {threshold.toLocaleString()}원 이상 구매 시 배송비 무료입니다.
          </p>
        )}
        <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-semibold text-zinc-900">
          <span>총 결제 예정 금액</span>
          <span>{finalAmount.toLocaleString()}원</span>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-700">결제 수단</h2>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 text-sm text-zinc-600">
          <label className="flex items-center gap-2">
            <input type="radio" name="paymentMethod" defaultChecked className="h-4 w-4" />
            <span>주문 후 결제하기</span>
          </label>
          <p className="mt-1 text-xs text-zinc-500">
            주문 확정 후 주문 상세에서 결제합니다. PG 웹훅 연동 시 서버에서 자동 확정할 수 있습니다.
          </p>
        </div>
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {error}
          </p>
        )}
        <h2 className="text-sm font-semibold text-zinc-700">배송 정보</h2>
        <label className="block">
          <span className="label">수령인</span>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            required
            className="input-field"
          />
        </label>
        <label className="block">
          <span className="label">연락처</span>
          <input
            type="tel"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            required
            className="input-field"
          />
        </label>
        <label className="block">
          <span className="label">배송 주소</span>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            required
            className="input-field"
          />
        </label>
        <div className="flex gap-3 pt-2">
          <Link href="/cart" className="btn-secondary">
            취소
          </Link>
          <button type="submit" disabled={!!submitting} className="btn-primary">
            {submitting ? "주문 중..." : "주문 확정"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CheckoutContent />
    </Suspense>
  );
}
