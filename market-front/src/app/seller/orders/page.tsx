"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Order, OrderListResponse, OrderStatus } from "@/types/order";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const VALID_STATUSES: OrderStatus[] = [
  "ORDERED",
  "PAYMENT_COMPLETE",
  "SHIPPING",
  "COMPLETE",
  "CANCELLED",
];

function statusFromQueryParam(raw: string | null): OrderStatus | "" {
  if (!raw) return "";
  return VALID_STATUSES.includes(raw as OrderStatus) ? (raw as OrderStatus) : "";
}

type SellerOrderQueue = "PENDING" | "PENDING_SHIPMENT" | "RETURN_REQUESTED";

const VALID_QUEUES: SellerOrderQueue[] = ["PENDING", "PENDING_SHIPMENT", "RETURN_REQUESTED"];

function queueFromQueryParam(raw: string | null): SellerOrderQueue | "" {
  if (!raw) return "";
  return VALID_QUEUES.includes(raw as SellerOrderQueue) ? (raw as SellerOrderQueue) : "";
}

const STATUS_OPTIONS: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "전체" },
  { value: "ORDERED", label: "주문됨" },
  { value: "PAYMENT_COMPLETE", label: "결제완료" },
  { value: "SHIPPING", label: "배송중" },
  { value: "COMPLETE", label: "완료" },
  { value: "CANCELLED", label: "취소" },
];

const QUICK_QUEUE_OPTIONS: { value: SellerOrderQueue; label: string }[] = [
  { value: "PENDING", label: "미처리 주문" },
  { value: "PENDING_SHIPMENT", label: "출고 대기 (운송장 미입력)" },
  { value: "RETURN_REQUESTED", label: "반품·교환 요청 대기" },
];

function filterSelectValue(queueFilter: SellerOrderQueue | "", statusFilter: OrderStatus | ""): string {
  if (queueFilter) return `q:${queueFilter}`;
  if (statusFilter) return `s:${statusFilter}`;
  return "";
}

function emptyListMessage(queueFilter: SellerOrderQueue | "", statusFilter: OrderStatus | ""): string {
  if (queueFilter === "PENDING") return "미처리 주문이 없습니다.";
  if (queueFilter === "PENDING_SHIPMENT") return "출고 대기(운송장 미입력) 주문이 없습니다.";
  if (queueFilter === "RETURN_REQUESTED") return "반품·교환 요청 대기 주문이 없습니다.";
  if (statusFilter === "CANCELLED") return "취소된 주문이 없습니다.";
  if (statusFilter) return "해당 상태의 판매 주문이 없습니다.";
  return "판매 주문이 없습니다.";
}

function orderHasTracking(order: Order): boolean {
  if (order.trackingEntered === true) return true;
  if (order.trackingEntered === false) return false;
  return !!(order.trackingNumber && order.trackingNumber.trim());
}

/** Whether UI should treat this order as missing tracking (API flag or fallback). */
function needsTrackingHighlight(order: Order): boolean {
  if (order.needsTrackingInput === true) return true;
  if (order.needsTrackingInput === false) return false;
  return (
    (order.status === "PAYMENT_COMPLETE" || order.status === "SHIPPING") && !orderHasTracking(order)
  );
}

function sellerStatusOptionAllowed(order: Order, target: OrderStatus): boolean {
  if (target === "COMPLETE" && order.status !== "SHIPPING") {
    return false;
  }
  if (target === "SHIPPING" && order.status === "PAYMENT_COMPLETE" && !orderHasTracking(order)) {
    return false;
  }
  if (target === "COMPLETE" && order.status === "SHIPPING" && !orderHasTracking(order)) {
    return false;
  }
  return true;
}

