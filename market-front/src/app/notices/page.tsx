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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api<PageResponse<NoticeItem>>("/notices", {
        params: { page: String(page), size: "15" },
      });
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "목록을 불러올 수 없습니다.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="section-title">공지사항</h1>
      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {!data?.content.length && !error ? (
        <p className="mt-6 text-zinc-600">등록된 공지가 없습니다.</p>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
          {data?.content.map((n) => (
            <li key={n.id}>
              <Link
                href={`/notices/${n.id}`}
                className="flex flex-wrap items-center gap-2 px-4 py-4 hover:bg-zinc-50"
              >
                {n.pinned && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">고정</span>
                )}
                <span className="flex-1 font-medium text-zinc-900">{n.title}</span>
                <time className="text-sm text-zinc-500" dateTime={n.createdAt}>
                  {new Date(n.createdAt).toLocaleDateString("ko-KR")}
                </time>
              </Link>
            </li>
          ))}
        </ul>
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
