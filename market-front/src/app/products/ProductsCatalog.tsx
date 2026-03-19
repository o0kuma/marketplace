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
      setError(err instanceof Error ? err.message : "Failed to load");
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
          Retry
        </button>
      </div>
    );
  }
  if (!data) return null;

  const hasItems = data.content.length > 0;

  return (
    <div>
      <div className="mb-10">
        <p className="section-eyebrow">Catalog</p>
        <h1 className="section-title m-0">All products</h1>
        <p className="mt-2 text-stone-500">Filter by category, price, and sort order.</p>
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
              <span className="label">Search</span>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Product name"
                className="input-field"
              />
            </label>
            <label className="flex flex-col">
              <span className="label">Category</span>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setPage(0);
                }}
                className="input-field w-auto min-w-[100px]"
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col">
              <span className="label">Status</span>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
                className="input-field w-auto min-w-[90px]"
              >
                <option value="">All</option>
                <option value="ON_SALE">In stock</option>
                <option value="SOLD_OUT">Sold out</option>
              </select>
            </label>
            <label className="flex flex-col">
              <span className="label">Min price</span>
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
              <span className="label">Max price</span>
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
              <span className="label">Sort</span>
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
                <option value="id-desc">Newest</option>
                <option value="id-asc">Oldest</option>
                <option value="price-asc">Price: low</option>
                <option value="price-desc">Price: high</option>
              </select>
            </label>
            <label className="flex flex-col">
              <span className="label">Per page</span>
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
              Apply filters
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
                    <span className="relative block aspect-[4/5] w-full overflow-hidden bg-stone-100">
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
                        <span className="flex h-full w-full items-center justify-center text-sm text-stone-400">No image</span>
                      )}
                    </span>
                    <div className="p-4">
                      <h2 className="line-clamp-2 text-sm font-medium text-stone-900">{p.name}</h2>
                      <p className="mt-2 text-base font-semibold text-stone-900">₩{p.price.toLocaleString()}</p>
                      <p className="mt-1 text-xs text-stone-500">{p.sellerName}</p>
                      {p.status !== "ON_SALE" && (
                        <span className="mt-2 inline-block text-xs font-medium text-amber-700">
                          {p.status === "SOLD_OUT" ? "Sold out" : "Unavailable"}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <p className="text-base font-medium text-stone-700">No products match your filters</p>
              <p className="mt-1 text-sm">Try adjusting search or category.</p>
            </div>
          )}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            <button type="button" disabled={data.first} onClick={() => setPage((x) => x - 1)} className="btn-secondary disabled:opacity-50">
              Prev
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
                  className={`min-w-10 rounded-full px-3 py-2 text-sm font-medium ${data.page === pageNum ? "bg-teal-800 text-white" : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"}`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button type="button" disabled={data.last} onClick={() => setPage((x) => x + 1)} className="btn-secondary disabled:opacity-50">
              Next
            </button>
            <span className="ml-2 text-sm text-stone-500">
              {data.page + 1} / {data.totalPages || 1}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
