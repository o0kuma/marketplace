"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { OrdersBarChart, SalesLineChart } from "./AdminDashboardCharts";

const orderStatusKo: Record<string, string> = {
  ORDERED: "주문",
  PAYMENT_COMPLETE: "결제",
  SHIPPING: "배송",
  COMPLETE: "완료",
  CANCELLED: "취소",
};

interface MemberSummary {
  id: number;
  name: string;
  email: string;
  role: string;
}
interface ProductSummary {
  id: number;
  name: string;
  status: string;
}
interface OrderSummary {
  id: number;
  totalAmount: number;
  status: string;
}

interface DailyTrendPoint {
  date: string;
  orderCount: number;
  sales: number;
}

interface AdminStats {
  memberCount: number;
  productCount: number;
  orderCount: number;
  todayMembers: number;
  weekMembers: number;
  monthMembers: number;
  todayProducts: number;
  weekProducts: number;
  monthProducts: number;
  todayOrders: number;
  weekOrders: number;
  monthOrders: number;
  todaySales: number;
  weekSales: number;
  monthSales: number;
  recentMembers: MemberSummary[];
  recentProducts: ProductSummary[];
  recentOrders: OrderSummary[];
  dailyTrend?: DailyTrendPoint[];
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    try {
      const res = await api<AdminStats>("/admin/stats");
      setStats(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "통계를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchStats();
  }, [user, router, fetchStats]);

  if (!user || user.role !== "ADMIN") return null;
  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="section-title mb-6">관리자 대시보드</h1>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}
      {stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card text-center">
              <p className="text-sm font-medium text-zinc-500">전체 회원</p>
              <p className="mt-2 text-3xl font-bold text-zinc-900">{stats.memberCount}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm font-medium text-zinc-500">전체 상품</p>
              <p className="mt-2 text-3xl font-bold text-zinc-900">{stats.productCount}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm font-medium text-zinc-500">전체 주문</p>
              <p className="mt-2 text-3xl font-bold text-zinc-900">{stats.orderCount}</p>
            </div>
          </div>

          <h2 className="mt-8 text-lg font-semibold text-zinc-900">기간별 통계</h2>
          <p className="mt-1 text-sm text-zinc-500">오늘 / 이번 주(월요일~현재) / 이번 달(1일~현재) 기준 신규 회원·상품·주문 건수 및 주문 금액 합계</p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-zinc-700">구간</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">회원</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">상품</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">주문</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">매출</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-100">
                  <td className="px-4 py-3 font-medium text-zinc-900">오늘</td>
                  <td className="px-4 py-3 text-zinc-700">+{stats.todayMembers}</td>
                  <td className="px-4 py-3 text-zinc-700">+{stats.todayProducts}</td>
                  <td className="px-4 py-3 text-zinc-700">+{stats.todayOrders}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{Number(stats.todaySales).toLocaleString()}원</td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="px-4 py-3 font-medium text-zinc-900">이번 주</td>
                  <td className="px-4 py-3 text-zinc-700">+{stats.weekMembers}</td>
                  <td className="px-4 py-3 text-zinc-700">+{stats.weekProducts}</td>
                  <td className="px-4 py-3 text-zinc-700">+{stats.weekOrders}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{Number(stats.weekSales).toLocaleString()}원</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-zinc-900">이번 달</td>
                  <td className="px-4 py-3 text-zinc-700">+{stats.monthMembers}</td>
                  <td className="px-4 py-3 text-zinc-700">+{stats.monthProducts}</td>
                  <td className="px-4 py-3 text-zinc-700">+{stats.monthOrders}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{Number(stats.monthSales).toLocaleString()}원</td>
                </tr>
              </tbody>
            </table>
          </div>

          {(stats.dailyTrend?.length ?? 0) > 0 && (
            <section className="mt-10" aria-label="최근 14일 추이">
              <h2 className="text-lg font-semibold text-zinc-900">주문·매출 추이 (최근 14일)</h2>
              <p className="mt-1 text-sm text-zinc-500">일별 주문 건수(막대)와 매출(라인, 주문 총액 합계)</p>
              <div className="mt-4 grid gap-6 lg:grid-cols-2">
                <div className="card">
                  <h3 className="text-sm font-semibold text-zinc-800">일별 주문 수</h3>
                  <OrdersBarChart data={stats.dailyTrend!} />
                </div>
                <div className="card">
                  <h3 className="text-sm font-semibold text-zinc-800">일별 매출</h3>
                  <SalesLineChart data={stats.dailyTrend!} />
                </div>
              </div>
            </section>
          )}

          <h2 className="mt-8 text-lg font-semibold text-zinc-900">최근 목록</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            <div className="card">
              <p className="text-sm font-medium text-zinc-500">최근 가입 회원</p>
              <ul className="mt-2 space-y-2">
                {(stats.recentMembers ?? []).map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/admin/members?keyword=${encodeURIComponent(m.email)}`}
                      className="block text-sm text-zinc-800 hover:underline"
                    >
                      <span className="font-medium">{m.name}</span>
                      <span className="block text-xs text-zinc-500">{m.email}</span>
                      <span className="text-xs text-zinc-400">{m.role}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/admin/members" className="mt-3 inline-block text-sm font-medium text-slate-700 hover:underline">회원 관리 전체 →</Link>
            </div>
            <div className="card">
              <p className="text-sm font-medium text-zinc-500">최근 등록 상품</p>
              <ul className="mt-2 space-y-2">
                {(stats.recentProducts ?? []).map((p) => (
                  <li key={p.id}>
                    <Link href={`/products/${p.id}`} className="block text-sm text-zinc-800 hover:underline">
                      {p.name}
                      <span className="ml-1 text-xs text-zinc-500">({p.status})</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/admin/products" className="mt-3 inline-block text-sm font-medium text-slate-700 hover:underline">상품 관리 전체 →</Link>
            </div>
            <div className="card">
              <p className="text-sm font-medium text-zinc-500">최근 주문</p>
              <ul className="mt-2 space-y-2">
                {(stats.recentOrders ?? []).map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/orders/${o.id}`} className="block text-sm text-zinc-800 hover:underline">
                      <span className="font-medium">주문 #{o.id}</span>
                      <span className="ml-2 text-zinc-600">{Number(o.totalAmount).toLocaleString()}원</span>
                      <span className="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600">
                        {orderStatusKo[o.status] ?? o.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/admin/orders" className="mt-3 inline-block text-sm font-medium text-slate-700 hover:underline">주문 관리 전체 →</Link>
            </div>
          </div>
        </>
      )}
      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/admin/members" className="btn-secondary">회원 관리</Link>
        <Link href="/admin/products" className="btn-secondary">상품 관리</Link>
        <Link href="/admin/orders" className="btn-secondary">주문 관리</Link>
        <Link href="/admin/notices" className="btn-secondary">공지 관리</Link>
        <Link href="/admin/site-documents" className="btn-secondary">약관·정책 편집</Link>
        <Link href="/" className="btn-secondary">홈으로</Link>
      </div>
    </div>
  );
}
