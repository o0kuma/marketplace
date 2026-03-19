"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Order, OrderStatus } from "@/types/order";
import type { ReturnRequest as ReturnRequestType } from "@/types/returnRequest";
import { loadTossPayments } from "@tosspayments/payment-sdk";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type PaymentConfig = { useToss: boolean; clientKey: string | null };

const statusLabel: Record<string, string> = {
  ORDERED: "주문완료",
  PAYMENT_COMPLETE: "결제완료",
  SHIPPING: "배송중",
  COMPLETE: "배송완료",
  CANCELLED: "취소",
};

function sellerNextOptions(status: OrderStatus): { value: OrderStatus; label: string }[] {
  if (status === "PAYMENT_COMPLETE") return [{ value: "SHIPPING", label: "배송중으로" }];
  if (status === "SHIPPING") return [{ value: "COMPLETE", label: "배송완료" }];
  return [];
}

function SellerStatusSelect({ order, onUpdated }: { order: Order; onUpdated: () => void }) {
  const [loading, setLoading] = useState(false);
  const nextOpts = sellerNextOptions(order.status);
  async function applyStatus(status: OrderStatus) {
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
  if (order.status === "ORDERED") {
    return (
      <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
        구매자 결제 완료 후 배송 처리를 시작할 수 있습니다.
      </p>
    );
  }
  if (nextOpts.length === 0) {
    return null;
  }
  return (
    <label className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-zinc-700">다음 단계</span>
      <select
        defaultValue=""
        onChange={(e) => {
          const v = e.target.value as OrderStatus;
          if (!v) return;
          void applyStatus(v);
          e.target.value = "";
        }}
        disabled={loading}
        className="input-field w-auto min-w-[140px] disabled:opacity-50"
      >
        <option value="">선택…</option>
        {nextOpts.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { user } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingSaving, setTrackingSaving] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [returnRequests, setReturnRequests] = useState<ReturnRequestType[]>([]);
  const [returnModalType, setReturnModalType] = useState<"RETURN" | "EXCHANGE" | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  useEffect(() => {
    api<{ useToss: boolean; clientKey: string | null }>("/config/payment")
      .then((res) => setPaymentConfig({ useToss: res.useToss, clientKey: res.clientKey ?? null }))
      .catch(() => setPaymentConfig({ useToss: false, clientKey: null }));
  }, []);

  const fetchOrder = useCallback(async () => {
    if (Number.isNaN(id) || !user) return;
    setLoading(true);
    setError("");
    try {
      const o = await api<Order>(`/orders/${id}`);
      setOrder(o);
    } catch (err) {
      setError(err instanceof Error ? err.message : "주문을 불러올 수 없습니다.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/orders");
      return;
    }
    fetchOrder();
  }, [user, router, fetchOrder]);

  useEffect(() => {
    if (order) setTrackingInput(order.trackingNumber ?? "");
  }, [order?.id, order?.trackingNumber]);

  const fetchReturnRequests = useCallback(async () => {
    if (Number.isNaN(id) || !user) return;
    try {
      const list = await api<ReturnRequestType[]>(`/orders/${id}/return-requests`);
      setReturnRequests(list);
    } catch {
      setReturnRequests([]);
    }
  }, [id, user]);

  useEffect(() => {
    if (order && user) fetchReturnRequests();
  }, [order?.id, user, fetchReturnRequests]);

  async function handleCancel() {
    if (!order || order.status !== "ORDERED") return;
    if (!confirm("주문을 취소하시겠습니까?")) return;
    setError("");
    try {
      await api(`/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      fetchOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "취소 실패");
    }
  }

  async function handlePay() {
    if (!order || order.status !== "ORDERED") return;
    setError("");
    const useToss = paymentConfig?.useToss && paymentConfig?.clientKey;
    try {
      if (useToss) {
        const tossPayments = await loadTossPayments(paymentConfig!.clientKey!);
        const tossOrderId = `order-${order.id}`;
        const result = await tossPayments.requestPayment("카드", {
          amount: order.totalAmount,
          orderId: tossOrderId,
          orderName: `주문 #${order.id}`,
        });
        if (result && "paymentKey" in result && "orderId" in result && "amount" in result) {
          await api(`/orders/${order.id}/pay/confirm`, {
            method: "POST",
            body: JSON.stringify({
              paymentKey: result.paymentKey,
              orderId: result.orderId,
              amount: result.amount,
            }),
          });
        } else {
          setError("결제가 완료되지 않았습니다.");
          return;
        }
      } else {
        await api(`/orders/${order.id}/pay`, {
          method: "POST",
          body: JSON.stringify({ amount: order.totalAmount }),
        });
      }
      fetchOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "결제 실패");
    }
  }

  async function handleRefund() {
    if (!order || (order.status !== "PAYMENT_COMPLETE" && order.status !== "SHIPPING")) return;
    if (!confirm("환불 요청하시겠습니까?")) return;
    setError("");
    try {
      await api(`/orders/${order.id}/refund`, { method: "POST" });
      fetchOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "환불 실패");
    }
  }

  const canRequestReturn = order && !["ORDERED", "CANCELLED"].includes(order.status);
  function openReturnModal(type: "RETURN" | "EXCHANGE") {
    setReturnModalType(type);
    setReturnReason("");
  }
  function closeReturnModal() {
    setReturnModalType(null);
    setReturnReason("");
  }
  async function submitReturnRequest() {
    if (!order || !returnModalType) return;
    const reason = returnReason.trim() || "사유 없음";
    setReturnSubmitting(true);
    setError("");
    try {
      await api(`/orders/${order.id}/return-requests`, {
        method: "POST",
        body: JSON.stringify({ type: returnModalType, reason }),
      });
      closeReturnModal();
      fetchReturnRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "요청 실패");
    } finally {
      setReturnSubmitting(false);
    }
  }

  async function handleReturnRequestUpdate(returnRequestId: number, status: "APPROVED" | "REJECTED", sellerComment?: string) {
    if (!order) return;
    setError("");
    try {
      await api(`/orders/${order.id}/return-requests/${returnRequestId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, sellerComment: sellerComment ?? "" }),
      });
      fetchReturnRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "처리 실패");
    }
  }

  const isSellerView = user?.role === "SELLER" && order && order.buyerId !== user?.id;

  if (!user) return null;
  if (loading && !order) return <LoadingSpinner />;
  if (error && !order) return <p className="py-8 text-red-600">{error}</p>;
  if (!order) return null;

  return (
    <div>
      {/* Return/Exchange request modal */}
      {returnModalType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && closeReturnModal()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="return-modal-title"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="return-modal-title" className="text-lg font-semibold text-zinc-900">
              {returnModalType === "RETURN" ? "반품 요청" : "교환 요청"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {returnModalType === "RETURN"
                ? "반품 사유를 입력해 주세요. 판매자 검토 후 처리됩니다."
                : "교환 사유를 입력해 주세요. 판매자 검토 후 처리됩니다."}
            </p>
            <label className="mt-4 block">
              <span className="label">사유</span>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="예: 상품 불량, 사이즈 불일치, 단순 변심 등"
                rows={4}
                className="input-field mt-1 w-full resize-y"
                autoFocus
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeReturnModal}
                disabled={returnSubmitting}
                className="btn-secondary disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={submitReturnRequest}
                disabled={returnSubmitting}
                className="btn-primary disabled:opacity-50"
              >
                {returnSubmitting ? "요청 중…" : "요청하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isSellerView ? (
        <Link href="/seller/orders" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          ← 판매 주문 목록
        </Link>
      ) : (
        <Link href="/orders" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          ← 주문 목록
        </Link>
      )}
      <div className="card mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="section-title m-0">주문 상세 #{order.id}</h1>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              order.status === "COMPLETE"
                ? "bg-green-100 text-green-800"
                : order.status === "CANCELLED"
                  ? "bg-red-100 text-red-800"
                  : "bg-zinc-100 text-zinc-700"
            }`}
          >
            {statusLabel[order.status] ?? order.status}
          </span>
        </div>
        {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        <section className="mt-6 border-t border-zinc-200 pt-4">
          <h2 className="text-sm font-semibold text-zinc-700">배송 정보</h2>
          <p className="mt-1 text-zinc-600">{order.recipientName ?? "-"}</p>
          <p className="text-sm text-zinc-600">{order.recipientPhone ?? "-"}</p>
          <p className="text-sm text-zinc-600">{order.recipientAddress ?? "-"}</p>
          {isSellerView && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-zinc-700">운송장 번호</span>
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                placeholder="운송장 번호 입력"
                className="input-field w-48"
              />
              <button
                type="button"
                disabled={trackingSaving}
                onClick={async () => {
                  setTrackingSaving(true);
                  setError("");
                  try {
                    await api(`/orders/${order.id}/tracking`, {
                      method: "PATCH",
                      body: JSON.stringify({ trackingNumber: trackingInput.trim() || null }),
                    });
                    fetchOrder();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "운송장 저장 실패");
                  } finally {
                    setTrackingSaving(false);
                  }
                }}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                {trackingSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          )}
        </section>
        <section className="mt-6 border-t border-zinc-200 pt-4">
          <h2 className="text-sm font-semibold text-zinc-700">주문 상품</h2>
          <ul className="mt-2 space-y-2">
            {order.items.map((item, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <Link href={`/products/${item.productId}`} className="font-medium text-zinc-900 hover:underline">
                  {item.productName}
                </Link>
                <span className="text-zinc-600">
                  {item.quantity}개 × {item.orderPrice.toLocaleString()}원 = {(item.orderPrice * item.quantity).toLocaleString()}원
                </span>
              </li>
            ))}
          </ul>
          {(order.shippingFee != null && order.shippingFee > 0) || order.subtotalAmount != null ? (
            <div className="mt-3 space-y-1 text-sm text-zinc-600">
              {order.subtotalAmount != null && (
                <p className="flex justify-between">
                  <span>상품 금액</span>
                  <span>{order.subtotalAmount.toLocaleString()}원</span>
                </p>
              )}
              {order.shippingFee != null && (
                <p className="flex justify-between">
                  <span>배송비</span>
                  <span>{order.shippingFee === 0 ? "무료" : `${order.shippingFee.toLocaleString()}원`}</span>
                </p>
              )}
            </div>
          ) : null}
          <p className="mt-2 text-lg font-semibold text-zinc-900">총 결제 금액 {order.totalAmount.toLocaleString()}원</p>
        </section>
        <section className="mt-6 border-t border-zinc-200 pt-4">
          <h2 className="text-sm font-semibold text-zinc-700">반품/교환 요청</h2>
          {returnRequests.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {returnRequests.map((rr) => (
                <li key={rr.id} className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm">
                  <span className="font-medium">{rr.type === "RETURN" ? "반품" : "교환"}</span>
                  {" · "}
                  <span className={rr.status === "REQUESTED" ? "text-amber-700" : rr.status === "APPROVED" ? "text-green-700" : rr.status === "REJECTED" ? "text-red-700" : "text-zinc-600"}>
                    {rr.status === "REQUESTED" ? "요청됨" : rr.status === "APPROVED" ? "승인" : rr.status === "REJECTED" ? "거절" : "처리완료"}
                  </span>
                  {rr.reason && <p className="mt-1 text-zinc-600">사유: {rr.reason}</p>}
                  {rr.sellerComment && <p className="mt-1 text-zinc-500">판매자 메모: {rr.sellerComment}</p>}
                  {isSellerView && rr.status === "REQUESTED" && (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleReturnRequestUpdate(rr.id, "APPROVED")}
                        className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                      >
                        승인
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReturnRequestUpdate(rr.id, "REJECTED")}
                        className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                      >
                        거절
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-zinc-500">반품/교환 요청 내역이 없습니다.</p>
          )}
          {!isSellerView && canRequestReturn && (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => openReturnModal("RETURN")}
                className="btn-secondary text-sm"
              >
                반품 요청
              </button>
              <button
                type="button"
                onClick={() => openReturnModal("EXCHANGE")}
                className="btn-secondary text-sm"
              >
                교환 요청
              </button>
            </div>
          )}
        </section>
        <div className="mt-6 flex flex-wrap gap-3 border-t border-zinc-200 pt-4">
          {isSellerView ? (
            <>
              {order.status !== "CANCELLED" && order.status !== "COMPLETE" && (
                <SellerStatusSelect order={order} onUpdated={fetchOrder} />
              )}
              <Link href="/seller/orders" className="btn-secondary">
                판매 주문 목록
              </Link>
            </>
          ) : (
            <>
              {order.status === "ORDERED" && (
                <>
                  <button type="button" onClick={handlePay} className="btn-primary">
                    결제하기
                  </button>
                  <button type="button" onClick={handleCancel} className="btn-secondary border-red-200 text-red-600 hover:bg-red-50">
                    주문 취소
                  </button>
                </>
              )}
              {(order.status === "PAYMENT_COMPLETE" || order.status === "SHIPPING") && (
                <button type="button" onClick={handleRefund} className="btn-secondary border-amber-200 text-amber-700 hover:bg-amber-50">
                  환불 요청
                </button>
              )}
              <Link href="/orders" className="btn-secondary">
                목록으로
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
