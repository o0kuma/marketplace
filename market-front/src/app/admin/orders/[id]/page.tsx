"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { AdminActionLog } from "@/types/admin";
import type { PageResponse } from "@/types/common";
import type { Order } from "@/types/order";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const statusLabel: Record<string, string> = {
  ORDERED: "주문완료",
  PAYMENT_COMPLETE: "결제완료",
  SHIPPING: "배송중",
  COMPLETE: "배송완료",
  CANCELLED: "취소",
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { user } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refunding, setRefunding] = useState(false);
  const [logs, setLogs] = useState<AdminActionLog[]>([]);

  const fetchOrder = useCallback(async () => {
    if (Number.isNaN(id) || !user) return;
    setLoading(true);
    setError("");
    try {
      const [o, l] = await Promise.all([
        api<Order>(`/admin/orders/${id}`),
        api<PageResponse<AdminActionLog>>("/admin/action-logs", {
          params: { targetType: "ORDER", targetId: String(id), page: "0", size: "10" },
        }),
      ]);
      setOrder(o);
      setLogs(l.content ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "주문을 불러올 수 없습니다.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchOrder();
  }, [user, router, fetchOrder]);

  async function handleRefund() {
    if (!order || !confirm("이 주문을 환불 처리하시겠습니까?")) return;
    const reason = prompt("환불 처리 사유를 입력하세요 (감사 로그 기록)");
    if (reason === null) return;
    setRefunding(true);
    setError("");
    try {
      await api(`/admin/orders/${order.id}/refund?reason=${encodeURIComponent(reason)}`, { method: "POST" });
      fetchOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "환불 처리 실패");
    } finally {
      setRefunding(false);
    }
  }

  if (!user || user.role !== "ADMIN") return null;
  if (loading && !order) return <LoadingSpinner />;
  if (error && !order) return <p className="py-8 text-red-600">{error}</p>;
  if (!order) return null;

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-zinc-600 hover:underline">← 주문 목록</Link>
      <div className="card mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="section-title m-0">주문 상세 #{order.id}</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${
            order.status === "COMPLETE" ? "bg-green-100 text-green-800" :
            order.status === "CANCELLED" ? "bg-red-100 text-red-800" : "bg-zinc-100 text-zinc-700"
          }`}>
            {statusLabel[order.status] ?? order.status}
          </span>
        </div>
        {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        <section className="mt-6 border-t border-zinc-200 pt-4">
          <h2 className="text-sm font-semibold text-zinc-700">수령인·배송지</h2>
          <p className="mt-1 text-zinc-600">{order.recipientName ?? "-"}</p>
          <p className="text-sm text-zinc-600">{order.recipientPhone ?? "-"}</p>
          <p className="text-sm text-zinc-600">{order.recipientAddress ?? "-"}</p>
          {order.trackingNumber && <p className="mt-1 text-sm text-zinc-600">운송장: {order.trackingNumber}</p>}
        </section>
        <section className="mt-6 border-t border-zinc-200 pt-4">
          <h2 className="text-sm font-semibold text-zinc-700">주문 상품</h2>
          <ul className="mt-2 space-y-2">
            {order.items.map((item, i) => (
              <li key={i} className="flex flex-wrap justify-between gap-2 text-sm">
                <Link href={`/products/${item.productId}`} className="text-zinc-900 hover:underline">{item.productName}</Link>
                <span className="text-zinc-600">{item.quantity}개 × {item.orderPrice.toLocaleString()}원 = {(item.orderPrice * item.quantity).toLocaleString()}원</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-lg font-semibold text-zinc-900">총 결제 금액 {order.totalAmount.toLocaleString()}원</p>
        </section>
        <div className="mt-6 flex flex-wrap gap-3 border-t border-zinc-200 pt-4">
          {(order.status === "PAYMENT_COMPLETE" || order.status === "SHIPPING") && (
            <button type="button" onClick={handleRefund} disabled={refunding} className="btn-secondary border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-50">
              {refunding ? "처리 중..." : "환불 처리"}
            </button>
          )}
          <Link href="/admin/orders" className="btn-secondary">목록</Link>
        </div>
      </div>
      <div className="card mt-6">
        <h2 className="text-sm font-semibold text-zinc-700">관리자 액션 로그</h2>
        {logs.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">기록이 없습니다.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {logs.map((log) => (
              <li key={log.id} className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm">
                <p className="font-medium text-zinc-800">{log.actionType}</p>
                <p className="text-zinc-600">{new Date(log.createdAt).toLocaleString()} · admin #{log.adminId}</p>
                {log.reason && <p className="text-zinc-700">사유: {log.reason}</p>}
                {log.details && <p className="text-zinc-500">{log.details}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
