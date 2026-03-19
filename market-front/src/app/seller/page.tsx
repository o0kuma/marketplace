"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface SellerStats {
  productCount: number;
  orderCount: number;
  pendingOrderCount: number;
  todayOrderCount: number;
  weekOrderCount: number;
  todaySales: number;
  weekSales: number;
}

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await api<SellerStats>("/seller/stats");
      setStats(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "통계를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "SELLER") {
      router.push("/");
      return;
    }
    fetchStats();
  }, [user, router, fetchStats]);

  if (!user || user.role !== "SELLER") return null;
  if (loading && !stats) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="section-title mb-6">판매자 대시보드</h1>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}
      {stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/seller/products"
              className="card flex flex-col transition hover:shadow-md"
            >
              <span className="text-sm font-medium text-zinc-500">내 상품</span>
              <span className="mt-1 text-2xl font-bold text-zinc-900">{stats.productCount}</span>
              <span className="mt-2 text-sm text-amber-700">상품 관리 →</span>
            </Link>
            <Link
              href="/seller/orders"
              className="card flex flex-col transition hover:shadow-md"
            >
              <span className="text-sm font-medium text-zinc-500">전체 주문</span>
              <span className="mt-1 text-2xl font-bold text-zinc-900">{stats.orderCount}</span>
              <span className="mt-2 text-sm text-amber-700">주문 관리 →</span>
            </Link>
            <Link
              href="/seller/orders"
              className="card flex flex-col border-amber-200 bg-amber-50/50 transition hover:shadow-md"
            >
              <span className="text-sm font-medium text-zinc-500">미처리 주문</span>
              <span className="mt-1 text-2xl font-bold text-amber-800">{stats.pendingOrderCount}</span>
              <span className="mt-2 text-sm text-amber-700">처리하기 →</span>
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card flex flex-col bg-zinc-50/80">
              <span className="text-sm font-medium text-zinc-500">오늘 주문</span>
              <span className="mt-1 text-xl font-bold text-zinc-900">{stats.todayOrderCount}</span>
              <span className="mt-1 text-sm text-zinc-600">오늘 매출 {Number(stats.todaySales).toLocaleString()}원</span>
            </div>
            <div className="card flex flex-col bg-zinc-50/80">
              <span className="text-sm font-medium text-zinc-500">이번 주 주문</span>
              <span className="mt-1 text-xl font-bold text-zinc-900">{stats.weekOrderCount}</span>
              <span className="mt-1 text-sm text-zinc-600">이번 주 매출 {Number(stats.weekSales).toLocaleString()}원</span>
            </div>
          </div>
        </>
      )}
      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/seller/products/new" className="btn-primary">
          상품 등록
        </Link>
        <Link href="/seller/products" className="btn-secondary">
          내 상품 목록
        </Link>
        <Link href="/seller/orders" className="btn-secondary">
          판매 주문
        </Link>
        <Link href="/seller/questions" className="btn-secondary">
          상품 문의
        </Link>
        <Link href="/seller/reviews" className="btn-secondary">
          상품 리뷰
        </Link>
      </div>
    </div>
  );
}
