"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface NotificationItem {
  id: number;
  message: string;
  createdAt: string;
  readAt: string | null;
}

interface NotificationListResponse {
  content: NotificationItem[];
  totalPages: number;
  first: boolean;
  last: boolean;
  page?: number;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<NotificationListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const size = 20;

  const fetchList = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api<NotificationListResponse>("/notifications", {
        params: { page: String(page), size: String(size) },
      });
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user, page]);

  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/notifications");
      return;
    }
    fetchList();
  }, [user, router, fetchList]);

  async function markAsRead(id: number) {
    try {
      await api(`/notifications/${id}/read`, { method: "PATCH" });
      fetchList();
      if (typeof window !== "undefined") window.dispatchEvent(new Event("notifications-updated"));
    } catch {
      // ignore
    }
  }

  if (!user) return null;
  if (loading && !data) return <LoadingSpinner />;

  const list = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;
  const first = data?.first ?? true;
  const last = data?.last ?? true;

  return (
    <div>
      <h1 className="section-title mb-6">알림</h1>
      {list.length > 0 ? (
        <>
          <ul className="space-y-3">
            {list.map((n) => (
              <li key={n.id} className={`card flex flex-wrap items-start justify-between gap-2 ${n.readAt ? "bg-zinc-50" : ""}`}>
                <div>
                  <p className="text-sm">{n.message}</p>
                  <p className="mt-1 text-xs text-zinc-500">{new Date(n.createdAt).toLocaleString("ko-KR")}</p>
                </div>
                {!n.readAt && (
                  <button
                    type="button"
                    onClick={() => markAsRead(n.id)}
                    className="btn-secondary text-xs"
                  >
                    읽음
                  </button>
                )}
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button type="button" disabled={first} onClick={() => setPage((p) => p - 1)} className="btn-secondary disabled:opacity-50">
                이전
              </button>
              <span className="text-sm text-zinc-600">{page + 1} / {totalPages}</span>
              <button type="button" disabled={last} onClick={() => setPage((p) => p + 1)} className="btn-secondary disabled:opacity-50">
                다음
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <p className="text-base">알림이 없습니다.</p>
          <Link href="/" className="btn-secondary mt-4 inline-flex">홈으로</Link>
        </div>
      )}
      <p className="mt-8"><Link href="/" className="btn-secondary inline-flex">홈으로</Link></p>
    </div>
  );
}