function OrderStatusSelect({ order, onUpdated }: { order: Order; onUpdated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  async function change(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value as OrderStatus;
    if (status === order.status) return;
    setLocalError("");
    setLoading(true);
    try {
      await api(`/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      onUpdated();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "상태 변경 실패");
    } finally {
      setLoading(false);
    }
  }
  if (order.status === "CANCELLED") return <span className="text-zinc-500">취소됨</span>;
  return (
    <div className="min-w-0">
      <select
        value={order.status}
        onChange={change}
        disabled={loading}
        className="input-field w-auto min-w-[120px] disabled:opacity-50"
      >
        {STATUS_OPTIONS.filter((o) => o.value && o.value !== "CANCELLED")
          .filter(
            (opt) =>
              opt.value === order.status || sellerStatusOptionAllowed(order, opt.value as OrderStatus),
          )
          .map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
      </select>
      {localError && <p className="mt-1 max-w-xs text-xs text-red-600">{localError}</p>}
    </div>
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [data, setData] = useState<OrderListResponse | null>(null);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [queueFilter, setQueueFilter] = useState<SellerOrderQueue | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [size] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [urlFilterSynced, setUrlFilterSynced] = useState(false);

  const replaceListFiltersInUrl = useCallback(
    (next: { queue: SellerOrderQueue | ""; status: OrderStatus | "" }) => {
      const p = new URLSearchParams(searchParams.toString());
      p.delete("queue");
      p.delete("status");
      if (next.queue) p.set("queue", next.queue);
      if (next.status) p.set("status", next.status);
      const q = p.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { page: String(page), size: String(size) };
      if (queueFilter) params.queue = queueFilter;
      else if (statusFilter) params.status = statusFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const res = await api<OrderListResponse>("/seller/orders", { params });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [user, page, size, queueFilter, statusFilter, dateFrom, dateTo]);

  const statusQuery = searchParams.get("status");
  const queueQuery = searchParams.get("queue");
  useEffect(() => {
    const q = queueFromQueryParam(queueQuery);
    if (q) {
      setQueueFilter(q);
      setStatusFilter("");
    } else {
      setQueueFilter("");
      setStatusFilter(statusFromQueryParam(statusQuery));
    }
    setPage(0);
    setUrlFilterSynced(true);
  }, [queueQuery, statusQuery]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "SELLER") {
      router.push("/");
      return;
    }
    if (!urlFilterSynced) return;
    fetchOrders();
  }, [user, router, fetchOrders, urlFilterSynced]);

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
        <label className="flex min-w-0 max-w-full flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <span className="label shrink-0">보기</span>
          <select
            value={filterSelectValue(queueFilter, statusFilter)}
            onChange={(e) => {
              const v = e.target.value;
              setPage(0);
              if (v === "") {
                setQueueFilter("");
                setStatusFilter("");
                replaceListFiltersInUrl({ queue: "", status: "" });
              } else if (v.startsWith("q:")) {
                const q = v.slice(2) as SellerOrderQueue;
                setQueueFilter(q);
                setStatusFilter("");
                replaceListFiltersInUrl({ queue: q, status: "" });
              } else if (v.startsWith("s:")) {
                const s = v.slice(2) as OrderStatus;
                setQueueFilter("");
                setStatusFilter(s);
                replaceListFiltersInUrl({ queue: "", status: s });
              }
            }}
            className="input-field w-full min-w-[200px] max-w-md sm:w-auto"
          >
            <option value="">전체</option>
            <optgroup label="빠른 보기 (대시보드)">
              {QUICK_QUEUE_OPTIONS.map((opt) => (
                <option key={opt.value} value={`q:${opt.value}`}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="주문 상태">
              {STATUS_OPTIONS.filter((o) => o.value).map((opt) => (
                <option key={opt.value} value={`s:${opt.value}`}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
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
          <p className="text-base">{emptyListMessage(queueFilter, statusFilter)}</p>
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
                {orderHasTracking(order) ? (
                  <p className="mt-2 text-sm font-medium text-zinc-700">
                    운송장: <span className="font-mono">{order.trackingNumber}</span>
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-amber-700">
                    운송장 미입력
                    {needsTrackingHighlight(order) && (
                      <span className="ml-1 text-xs">· 주문 상세에서 번호 저장 후 상태 변경</span>
                    )}
                  </p>
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
