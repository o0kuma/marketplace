"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { api } from "@/lib/api";
import type { PageResponse } from "@/types/common";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface NoticeItem {
  id: number;
  title: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function NoticesPage() {
  const [data, setData] = useState<PageResponse<NoticeItem> | null>(null);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [pinnedFilter, setPinnedFilter] = useState<"" | "true" | "false">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { page: String(page), size: "15" };
      if (keyword.trim()) params.keyword = keyword.trim();
      if (pinnedFilter) params.pinned = pinnedFilter;
      const res = await api<PageResponse<NoticeItem>>("/notices", {
        params,
      });
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "목록을 불러올 수 없습니다.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, keyword, pinnedFilter]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="section-title">공지사항</h1>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPage(0);
          }}
          placeholder="제목 검색"
          className="input-field w-64"
        />
        <select
          value={pinnedFilter}
          onChange={(e) => {
            setPinnedFilter(e.target.value as "" | "true" | "false");
            setPage(0);
          }}
          className="input-field w-auto"
        >
          <option value="">전체</option>
          <option value="true">고정 공지만</option>
          <option value="false">일반 공지만</option>
        </select>
      </div>
      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {!data?.content.length && !error ? (
        <p className="mt-6 text-zinc-600">등록된 공지가 없습니다.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--market-border)] bg-[var(--market-surface)]">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="border-b border-zinc-200 px-3 py-2 text-left">번호</th>
                <th className="border-b border-zinc-200 px-3 py-2 text-left">제목</th>
                <th className="border-b border-zinc-200 px-3 py-2 text-left">구분</th>
                <th className="border-b border-zinc-200 px-3 py-2 text-left">등록일</th>
              </tr>
            </thead>
            <tbody>
              {data?.content.map((n) => (
                <tr key={n.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                  <td className="px-3 py-3 text-zinc-700">{n.id}</td>
                  <td className="px-3 py-3">
                    <Link href={`/notices/${n.id}`} className="font-medium text-zinc-900 hover:underline">
                      {n.title}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    {n.pinned ? (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">고정</span>
                    ) : (
                      <span className="text-zinc-500">일반</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-zinc-600">
                    {new Date(n.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={data.first}
            onClick={() => setPage((p) => p - 1)}
            className="btn-secondary disabled:opacity-50"
          >
            이전
          </button>
          <span className="text-sm text-zinc-600">
            {data.page + 1} / {data.totalPages}
          </span>
          <button
            type="button"
            disabled={data.last}
            onClick={() => setPage((p) => p + 1)}
            className="btn-secondary disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
      <p className="mt-8">
        <Link href="/" className="btn-secondary inline-flex">
          홈으로
        </Link>
      </p>
    </div>
  );
}
