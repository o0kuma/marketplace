"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { api } from "@/lib/api";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface NoticeDetail {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
}

export default function AdminNoticeEditPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (Number.isNaN(id)) return;
    setLoading(true);
    setError("");
    try {
      const n = await api<NoticeDetail>(`/admin/notices/${id}`);
      setTitle(n.title);
      setContent(n.content);
      setPinned(n.pinned);
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 입력하세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api(`/admin/notices/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: title.trim(), content, pinned }),
      });
      router.push("/admin/notices");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="section-title">공지 수정 #{id}</h1>
      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input mt-1 w-full max-w-xl"
            maxLength={200}
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="rounded border-zinc-300" />
            목록 상단 고정
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">내용 (HTML)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            className="input mt-1 w-full font-mono text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? "저장 중…" : "저장"}
          </button>
          <Link href={`/notices/${id}`} className="btn-secondary" target="_blank">
            미리보기
          </Link>
          <Link href="/admin/notices" className="btn-secondary">
            목록
          </Link>
        </div>
      </form>
    </div>
  );
}
