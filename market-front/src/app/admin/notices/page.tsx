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

export default function AdminNoticesPage() {
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
      const params: Record<string, string> = { page: String(page), size: "20" };
      if (keyword.trim()) params.keyword = keyword.trim();
      if (pinnedFilter) params.pinned = pinnedFilter;
      const res = await api<PageResponse<NoticeItem>>("/admin/notices", {
        params,
      });
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [page, keyword, pinnedFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: number) {
    if (!confirm("이 공지를 삭제할까요?")) return;
    try {
      await api(`/admin/notices/${id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제 실패");
    }
  }

  if (loading && !data) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="section-title m-0">공지사항 관리</h1>
        <Link href="/admin/notices/new" className="btn-primary">
          새 공지 작성
        </Link>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPage(0);
          }}
          placeholder="제목 검색"
          className="input-field w-60"
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
          <option value="true">고정만</option>
          <option value="false">일반만</option>
        </select>
      </div>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="text-left">ID</th>
              <th className="text-left">제목</th>
              <th className="text-left">고정</th>
              <th className="text-left">등록일</th>
              <th className="text-left">수정일</th>
              <th className="text-left">작업</th>
            </tr>
          </thead>
          <tbody>
            {(data?.content ?? []).map((n) => (
              <tr key={n.id}>
                <td className="px-3 py-2 text-zinc-700">{n.id}</td>
                <td className="px-3 py-2">
                  <Link href={`/notices/${n.id}`} className="text-zinc-600 hover:underline" target="_blank">
                    미리보기
                  </Link>
                  <span className="ml-2 font-medium text-zinc-900">{n.title}</span>
                </td>
                <td className="px-3 py-2">{n.pinned ? "예" : "-"}</td>
                <td className="px-3 py-2 text-zinc-600">{new Date(n.createdAt).toLocaleString("ko-KR")}</td>
                <td className="px-3 py-2 text-zinc-600">{new Date(n.updatedAt).toLocaleString("ko-KR")}</td>
                <td className="px-3 py-2">
                  <Link href={`/admin/notices/${n.id}/edit`} className="text-sm text-zinc-700 hover:underline">
                    수정
                  </Link>
                  <button type="button" onClick={() => handleDelete(n.id)} className="ml-3 text-sm text-red-600 hover:underline">
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {(data?.content ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-zinc-500">
                  조회된 공지가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button type="button" disabled={data.first} onClick={() => setPage((p) => p - 1)} className="btn-secondary disabled:opacity-50">
            이전
          </button>
          <span className="text-sm text-zinc-600">
            {data.page + 1} / {data.totalPages}
          </span>
          <button type="button" disabled={data.last} onClick={() => setPage((p) => p + 1)} className="btn-secondary disabled:opacity-50">
            다음
          </button>
        </div>
      )}
      <p className="mt-6">
        <Link href="/admin" className="btn-secondary inline-flex">
          대시보드
        </Link>
      </p>
    </div>
  );
}
