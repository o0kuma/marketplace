"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { PageResponse } from "@/types/common";
import type { Product, ProductStatus } from "@/types/product";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const STATUS_OPTIONS: { value: ProductStatus | ""; label: string }[] = [
  { value: "", label: "전체" },
  { value: "ON_SALE", label: "판매중" },
  { value: "SOLD_OUT", label: "품절" },
  { value: "DELETED", label: "삭제됨" },
];

interface SellerSuggestItem {
  id: number;
  name: string;
  email: string;
}

export default function AdminProductsPage() {
  const FILTER_KEY = "admin-products-filters-v2";
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
  const [selected, setSelected] = useState<number[]>([]);
  const [sellerIdFilter, setSellerIdFilter] = useState("");
  const [selectedSellerLabel, setSelectedSellerLabel] = useState("");
  const [sellerSearchInput, setSellerSearchInput] = useState("");
  const [sellerSuggestions, setSellerSuggestions] = useState<SellerSuggestItem[]>([]);
  const [sellerSuggestOpen, setSellerSuggestOpen] = useState(false);
  const sellerSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sellerPickerRef = useRef<HTMLDivElement>(null);

  const fetchList = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { page: String(page), size: "20", includeDeleted: "true" };
      if (keyword) params.keyword = keyword;
      if (statusFilter) params.status = statusFilter;
      if (categoryId) params.categoryId = categoryId;
      if (/^\d+$/.test(sellerIdFilter.trim())) params.sellerId = sellerIdFilter.trim();
      const res = await api<PageResponse<Product>>("/admin/products", { params });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [user, page, keyword, statusFilter, categoryId, sellerIdFilter]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    try {
      const raw = localStorage.getItem(FILTER_KEY);
      if (raw) {
        const p = JSON.parse(raw) as {
          keyword?: string;
          status?: ProductStatus | "";
          categoryId?: string;
          sellerId?: string;
          sellerLabel?: string;
        };
        if (typeof p.keyword === "string") setKeyword(p.keyword);
        if (typeof p.status === "string") setStatusFilter(p.status as ProductStatus | "");
        if (typeof p.categoryId === "string") setCategoryId(p.categoryId);
        if (typeof p.sellerId === "string" && /^\d+$/.test(p.sellerId)) setSellerIdFilter(p.sellerId);
        if (typeof p.sellerLabel === "string") setSelectedSellerLabel(p.sellerLabel);
      }
    } catch {}
    api<{ id: number; name: string }[]>("/categories").then(setCategories).catch(() => setCategories([]));
  }, [user, router, FILTER_KEY]);

  useEffect(() => {
    if (user?.role === "ADMIN") fetchList();
  }, [fetchList, user?.role]);

  useEffect(() => {
    localStorage.setItem(
      FILTER_KEY,
      JSON.stringify({
        keyword,
        status: statusFilter,
        categoryId,
        sellerId: sellerIdFilter,
        sellerLabel: selectedSellerLabel,
      })
    );
  }, [FILTER_KEY, keyword, statusFilter, categoryId, sellerIdFilter, selectedSellerLabel]);

  useEffect(() => {
    if (sellerSearchDebounceRef.current) clearTimeout(sellerSearchDebounceRef.current);
    const q = sellerSearchInput.trim();
    if (q.length < 1) {
      setSellerSuggestions([]);
      setSellerSuggestOpen(false);
      return;
    }
    sellerSearchDebounceRef.current = setTimeout(async () => {
      if (!user || user.role !== "ADMIN") return;
      try {
        const res = await api<PageResponse<SellerSuggestItem & { role: string }>>("/admin/members", {
          params: {
            page: "0",
            size: "20",
            includeDeleted: "false",
            role: "SELLER",
            keyword: q,
          },
        });
        const rows = (res.content ?? [])
          .filter((m) => m.role === "SELLER")
          .map((m) => ({ id: m.id, name: m.name, email: m.email }));
        setSellerSuggestions(rows);
        setSellerSuggestOpen(rows.length > 0);
      } catch {
        setSellerSuggestions([]);
        setSellerSuggestOpen(false);
      }
    }, 350);
    return () => {
      if (sellerSearchDebounceRef.current) clearTimeout(sellerSearchDebounceRef.current);
    };
  }, [sellerSearchInput, user]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!sellerPickerRef.current?.contains(e.target as Node)) {
        setSellerSuggestOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  async function handleStatusChange(productId: number, status: ProductStatus) {
    const reason = prompt("상태 변경 사유를 입력하세요 (감사 로그 기록)");
    if (reason === null) return;
    setUpdatingId(productId);
    setError("");
    try {
      await api(`/admin/products/${productId}/status?status=${status}&reason=${encodeURIComponent(reason)}`, { method: "PATCH" });
      fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태 변경 실패");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleBulkStatus(status: ProductStatus) {
    if (selected.length === 0) return;
    const reason = prompt("일괄 상태 변경 사유를 입력하세요 (감사 로그 기록)");
    if (reason === null) return;
    setError("");
    try {
      await api(`/admin/products/status/bulk?reason=${encodeURIComponent(reason)}`, {
        method: "PATCH",
        body: JSON.stringify({ productIds: selected, status }),
      });
      setSelected([]);
      fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "일괄 상태 변경 실패");
    }
  }

  function downloadCsv() {
    const rows = [["id", "name", "status", "price", "stockQuantity", "sellerName"]].concat(
      products.map((p) => [String(p.id), p.name, p.status, String(p.price), String(p.stockQuantity), p.sellerName ?? ""])
    );
    // UTF-8 BOM so Excel on Windows opens the file as UTF-8 (avoids Korean mojibake).
    const esc = (v: string) =>
      `"${v.replace(/"/g, '""').replace(/\r\n|\r|\n/g, " ")}"`;
    const csv = "\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-products-page-${(data?.page ?? 0) + 1}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
          onChange={(e) => {
            setKeyword(e.target.value);
            setPage(0);
          }}
          placeholder="상품명 검색"
          className="input-field w-48"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as ProductStatus | "");
            setPage(0);
          }}
          className="input-field w-auto"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(0);
          }}
          className="input-field w-auto min-w-[100px]"
        >
          <option value="">전체 카테고리</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div ref={sellerPickerRef} className="relative flex min-w-[200px] flex-1 flex-wrap items-center gap-2">
          <input
            type="search"
            value={sellerSearchInput}
            onChange={(e) => {
              setSellerSearchInput(e.target.value);
              setSellerSuggestOpen(true);
            }}
            onFocus={() => sellerSuggestions.length > 0 && setSellerSuggestOpen(true)}
            placeholder="판매자 이름·이메일 검색"
            className="input-field min-w-[180px] flex-1"
            aria-autocomplete="list"
            aria-expanded={sellerSuggestOpen}
          />
          {sellerIdFilter ? (
            <span className="inline-flex max-w-[240px] items-center gap-1 truncate rounded-lg border border-teal-200 bg-teal-50 px-2 py-1 text-xs text-teal-900">
              <span className="truncate" title={selectedSellerLabel || `ID ${sellerIdFilter}`}>
                {selectedSellerLabel || `판매자 ID ${sellerIdFilter}`}
              </span>
              <button
                type="button"
                className="shrink-0 text-teal-700 underline"
                onClick={() => {
                  setSellerIdFilter("");
                  setSelectedSellerLabel("");
                  setSellerSearchInput("");
                  setSellerSuggestions([]);
                  setSellerSuggestOpen(false);
                  setPage(0);
                }}
              >
                초기화
              </button>
            </span>
          ) : null}
          {sellerSuggestOpen && sellerSuggestions.length > 0 ? (
            <ul
              className="absolute left-0 top-full z-20 mt-1 max-h-56 w-full min-w-[240px] overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
              role="listbox"
            >
              {sellerSuggestions.map((m) => (
                <li key={m.id} role="option">
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50"
                    onClick={() => {
                      setSellerIdFilter(String(m.id));
                      setSelectedSellerLabel(`${m.name} (${m.email})`);
                      setSellerSearchInput("");
                      setSellerSuggestions([]);
                      setSellerSuggestOpen(false);
                      setPage(0);
                    }}
                  >
                    <span className="font-medium text-zinc-900">{m.name}</span>
                    <span className="block text-xs text-zinc-500">{m.email}</span>
                    <span className="text-xs text-zinc-400">ID {m.id}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <button type="button" onClick={downloadCsv} className="btn-secondary">
          CSV보내기
        </button>
        <button
          type="button"
          disabled={selected.length === 0}
          onClick={() => handleBulkStatus("ON_SALE")}
          className="btn-secondary disabled:opacity-50"
        >
          선택 판매중
        </button>
        <button
          type="button"
          disabled={selected.length === 0}
          onClick={() => handleBulkStatus("SOLD_OUT")}
          className="btn-secondary disabled:opacity-50"
        >
          선택 품절
        </button>
        <button
          type="button"
          disabled={selected.length === 0}
          onClick={() => handleBulkStatus("DELETED")}
          className="btn-secondary disabled:opacity-50"
        >
          선택 노출중단
        </button>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {products.length === 0 ? (
        <div className="empty-state">
          <p className="text-base">상품이 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="overflow-auto rounded-xl border border-zinc-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="px-3 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={products.length > 0 && selected.length === products.length}
                      onChange={(e) => setSelected(e.target.checked ? products.map((p) => p.id) : [])}
                    />
                  </th>
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">상품명</th>
                  <th className="px-3 py-2 text-left">판매자</th>
                  <th className="px-3 py-2 text-right">가격</th>
                  <th className="px-3 py-2 text-right">재고</th>
                  <th className="px-3 py-2 text-left">상태</th>
                  <th className="px-3 py-2 text-left">액션</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-zinc-100">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(p.id)}
                        onChange={(e) => {
                          setSelected((prev) =>
                            e.target.checked ? [...prev, p.id] : prev.filter((id) => id !== p.id)
                          );
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 text-zinc-700">{p.id}</td>
                    <td className="px-3 py-2">
                      <Link href={`/admin/products/${p.id}`} className="font-medium text-zinc-900 hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-zinc-700">{p.sellerName}</td>
                    <td className="px-3 py-2 text-right text-zinc-700">{p.price.toLocaleString()}원</td>
                    <td className="px-3 py-2 text-right text-zinc-700">{p.stockQuantity.toLocaleString()}</td>
                    <td className="px-3 py-2 text-zinc-700">{p.status}</td>
                    <td className="px-3 py-2">
                      <select
                        value={p.status}
                        onChange={(e) => handleStatusChange(p.id, e.target.value as ProductStatus)}
                        disabled={updatingId === p.id}
                        className="input-field w-auto min-w-[100px] text-sm"
                      >
                        <option value="ON_SALE">판매중</option>
                        <option value="SOLD_OUT">품절</option>
                        <option value="DELETED">노출중단</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={data?.first}
              onClick={() => setPage((p) => p - 1)}
              className="btn-secondary disabled:opacity-50"
            >
              이전
            </button>
            <span className="text-sm text-zinc-600">
              {(data?.page ?? 0) + 1} / {data?.totalPages ?? 1}
            </span>
            <button
              type="button"
              disabled={data?.last}
              onClick={() => setPage((p) => p + 1)}
              className="btn-secondary disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </>
      )}
      <p className="mt-6">
        <Link href="/admin" className="btn-secondary inline-flex">
          대시보드
        </Link>
      </p>
    </div>
  );
}
