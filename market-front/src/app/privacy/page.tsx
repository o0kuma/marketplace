"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { api } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PrivacyPage() {
  const [html, setHtml] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api<{ content: string; updatedAt: string }>("/content/privacy");
        if (!cancelled) {
          setHtml(res.content);
          setUpdatedAt(res.updatedAt);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "불러오기 실패");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="section-title">개인정보처리방침</h1>
      {error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <>
          {updatedAt && (
            <p className="text-xs text-zinc-500">최종 수정: {new Date(updatedAt).toLocaleString("ko-KR")}</p>
          )}
          <div
            className="card prose prose-zinc max-w-none text-zinc-800 [&_ul]:list-inside [&_ul]:list-disc [&_ul]:space-y-2"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </>
      )}
      <p className="flex flex-wrap gap-4 text-sm">
        <Link href="/terms" className="text-zinc-600 hover:underline">
          이용약관
        </Link>
        <Link href="/" className="btn-secondary inline-flex">
          홈으로
        </Link>
      </p>
    </div>
  );
}
