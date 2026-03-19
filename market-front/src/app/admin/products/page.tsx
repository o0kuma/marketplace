"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { PageResponse } from "@/types/common";
import type { Product, ProductStatus } from "@/types/product";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const STATUS_OPTIONS: { value: ProductStatus | ""; label: string }[] = [
  { value: "", label: "전체" },
  { value: "ON_SALE", label: "판매중" },
  { value: "SOLD_OUT", label: "품절" },
  { value: "DELETED", label: "삭제됨" },
];

export default function AdminProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<PageResponse<Product> | null>(null);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchList = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { page: String(page), size: "20", includeDeleted: "true" };
      if (keyword) params.keyword = keyword;
      if (statusFilter) params.status = statusFilter;
      if (categoryId) params.categoryId = categoryId;
      const res = await api<PageResponse<Product>>("/admin/products", { params });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [user, page, keyword, statusFilter, categoryId]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    api<{ id: number; name: string }[]>("/categories").then(setCategories).catch(() => setCategories([]));
  }, [user, router]);

  useEffect(() => {
    if (user?.role === "ADMIN") fetchList();
  }, [fetchList, user?.role]);

  async function handleStatusChange(productId: number, status: ProductStatus) {
    setUpdatingId(productId);
    setError("");
    try {
      await api(`/admin/products/${productId}/status?status=${status}`, { method: "PATCH" });
      fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태 변경 실패");
    } finally {
      setUpdatingId(null);
    }
  }

  if (!user || user.role !== "ADMIN") return null;
  if (loading && !data) return <LoadingSpinner />;

  const products = data?.content ?? [];

  return (
    <div>
      <h1 className="section-title mb-6">상품 관리</h1>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <input
          type="search"
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
          placeholder="상품명 검색"
          className="input-field w-48"
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as ProductStatus | ""); setPage(0); }} className="input-field w-auto">
          {STATUS_OPTIONS.map((o) => <option key={o.value || "all"} value={o.value}>{o.label}</option>)}
        </select>
        <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(0); }} className="input-field w-auto min-w-[100px]">
          <option value="">전체 카테고리</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}
      {products.length === 0 ? (
        <div className="empty-state"><p className="text-base">상품이 없습니다.</p></div>
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <li key={p.id} className={`card ${p.status === "DELETED" ? "opacity-75" : ""}`}>
                <Link href={`/products/${p.id}`} className="relative mb-2 block aspect-square w-full overflow-hidden rounded-lg bg-zinc-100">
                  {p.imageUrl ? <Image src={p.imageUrl} alt="" fill className="object-cover" sizes="200px" unoptimized /> : <span className="flex h-full items-center justify-center text-zinc-400 text-sm">이미지 없음</span>}
                </Link>
                <Link href={`/products/${p.id}`} className="font-medium text-zinc-900 hover:underline line-clamp-2">{p.name}</Link>
                <p className="mt-1 text-sm text-zinc-600">{p.price.toLocaleString()}원 · {p.status}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <select
                    value={p.status}
                    onChange={(e) => handleStatusChange(p.id, e.target.value as ProductStatus)}
                    disabled={updatingId === p.id}
                    className="input-field w-auto min-w-[90px] text-sm"
                  >
                    <option value="ON_SALE">판매중</option>
                    <option value="SOLD_OUT">품절</option>
                    <option value="DELETED">노출중단</option>
                  </select>
                </div>
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
