"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { AdminActionLog } from "@/types/admin";
import type { PageResponse } from "@/types/common";
import type { Product, ProductStatus } from "@/types/product";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function AdminProductDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { user } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [logs, setLogs] = useState<AdminActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (Number.isNaN(id) || !user) return;
    setLoading(true);
    setError("");
    try {
      const [p, l] = await Promise.all([
        api<Product>(`/admin/products/${id}`),
        api<PageResponse<AdminActionLog>>("/admin/action-logs", {
          params: { targetType: "PRODUCT", targetId: String(id), page: "0", size: "10" },
        }),
      ]);
      setProduct(p);
      setLogs(l.content ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "상품 상세를 불러올 수 없습니다.");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchDetail();
  }, [user, router, fetchDetail]);

  async function changeStatus(next: ProductStatus) {
    if (!product) return;
    const reason = prompt("상태 변경 사유를 입력하세요 (감사 로그 기록)");
    if (reason === null) return;
    setUpdating(true);
    setError("");
    try {
      await api(`/admin/products/${product.id}/status?status=${next}&reason=${encodeURIComponent(reason)}`, { method: "PATCH" });
      fetchDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태 변경 실패");
    } finally {
      setUpdating(false);
    }
  }

  if (!user || user.role !== "ADMIN") return null;
  if (loading && !product) return <LoadingSpinner />;
  if (error && !product) return <p className="py-8 text-red-600">{error}</p>;
  if (!product) return null;

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-zinc-600 hover:underline">← 상품 목록</Link>
      <div className="card mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="section-title m-0">상품 상세 #{product.id}</h1>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700">{product.status}</span>
        </div>
        {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        <section className="mt-6 border-t border-zinc-200 pt-4">
          <h2 className="text-sm font-semibold text-zinc-700">기본 정보</h2>
          <p className="mt-1 text-zinc-900">{product.name}</p>
          <p className="text-sm text-zinc-600">판매자: {product.sellerName} (#{product.sellerId})</p>
          <p className="text-sm text-zinc-600">가격: {product.price.toLocaleString()}원 · 재고: {product.stockQuantity.toLocaleString()}</p>
          <p className="text-sm text-zinc-600">카테고리: {product.categoryName ?? "-"}</p>
          {product.description && <p className="mt-2 text-sm text-zinc-700 whitespace-pre-wrap">{product.description}</p>}
        </section>
        {!!product.variants?.length && (
          <section className="mt-6 border-t border-zinc-200 pt-4">
            <h2 className="text-sm font-semibold text-zinc-700">옵션/재고</h2>
            <ul className="mt-2 space-y-2">
              {product.variants.map((v) => (
                <li key={v.id} className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm">
                  <p className="font-medium text-zinc-800">{v.optionSummary ?? "(단일 옵션)"}</p>
                  <p className="text-zinc-600">가격 {v.price.toLocaleString()}원 · 재고 {v.stockQuantity.toLocaleString()} · SKU {v.sku ?? "-"}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
        <div className="mt-6 flex flex-wrap gap-3 border-t border-zinc-200 pt-4">
          <button type="button" disabled={updating} onClick={() => changeStatus("ON_SALE")} className="btn-secondary disabled:opacity-50">판매중</button>
          <button type="button" disabled={updating} onClick={() => changeStatus("SOLD_OUT")} className="btn-secondary disabled:opacity-50">품절</button>
          <button type="button" disabled={updating} onClick={() => changeStatus("DELETED")} className="btn-secondary border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50">노출중단</button>
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
