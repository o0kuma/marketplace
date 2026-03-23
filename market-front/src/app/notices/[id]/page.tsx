"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { api } from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface NoticeDetail {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  prevNotice?: { id: number; title: string } | null;
  nextNotice?: { id: number; title: string } | null;
}

export default function NoticeDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (Number.isNaN(id)) return;
    setLoading(true);
    setError("");
    try {
      const n = await api<NoticeDetail>(`/notices/${id}`);
      setNotice(n);
    } catch (e) {
      setError(e instanceof Error ? e.message : "공지를 불러올 수 없습니다.");
      setNotice(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingSpinner />;
  if (error || !notice) {
    return (
      <div>
        <p className="text-red-600">{error || "없는 공지입니다."}</p>
        <Link href="/notices" className="mt-4 inline-block text-sm text-zinc-600 hover:underline">
          목록으로
        </Link>
      </div>
    );
  }

  return (
    <article>
      <Link href="/notices" className="text-sm text-zinc-600 hover:underline">
        ← 공지 목록
      </Link>
      <header className="mt-4 border-b border-zinc-200 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {notice.pinned && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">고정</span>
          )}
          <h1 className="section-title m-0 text-2xl">{notice.title}</h1>
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          {new Date(notice.createdAt).toLocaleString("ko-KR")}
        </p>
      </header>
      <div
        className="prose prose-zinc mt-6 max-w-none text-zinc-800 [&_ul]:list-inside [&_ul]:list-disc [&_ul]:space-y-2"
        dangerouslySetInnerHTML={{ __html: notice.content }}
      />
      <nav className="mt-10 rounded-xl border border-zinc-200 bg-white">
        <div className="flex items-center border-b border-zinc-100 px-4 py-3 text-sm">
          <span className="w-16 shrink-0 text-zinc-500">이전글</span>
          {notice.prevNotice ? (
            <Link href={`/notices/${notice.prevNotice.id}`} className="truncate text-zinc-900 hover:underline">
              {notice.prevNotice.title}
            </Link>
          ) : (
            <span className="text-zinc-400">이전 공지가 없습니다.</span>
          )}
        </div>
        <div className="flex items-center px-4 py-3 text-sm">
          <span className="w-16 shrink-0 text-zinc-500">다음글</span>
          {notice.nextNotice ? (
            <Link href={`/notices/${notice.nextNotice.id}`} className="truncate text-zinc-900 hover:underline">
              {notice.nextNotice.title}
            </Link>
          ) : (
            <span className="text-zinc-400">다음 공지가 없습니다.</span>
          )}
        </div>
      </nav>
    </article>
  );
}
