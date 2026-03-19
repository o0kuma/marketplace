"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Order, OrderListResponse, OrderStatus } from "@/types/order";
import type { PageResponse } from "@/types/common";
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

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<PageResponse<Order> | null>(null);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchList = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { page: String(page), size: "20" };
      if (statusFilter) params.status = statusFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const res = await api<PageResponse<Order>>("/admin/orders", { params });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [user, page, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchList();
  }, [user, router, fetchList]);

  if (!user || user.role !== "ADMIN") return null;
  if (loading && !data) return <LoadingSpinner />;

  const orders = data?.content ?? [];

  return (
    <div>
      <h1 className="section-title mb-6">주문 관리</h1>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as OrderStatus | ""); setPage(0); }} className="input-field w-auto min-w-[100px]">
          {STATUS_OPTIONS.map((o) => <option key={o.value || "all"} value={o.value}>{o.label}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} className="input-field w-auto" />
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }} className="input-field w-auto" />
      </div>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}
      {orders.length === 0 ? (
        <div className="empty-state"><p className="text-base">주문이 없습니다.</p></div>
      ) : (
        <>
          <ul className="space-y-4">
            {orders.map((order) => (
              <li key={order.id} className="card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/admin/orders/${order.id}`} className="font-medium text-zinc-900 hover:underline">
                    주문 #{order.id}
                  </Link>
                  <span className="text-sm text-zinc-500">{order.status}</span>
                </div>
                <p className="mt-1 text-zinc-600">총 {order.totalAmount.toLocaleString()}원</p>
                {order.recipientName && <p className="text-sm text-zinc-500">{order.recipientName} · {order.recipientAddress}</p>}
                <Link href={`/admin/orders/${order.id}`} className="mt-2 inline-block text-sm text-slate-600 hover:underline">상세 보기 →</Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button type="button" disabled={data?.first} onClick={() => setPage((p) => p - 1)} className="btn-secondary disabled:opacity-50">이전</button>
            <span className="text-sm text-zinc-600">{(data?.page ?? 0) + 1} / {data?.totalPages ?? 1}</span>
            <button type="button" disabled={data?.last} onClick={() => setPage((p) => p + 1)} className="btn-secondary disabled:opacity-50">다음</button>
          </div>
        </>
      )}
      <p className="mt-6"><Link href="/admin" className="btn-secondary inline-flex">대시보드</Link></p>
    </div>
  );
}
