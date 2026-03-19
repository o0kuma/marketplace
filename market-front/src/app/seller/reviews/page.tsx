"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { PageResponse } from "@/types/common";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface ReviewItem {
  id: number;
  productId: number;
  productName?: string;
  authorId: number;
  authorName: string;
  rating: number;
  content: string | null;
  createdAt: string;
  sellerReply: string | null;
  repliedAt: string | null;
}

export default function SellerReviewsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<PageResponse<ReviewItem> | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyMap, setReplyMap] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const fetchList = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await api<PageResponse<ReviewItem>>("/seller/reviews", {
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

  async function handleReply(reviewId: number) {
    const reply = replyMap[reviewId] ?? "";
    setSavingId(reviewId);
    setError("");
    try {
      await api(`/seller/reviews/${reviewId}/reply`, {
        method: "PATCH",
        body: JSON.stringify({ reply: reply.trim() || null }),
      });
      setReplyMap((prev) => {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      });
      fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "답글 저장 실패");
    } finally {
      setSavingId(null);
    }
  }

  if (!user || user.role !== "SELLER") return null;
  if (loading && !data) return <LoadingSpinner />;

  const reviews = data?.content ?? [];

  return (
    <div>
      <h1 className="section-title mb-6">상품 리뷰</h1>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}
      {reviews.length === 0 ? (
        <div className="empty-state">
          <p className="text-base">내 상품에 대한 리뷰가 없습니다.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/products/${r.productId}`} className="font-medium text-zinc-900 hover:underline">
                  {r.productName ?? `상품 #${r.productId}`}
                </Link>
                <span className="text-sm text-zinc-500">
                  ★ {r.rating} · {new Date(r.createdAt).toLocaleString("ko-KR")}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-700">{r.authorName}: {r.content || "(내용 없음)"}</p>
              {r.sellerReply != null ? (
                <div className="mt-3 rounded bg-amber-50 p-3 text-sm text-zinc-800">
                  <span className="font-medium text-amber-800">판매자 답글</span>
                  <p className="mt-1">{r.sellerReply}</p>
                  {r.repliedAt && (
                    <p className="mt-1 text-xs text-zinc-500">{new Date(r.repliedAt).toLocaleString("ko-KR")}</p>
                  )}
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-2">
                  <textarea
                    value={replyMap[r.id] ?? ""}
                    onChange={(e) => setReplyMap((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    placeholder="답글을 입력하세요"
                    rows={2}
                    className="input-field w-full text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleReply(r.id)}
                    disabled={savingId === r.id}
                    className="btn-primary w-fit text-sm disabled:opacity-50"
                  >
                    {savingId === r.id ? "저장 중..." : "답글 등록"}
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
