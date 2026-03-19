"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { PageResponse } from "@/types/common";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface QuestionItem {
  id: number;
  productId: number;
  productName?: string;
  authorId: number;
  authorName: string;
  content: string;
  createdAt: string;
  sellerAnswer: string | null;
  answeredAt: string | null;
}

export default function SellerQuestionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<PageResponse<QuestionItem> | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answerMap, setAnswerMap] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const fetchList = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await api<PageResponse<QuestionItem>>("/seller/questions", {
        params: { page: String(page), size: "20" },
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [user, page]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "SELLER") {
      router.push("/");
      return;
    }
    fetchList();
  }, [user, router, fetchList]);

  async function handleAnswer(questionId: number) {
    const answer = answerMap[questionId] ?? "";
    setSavingId(questionId);
    setError("");
    try {
      await api(`/seller/questions/${questionId}/answer`, {
        method: "PATCH",
        body: JSON.stringify({ answer: answer.trim() || null }),
      });
      setAnswerMap((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
      fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "답변 저장 실패");
    } finally {
      setSavingId(null);
    }
  }

  if (!user || user.role !== "SELLER") return null;
  if (loading && !data) return <LoadingSpinner />;

  const questions = data?.content ?? [];

  return (
    <div>
      <h1 className="section-title mb-6">상품 문의</h1>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}
      {questions.length === 0 ? (
        <div className="empty-state">
          <p className="text-base">내 상품에 대한 문의가 없습니다.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {questions.map((q) => (
            <li key={q.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/products/${q.productId}`} className="font-medium text-zinc-900 hover:underline">
                  {q.productName ?? `상품 #${q.productId}`}
                </Link>
                <span className="text-sm text-zinc-500">{new Date(q.createdAt).toLocaleString("ko-KR")}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-700">{q.authorName}: {q.content}</p>
              {q.sellerAnswer != null ? (
                <div className="mt-3 rounded bg-amber-50 p-3 text-sm text-zinc-800">
                  <span className="font-medium text-amber-800">판매자 답변</span>
                  <p className="mt-1">{q.sellerAnswer}</p>
                  {q.answeredAt && (
                    <p className="mt-1 text-xs text-zinc-500">{new Date(q.answeredAt).toLocaleString("ko-KR")}</p>
                  )}
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-2">
                  <textarea
                    value={answerMap[q.id] ?? ""}
                    onChange={(e) => setAnswerMap((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="답변을 입력하세요"
                    rows={2}
                    className="input-field w-full text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleAnswer(q.id)}
                    disabled={savingId === q.id}
                    className="btn-primary w-fit text-sm disabled:opacity-50"
                  >
                    {savingId === q.id ? "저장 중..." : "답변 등록"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {data && data.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            disabled={data.first}
            onClick={() => setPage((p) => p - 1)}
            className="btn-secondary disabled:opacity-50"
          >
            이전
          </button>
          <span className="flex items-center text-sm text-zinc-600">
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
    </div>
  );
}
