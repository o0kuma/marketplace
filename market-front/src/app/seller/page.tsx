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
  cancelledOrderCount: number;
  pendingShipmentCount: number;
  returnRequestedCount: number;
  todayOrderCount: number;
  weekOrderCount: number;
  monthOrderCount: number;
  todaySales: number;
  weekSales: number;
  monthSales: number;
}

type CompareDatum = {
  label: string;
  value: number;
  href?: string;
};

function ComparisonBars({
  title,
  unit,
  rows,
}: {
  title: string;
  unit: string;
  rows: CompareDatum[];
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="card">
      <h2 className="text-sm font-semibold text-zinc-800">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.map((row) => {
          const width = Math.max(8, Math.round((row.value / max) * 100));
          const valueText = `${row.value.toLocaleString()}${unit}`;
          const content = (
            <>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-600">{row.label}</span>
                <span className="font-semibold text-zinc-900">{valueText}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-teal-700" style={{ width: `${width}%` }} />
              </div>
            </>
          );
          if (!row.href) return <div key={row.label}>{content}</div>;
          return (
            <Link key={row.label} href={row.href} className="block rounded-md p-1 transition hover:bg-zinc-50">
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function IssueDistribution({
  cancelledCount,
  returnRequestedCount,
  pendingShipmentCount,
}: {
  cancelledCount: number;
  returnRequestedCount: number;
  pendingShipmentCount: number;
}) {
  const rows = [
    { key: "cancelled", label: "취소 주문", value: cancelledCount, color: "bg-rose-500", href: "/seller/orders?status=CANCELLED" },
    { key: "returns", label: "반품/교환 요청 대기", value: returnRequestedCount, color: "bg-violet-500", href: "/seller/orders?queue=RETURN_REQUESTED" },
    { key: "shipment", label: "출고 대기(운송장 미입력)", value: pendingShipmentCount, color: "bg-amber-500", href: "/seller/orders?queue=PENDING_SHIPMENT" },
  ];
  const total = rows.reduce((acc, row) => acc + row.value, 0);
  return (
    <div className="card">
      <h2 className="text-sm font-semibold text-zinc-800">운영 이슈 분포</h2>
      <p className="mt-1 text-xs text-zinc-500">취소/반품/출고대기 비중을 한 번에 확인합니다.</p>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-100">
        {total === 0 ? (
          <div className="h-full w-full bg-zinc-300" />
        ) : (
          <div className="flex h-full w-full">
            {rows.map((row) => (
              <div
                key={row.key}
                className={row.color}
                style={{ width: `${(row.value / total) * 100}%` }}
                title={`${row.label}: ${row.value.toLocaleString()}건`}
              />
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 space-y-2">
        {rows.map((row) => {
          const ratio = total === 0 ? 0 : Math.round((row.value / total) * 100);
          return (
            <Link key={row.key} href={row.href} className="flex items-center justify-between rounded-md p-1 text-sm transition hover:bg-zinc-50">
              <span className="inline-flex items-center gap-2 text-zinc-700">
                <span className={`h-2.5 w-2.5 rounded-full ${row.color}`} />
                {row.label}
              </span>
              <span className="font-medium text-zinc-900">
                {row.value.toLocaleString()}건 ({ratio}%)
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
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
              href="/seller/orders?queue=PENDING"
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
            <div className="card flex flex-col bg-zinc-50/80">
              <span className="text-sm font-medium text-zinc-500">이번 달 주문</span>
              <span className="mt-1 text-xl font-bold text-zinc-900">{stats.monthOrderCount}</span>
              <span className="mt-1 text-sm text-zinc-600">이번 달 매출 {Number(stats.monthSales).toLocaleString()}원</span>
            </div>
            <Link href="/seller/orders?queue=PENDING_SHIPMENT" className="card flex flex-col bg-zinc-50/80 transition hover:shadow-md">
              <span className="text-sm font-medium text-zinc-500">출고 대기 (운송장 미입력)</span>
              <span className="mt-1 text-xl font-bold text-amber-800">{stats.pendingShipmentCount}</span>
              <span className="mt-1 text-sm text-amber-700">주문 처리로 이동 →</span>
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/seller/orders?status=CANCELLED" className="card flex flex-col transition hover:shadow-md">
              <span className="text-sm font-medium text-zinc-500">취소 주문</span>
              <span className="mt-1 text-2xl font-bold text-zinc-900">{stats.cancelledOrderCount}</span>
              <span className="mt-2 text-sm text-amber-700">취소 건 확인 →</span>
            </Link>
            <Link href="/seller/orders?queue=RETURN_REQUESTED" className="card flex flex-col transition hover:shadow-md">
              <span className="text-sm font-medium text-zinc-500">반품/교환 요청 대기</span>
              <span className="mt-1 text-2xl font-bold text-zinc-900">{stats.returnRequestedCount}</span>
              <span className="mt-2 text-sm text-amber-700">주문 상세에서 처리 →</span>
            </Link>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <ComparisonBars
              title="기간별 주문량"
              unit="건"
              rows={[
                { label: "오늘", value: stats.todayOrderCount },
                { label: "이번 주", value: stats.weekOrderCount },
                { label: "이번 달", value: stats.monthOrderCount },
              ]}
            />
            <ComparisonBars
              title="기간별 체결 주문액"
              unit="원"
              rows={[
                { label: "오늘", value: stats.todaySales },
                { label: "이번 주", value: stats.weekSales },
                { label: "이번 달", value: stats.monthSales },
              ]}
            />
          </div>
          <div className="mt-4">
            <IssueDistribution
              cancelledCount={stats.cancelledOrderCount}
              returnRequestedCount={stats.returnRequestedCount}
              pendingShipmentCount={stats.pendingShipmentCount}
            />
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
