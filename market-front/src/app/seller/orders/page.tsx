"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Order, OrderListResponse, OrderStatus } from "@/types/order";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const STATUS_OPTIONS: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "전체" },
  { value: "ORDERED", label: "주문됨" },
  { value: "PAYMENT_COMPLETE", label: "결제완료" },
  { value: "SHIPPING", label: "배송중" },
  { value: "COMPLETE", label: "완료" },
  { value: "CANCELLED", label: "취소" },
];

function OrderStatusSelect({ order, onUpdated }: { order: Order; onUpdated: () => void }) {
  const [loading, setLoading] = useState(false);
  async function change(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value as OrderStatus;
    if (status === order.status) return;
    setLoading(true);
    try {
      await api(`/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      onUpdated();
    } finally {
      setLoading(false);
    }
  }
  if (order.status === "CANCELLED") return <span className="text-zinc-500">취소됨</span>;
  return (
    <select
      value={order.status}
      onChange={change}
      disabled={loading}
      className="input-field w-auto min-w-[120px] disabled:opacity-50"
    >
      {STATUS_OPTIONS.filter((o) => o.value && o.value !== "CANCELLED").map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function SellerRefundButton({ order, onUpdated }: { order: Order; onUpdated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (order.status !== "PAYMENT_COMPLETE" && order.status !== "SHIPPING") {
    return null;
  }

  async function refund() {
    if (!confirm("이 주문을 환불 처리하시겠습니까? 결제가 취소되고 주문 상태가 취소로 변경됩니다.")) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api(`/orders/${order.id}/refund/seller`, { method: "POST" });
      setSuccess("환불 처리가 완료되었습니다.");
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "환불 처리 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={refund}
        disabled={loading}
        className="btn-secondary border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {loading ? "처리 중..." : "환불 처리"}
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-1 text-sm text-green-700">{success}</p>}
    </div>
  );
}

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<OrderListResponse | null>(null);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [size] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { page: String(page), size: String(size) };
      if (statusFilter) params.status = statusFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const res = await api<OrderListResponse>("/seller/orders", { params });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [user, page, size, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "SELLER") {
      router.push("/");
      return;
    }
    fetchOrders();
  }, [user, router, fetchOrders]);

  if (!user || user.role !== "SELLER") return null;
  if (loading && !data) return <LoadingSpinner />;

  const orders = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const currentPage = data?.page ?? 0;
  const first = data?.first ?? true;
  const last = data?.last ?? true;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="section-title">판매 주문</h1>
        <Link href="/seller/products" className="btn-secondary">
          내 상품
        </Link>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="label">상태</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as OrderStatus | "");
              setPage(0);
            }}
            className="input-field w-auto min-w-[120px]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="label">기간 (부터)</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
            className="input-field w-auto"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="label">기간 (까지)</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
            className="input-field w-auto"
          />
        </label>
      </div>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}
      {orders.length === 0 ? (
        <div className="empty-state">
          <p className="text-base">판매 주문이 없습니다.</p>
          <Link href="/seller/products" className="btn-secondary mt-4 inline-flex">
            내 상품
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-6">
            {orders.map((order) => (
              <li key={order.id} className="card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/orders/${order.id}`} className="font-medium text-zinc-900 hover:underline">
                    주문 #{order.id}
                  </Link>
                  <OrderStatusSelect order={order} onUpdated={fetchOrders} />
                </div>
                <p className="mt-1 text-zinc-600">총 {order.totalAmount.toLocaleString()}원</p>
                {order.status === "CANCELLED" && (
                  <p className="mt-1 inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                    {order.refunded ? "환불 완료" : "주문 취소 완료"}
                  </p>
                )}
                {order.recipientName && (
                  <p className="text-sm text-zinc-500">
                    {order.recipientName} / {order.recipientPhone} / {order.recipientAddress}
                  </p>
                )}
                {order.trackingNumber ? (
                  <p className="mt-2 text-sm font-medium text-zinc-700">
                    운송장: <span className="font-mono">{order.trackingNumber}</span>
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-amber-700">운송장 미입력</p>
                )}
                <ul className="mt-2 list-inside list-disc text-sm text-zinc-600">
                  {order.items.map((item, i) => (
                    <li key={i}>
                      {item.productName} x {item.quantity} - {(item.orderPrice * item.quantity).toLocaleString()}원
                    </li>
                  ))}
                </ul>
                <SellerRefundButton order={order} onUpdated={fetchOrders} />
                <Link href={`/orders/${order.id}`} className="mt-3 inline-block text-sm text-amber-700 hover:underline">
                  주문 상세 / 운송장 입력 →
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              disabled={first}
              onClick={() => setPage((x) => x - 1)}
              className="btn-secondary disabled:opacity-50"
            >
              이전
            </button>
            {Array.from({ length: Math.min(5, totalPages || 1) }, (_, i) => {
              const total = totalPages || 1;
              let pageNum: number;
              if (total <= 5) pageNum = i;
              else if (currentPage < 2) pageNum = i;
              else if (currentPage >= total - 2) pageNum = total - 5 + i;
              else pageNum = currentPage - 2 + i;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={`min-w-9 rounded-lg px-2.5 py-1.5 text-sm font-medium ${currentPage === pageNum ? "bg-zinc-900 text-white" : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"}`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              type="button"
              disabled={last}
              onClick={() => setPage((x) => x + 1)}
              className="btn-secondary disabled:opacity-50"
            >
              다음
            </button>
            <span className="ml-2 text-sm text-zinc-500">
              ({currentPage + 1} / {totalPages || 1})
            </span>
          </div>
        </>
      )}
    </div>
  );
}
