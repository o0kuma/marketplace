"use client";

import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminNoticeNewPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 입력하세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await api<{ id: number }>("/admin/notices", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), content, pinned }),
      });
      router.push(`/admin/notices/${created.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="section-title">새 공지 작성</h1>
      <p className="mt-2 text-sm text-zinc-500">HTML 태그(&lt;p&gt;, &lt;ul&gt;, &lt;strong&gt; 등)을 사용할 수 있습니다.</p>
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
            {saving ? "저장 중…" : "등록"}
          </button>
          <Link href="/admin/notices" className="btn-secondary">
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}
