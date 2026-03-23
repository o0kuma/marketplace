"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Product, ProductListResponse, ProductStatus } from "@/types/product";
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

function statusLabel(s: ProductStatus): string {
  const o = STATUS_OPTIONS.find((x) => x.value === s);
  return o?.label ?? s;
}

type ViewMode = "table" | "card";
type SortKey = "name" | "price" | "stock" | "status";

export default function SellerProductsPage() {
  const PREF_KEY = "seller-products-list-prefs-v1";
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ProductListResponse | null>(null);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "">("");
  const [size, setSize] = useState(24);
  const [keyword, setKeyword] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<ProductStatus>("ON_SALE");
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchList = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {
        page: String(page),
        size: String(size),
      };
      if (statusFilter) params.status = statusFilter;
      const res = await api<ProductListResponse>("/seller/products", { params });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [user, page, size, statusFilter]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "SELLER") {
      router.push("/");
      return;
    }
    try {
      const raw = localStorage.getItem(PREF_KEY);
      if (raw) {
        const p = JSON.parse(raw) as {
          viewMode?: ViewMode;
          sortKey?: SortKey;
          sortDir?: "asc" | "desc";
          keyword?: string;
          size?: number;
        };
        if (p.viewMode === "table" || p.viewMode === "card") setViewMode(p.viewMode);
        if (p.sortKey) setSortKey(p.sortKey);
        if (p.sortDir === "asc" || p.sortDir === "desc") setSortDir(p.sortDir);
        if (typeof p.keyword === "string") setKeyword(p.keyword);
        if (typeof p.size === "number" && [12, 24, 48].includes(p.size)) setSize(p.size);
      }
    } catch {
      // ignore parse errors
    }
    fetchList();
  }, [user, router, fetchList, PREF_KEY]);

  useEffect(() => {
    localStorage.setItem(PREF_KEY, JSON.stringify({ viewMode, sortKey, sortDir, keyword, size }));
  }, [PREF_KEY, viewMode, sortKey, sortDir, keyword, size]);

  async function handleDelete(productId: number) {
    if (!confirm("이 상품을 삭제하시겠습니까? (삭제된 상품은 목록에서 '삭제됨' 상태로 보입니다.)")) return;
    setDeletingId(productId);
    setError("");
    try {
      await api(`/products/${productId}`, { method: "DELETE" });
      fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setDeletingId(null);
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const canSelect = sortedProducts.filter((p) => p.status !== "DELETED");
    if (selectedIds.size >= canSelect.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(canSelect.map((p) => p.id)));
    }
  }

  function cycleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
      return;
    }
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
  }

  function sortIndicator(key: SortKey): string {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  }

  async function handleBulkStatusChange() {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    setError("");
    try {
      await api("/seller/products/status", {
        method: "PATCH",
        body: JSON.stringify({ productIds: Array.from(selectedIds), status: bulkStatus }),
      });
      setSelectedIds(new Set());
      fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "일괄 상태 변경 실패");
    } finally {
      setBulkLoading(false);
    }
  }

  function exportSelectedCsv() {
    if (selectedIds.size === 0) return;
    const selectedRows = sortedProducts.filter((p) => selectedIds.has(p.id));
    const rows = [["id", "name", "status", "price", "stockQuantity", "categoryName"]].concat(
      selectedRows.map((p) => [
        String(p.id),
        p.name,
        p.status,
        String(p.price),
        String(p.stockQuantity),
        p.categoryName ?? "",
      ])
    );
    const esc = (v: string) =>
      `"${v.replace(/"/g, '""').replace(/\r\n|\r|\n/g, " ")}"`;
    const csv = "\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seller-products-selected-${selectedRows.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!user || user.role !== "SELLER") return null;
  if (loading && !data) return <LoadingSpinner />;

  const myProducts = data?.content ?? [];
  const filteredProducts = myProducts.filter((p) => {
    const q = keyword.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || (p.categoryName ?? "").toLowerCase().includes(q);
  });
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "name") cmp = a.name.localeCompare(b.name);
    else if (sortKey === "price") cmp = a.price - b.price;
    else if (sortKey === "stock") cmp = a.stockQuantity - b.stockQuantity;
    else cmp = a.status.localeCompare(b.status);
    return sortDir === "asc" ? cmp : -cmp;
  });
  const totalPages = data?.totalPages ?? 0;
  const currentPage = data?.page ?? 0;
  const first = data?.first ?? true;
  const last = data?.last ?? true;
  const selectableProducts = sortedProducts.filter((p) => p.status !== "DELETED");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="section-title">내 상품</h1>
        <Link href="/seller/products/new" className="btn-primary">
          상품 등록
        </Link>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="label">상태</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ProductStatus | "");
              setPage(0);
            }}
            className="input-field w-auto min-w-[100px]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="label">검색</span>
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="상품명/카테고리"
            className="input-field w-52"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="label">페이지당</span>
          <select
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(0);
            }}
            className="input-field w-auto min-w-[80px]"
          >
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={48}>48</option>
          </select>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`btn-secondary text-sm ${viewMode === "table" ? "bg-zinc-900 text-white hover:bg-zinc-800" : ""}`}
          >
            테이블
          </button>
          <button
            type="button"
            onClick={() => setViewMode("card")}
            className={`btn-secondary text-sm ${viewMode === "card" ? "bg-zinc-900 text-white hover:bg-zinc-800" : ""}`}
          >
            카드
          </button>
        </div>
        {selectableProducts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-l border-zinc-200 pl-4">
            <span className="text-sm text-zinc-600">일괄 상태 변경</span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as ProductStatus)}
              className="input-field w-auto min-w-[90px]"
            >
              <option value="ON_SALE">판매중</option>
              <option value="SOLD_OUT">품절</option>
            </select>
            <button
              type="button"
              onClick={handleBulkStatusChange}
              disabled={selectedIds.size === 0 || bulkLoading}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              {bulkLoading ? "처리 중..." : `선택 (${selectedIds.size}) 적용`}
            </button>
            <button
              type="button"
              onClick={exportSelectedCsv}
              disabled={selectedIds.size === 0}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              선택 CSV
            </button>
          </div>
        )}
      </div>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}
      {sortedProducts.length === 0 ? (
        <div className="empty-state">
          <p className="text-base">등록한 상품이 없습니다.</p>
          <Link href="/seller/products/new" className="btn-primary mt-4 inline-flex">
            상품 등록
          </Link>
        </div>
      ) : (
        <>
          {viewMode === "table" ? (
            <div className="overflow-auto rounded-xl border border-zinc-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-50 text-zinc-600">
                  <tr>
                    <th className="px-3 py-2 text-left">
                      <input
                        type="checkbox"
                        checked={selectableProducts.length > 0 && selectedIds.size >= selectableProducts.length}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-zinc-300"
                      />
                    </th>
                    <th className="px-3 py-2 text-left">
                      <button type="button" onClick={() => cycleSort("name")} className="font-medium hover:text-zinc-900">
                        상품명{sortIndicator("name")}
                      </button>
                    </th>
                    <th className="px-3 py-2 text-right">
                      <button type="button" onClick={() => cycleSort("price")} className="font-medium hover:text-zinc-900">
                        가격{sortIndicator("price")}
                      </button>
                    </th>
                    <th className="px-3 py-2 text-right">
                      <button type="button" onClick={() => cycleSort("stock")} className="font-medium hover:text-zinc-900">
                        재고{sortIndicator("stock")}
                      </button>
                    </th>
                    <th className="px-3 py-2 text-left">
                      <button type="button" onClick={() => cycleSort("status")} className="font-medium hover:text-zinc-900">
                        상태{sortIndicator("status")}
                      </button>
                    </th>
                    <th className="px-3 py-2 text-left">카테고리</th>
                    <th className="px-3 py-2 text-left">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((p) => (
                    <tr key={p.id} className="border-t border-zinc-100">
                      <td className="px-3 py-2">
                        {p.status !== "DELETED" && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            className="h-4 w-4 rounded border-zinc-300"
                          />
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Link href={`/products/${p.id}`} className="font-medium text-zinc-900 hover:underline">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-right text-zinc-700">{p.price.toLocaleString()}원</td>
                      <td className={`px-3 py-2 text-right ${p.stockQuantity < 5 ? "font-semibold text-red-600" : "text-zinc-700"}`}>
                        {p.stockQuantity.toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <span className={p.status === "ON_SALE" ? "text-green-700" : p.status === "SOLD_OUT" ? "text-amber-700" : "text-zinc-400"}>
                          {statusLabel(p.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-zinc-600">{p.categoryName ?? "-"}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/seller/products/${p.id}/edit`} className="btn-secondary inline-flex text-sm">수정</Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id)}
                            disabled={deletingId === p.id}
                            className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId === p.id ? "삭제 중..." : "삭제"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sortedProducts.map((p) => (
                <li key={p.id} className="card">
                  {p.status !== "DELETED" && (
                    <label className="mb-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="h-4 w-4 rounded border-zinc-300"
                      />
                      <span className="text-sm text-zinc-600">선택</span>
                    </label>
                  )}
                  <Link href={`/products/${p.id}`} className="relative mb-3 block aspect-square w-full overflow-hidden rounded-lg bg-zinc-100">
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        unoptimized
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
                        이미지 없음
                      </span>
                    )}
                  </Link>
                  <Link href={`/products/${p.id}`} className="font-medium text-zinc-900 hover:underline line-clamp-2">
                    {p.name}
                  </Link>
                  <p className="mt-2 text-lg font-medium text-zinc-700">{p.price.toLocaleString()}원</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    재고 {p.stockQuantity}개 · <span className={p.status === "ON_SALE" ? "text-green-600" : p.status === "SOLD_OUT" ? "text-amber-600" : "text-zinc-400"}>{statusLabel(p.status)}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/seller/products/${p.id}/edit`} className="btn-secondary inline-flex text-sm">
                      수정
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === p.id ? "삭제 중..." : "삭제"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
