"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import WishlistButton from "@/app/components/WishlistButton";
import { api } from "@/lib/api";
import type { ProductListResponse } from "@/types/product";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function ProductsCatalog() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ProductListResponse | null>(null);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<string>("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [sortBy, setSortBy] = useState("id");
  const [direction, setDirection] = useState("desc");
  const [size, setSize] = useState(12);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {
        page: String(page),
        size: String(size),
        sortBy,
        direction,
      };
      if (keyword) params.keyword = keyword;
      if (status) params.status = status;
      if (categoryId) params.categoryId = categoryId;
      if (minPrice !== "") params.minPrice = minPrice;
      if (maxPrice !== "") params.maxPrice = maxPrice;
      const res = await api<ProductListResponse>("/products", { params });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [page, keyword, status, categoryId, minPrice, maxPrice, sortBy, direction, size]);

  useEffect(() => {
    api<{ id: number; name: string }[]>("/categories").then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const q = searchParams.get("q")?.trim() ?? "";
    const cat = searchParams.get("categoryId") ?? "";
    if (q) {
      setSearchInput(q);
      setKeyword(q);
    }
    if (cat) {
      setCategoryId(cat);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  if (loading && !data) return <LoadingSpinner />;
  if (error && !data) {
    return (
      <div className="empty-state">
        <p className="text-base text-red-600">{error}</p>
        <button type="button" onClick={() => fetchList()} className="btn-primary mt-4">
          다시 시도
        </button>
      </div>
    );
  }
  if (!data) return null;

  const hasItems = data.content.length > 0;

  return (
    <div>
      <div className="mb-10">
        <p className="section-eyebrow">상품</p>
        <h1 className="section-title m-0">전체 상품</h1>
        <p className="mt-2 text-[var(--market-text-muted)]">카테고리·가격·정렬로 원하는 상품을 찾아 보세요.</p>
      </div>
      <div className="lg:grid lg:grid-cols-[minmax(220px,260px)_1fr] lg:gap-10 xl:gap-14">
        <aside className="mb-8 lg:mb-0">
          <form
            className="card card-interactive space-y-5 lg:sticky lg:top-32"
            onSubmit={(e) => {
              e.preventDefault();
              setKeyword(searchInput.trim());
              setPage(0);
            }}
          >
            <label className="flex flex-col">
              <span className="label">검색</span>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="상품명"
                className="input-field"
              />
            </label>
            <label className="flex flex-col">
              <span className="label">카테고리</span>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(0);
                }}
                className="input-field w-auto min-w-[100px]"
              >
                <option value="">전체</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col">
              <span className="label">판매 상태</span>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
                className="input-field w-auto min-w-[90px]"
              >
                <option value="">전체</option>
                <option value="ON_SALE">판매중</option>
                <option value="SOLD_OUT">품절</option>
              </select>
            </label>
            <label className="flex flex-col">
              <span className="label">최저 가격</span>
              <input
                type="number"
                min={0}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="input-field w-24"
              />
            </label>
            <label className="flex flex-col">
              <span className="label">최고 가격</span>
              <input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder=""
                className="input-field w-24"
              />
            </label>
            <label className="flex flex-col">
              <span className="label">정렬</span>
              <select
                value={`${sortBy}-${direction}`}
                onChange={(e) => {
                  const [s, d] = e.target.value.split("-");
                  setSortBy(s);
                  setDirection(d);
                  setPage(0);
                }}
                className="input-field w-auto min-w-[120px]"
              >
                <option value="id-desc">최신순</option>
                <option value="id-asc">오래된순</option>
                <option value="price-asc">가격 낮은순</option>
                <option value="price-desc">가격 높은순</option>
              </select>
            </label>
            <label className="flex flex-col">
              <span className="label">페이지당 개수</span>
              <select
                value={size}
                onChange={(e) => {
                  setSize(Number(e.target.value));
                  setPage(0);
                }}
                className="input-field w-auto min-w-[60px]"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </label>
            <button type="submit" className="btn-primary w-full">
              필터 적용
            </button>
          </form>
        </aside>
        <div>
          {hasItems ? (
            <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {data.content.map((p) => (
                <li key={p.id}>
                  <Link href={`/products/${p.id}`} className="group market-product-card relative block">
                    <span className="absolute right-2 top-2 z-10" onClick={(e) => e.preventDefault()}>
                      <WishlistButton productId={p.id} variant="compact" />
                    </span>
                    <span className="relative block aspect-[4/5] w-full overflow-hidden bg-[var(--market-accent-subtle)]">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.name}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          unoptimized
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-sm text-[var(--market-text-muted)]">이미지 없음</span>
                      )}
                    </span>
                    <div className="p-4">
                      <h2 className="line-clamp-2 text-sm font-medium text-[var(--market-text)]">{p.name}</h2>
                      <p className="mt-2 text-base font-semibold text-[var(--market-text)]">₩{p.price.toLocaleString()}</p>
                      <p className="mt-1 text-xs text-[var(--market-text-muted)]">{p.sellerName}</p>
                      {p.status !== "ON_SALE" && (
                        <span className="mt-2 inline-block text-xs font-medium text-amber-700">
                          {p.status === "SOLD_OUT" ? "품절" : "판매 불가"}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <p className="text-base font-medium text-[var(--market-text)]">조건에 맞는 상품이 없습니다</p>
              <p className="mt-1 text-sm">검색어나 카테고리를 바꿔 보세요.</p>
            </div>
          )}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            <button type="button" disabled={data.first} onClick={() => setPage((x) => x - 1)} className="btn-secondary disabled:opacity-50">
              이전
            </button>
            {Array.from({ length: Math.min(5, data.totalPages || 1) }, (_, i) => {
              const totalPages = data.totalPages || 1;
              let pageNum: number;
              if (totalPages <= 5) pageNum = i;
              else if (data.page < 2) pageNum = i;
              else if (data.page >= totalPages - 2) pageNum = totalPages - 5 + i;
              else pageNum = data.page - 2 + i;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={`min-w-10 rounded-full px-3 py-2 text-sm font-medium ${data.page === pageNum ? "bg-[var(--market-accent)] text-white" : "border border-[var(--market-border)] bg-[var(--market-surface)] text-[var(--market-text)] hover:bg-[var(--market-accent-subtle)]"}`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button type="button" disabled={data.last} onClick={() => setPage((x) => x + 1)} className="btn-secondary disabled:opacity-50">
              다음
            </button>
            <span className="ml-2 text-sm text-[var(--market-text-muted)]">
              {data.page + 1} / {data.totalPages || 1}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
