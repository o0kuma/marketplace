"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Order, OrderListResponse } from "@/types/order";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function CancelOrderButton({ orderId, onCancelled }: { orderId: number; onCancelled: () => void }) {
  const [loading, setLoading] = useState(false);
  async function cancel() {
    setLoading(true);
    try {
      await api(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      onCancelled();
    } finally {
      setLoading(false);
    }
  }
  return (
    <button type="button" onClick={cancel} disabled={loading} className="btn-secondary border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50">
      {loading ? "취소 중..." : "주문 취소"}
    </button>
  );
}

function PayOrderButton({ orderId, totalAmount, onPaid }: { orderId: number; totalAmount: number; onPaid: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function pay() {
    setLoading(true);
    setError("");
    try {
      await api(`/orders/${orderId}/pay`, {
        method: "POST",
        body: JSON.stringify({ amount: totalAmount }),
      });
      onPaid();
    } catch (err) {
      setError(err instanceof Error ? err.message : "결제 실패");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div>
      <button type="button" onClick={pay} disabled={loading} className="btn-primary">
        {loading ? "결제 중..." : "결제하기"}
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<OrderListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await api<OrderListResponse>("/orders", {
        params: { page: "0", size: "20" },
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchOrders();
  }, [user, router, fetchOrders]);

  if (!user) return null;
  if (loading && !data) return <LoadingSpinner />;
  if (error && !data) {
    return (
      <div className="empty-state">
        <p className="text-base text-red-600">{error}</p>
        <button type="button" onClick={() => fetchOrders()} className="btn-primary mt-4">
          다시 시도
        </button>
      </div>
    );
  }

  const orders = data?.content ?? [];

  const statusLabel: Record<string, string> = {
    ORDERED: "주문완료",
    PAYMENT_COMPLETE: "결제완료",
    SHIPPING: "배송중",
    COMPLETE: "배송완료",
    CANCELLED: "취소",
  };

  return (
    <div>
      <h1 className="section-title mb-6">주문 내역</h1>
      {orders.length === 0 ? (
        <div className="empty-state">
        <p className="text-base">주문 내역이 없습니다.</p>
        <Link href="/products" className="btn-primary mt-4 inline-flex">상품 둘러보기</Link>
      </div>
      ) : (
        <ul className="space-y-6">
          {orders.map((order) => (
            <li key={order.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-900">주문 #{order.id}</span>
                  <Link href={`/orders/${order.id}`} className="text-sm text-zinc-500 underline hover:text-zinc-900">
                    상세보기
                  </Link>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                  order.status === "COMPLETE" ? "bg-green-100 text-green-800" :
                  order.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                  "bg-zinc-100 text-zinc-700"
                }`}>
                  {statusLabel[order.status] ?? order.status}
                </span>
              </div>
              <p className="mt-3 text-lg font-medium text-zinc-700">총 {order.totalAmount.toLocaleString()}원</p>
              {order.recipientName && (
                <p className="mt-1 text-sm text-zinc-500">
                  {order.recipientName} · {order.recipientPhone} · {order.recipientAddress}
                </p>
              )}
              <ul className="mt-3 list-inside list-disc text-sm text-zinc-600">
                {order.items.map((item, i) => (
                  <li key={i}>
                    <Link href={`/products/${item.productId}`} className="text-zinc-900 hover:underline">
                      {item.productName}
                    </Link>{" "}
                    x {item.quantity} - {(item.orderPrice * item.quantity).toLocaleString()}원
                  </li>
                ))}
              </ul>
              {order.status === "ORDERED" && (
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-4">
                  <PayOrderButton orderId={order.id} totalAmount={order.totalAmount} onPaid={fetchOrders} />
                  <CancelOrderButton orderId={order.id} onCancelled={fetchOrders} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
