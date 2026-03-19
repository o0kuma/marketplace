"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { PageResponse } from "@/types/common";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface MemberItem {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  deleted?: boolean;
}

export default function AdminMembersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<PageResponse<MemberItem> | null>(null);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [urlSynced, setUrlSynced] = useState(false);

  const fetchList = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {
        page: String(page),
        size: "20",
        includeDeleted: String(includeDeleted),
      };
      if (keyword) params.keyword = keyword;
      const res = await api<PageResponse<MemberItem>>("/admin/members", { params });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [user, page, keyword, includeDeleted]);

  useEffect(() => {
    const kw = searchParams.get("keyword")?.trim() ?? "";
    if (kw) {
      setKeyword(kw);
      setSearchInput(kw);
      setPage(0);
    }
    setUrlSynced(true);
  }, [searchParams]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    if (!urlSynced) return;
    fetchList();
  }, [user, router, fetchList, urlSynced]);

  async function handleRoleChange(memberId: number, newRole: string) {
    setUpdatingId(memberId);
    setError("");
    try {
      await api(`/admin/members/${memberId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "역할 변경 실패");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRestore(memberId: number) {
    if (!confirm("이 회원을 복구하시겠습니까?")) return;
    setError("");
    try {
      await api(`/admin/members/${memberId}/restore`, { method: "PATCH" });
      fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "복구 실패");
    }
  }

  if (!user || user.role !== "ADMIN") return null;
  if (loading && !data) return <LoadingSpinner />;

  const members = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const currentPage = data?.page ?? 0;

  return (
    <div>
      <h1 className="section-title mb-6">회원 관리</h1>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => { e.preventDefault(); setKeyword(searchInput.trim()); setPage(0); }}
        >
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="이메일 또는 이름 검색"
            className="input-field w-48"
          />
          <button type="submit" className="btn-primary text-sm">검색</button>
        </form>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => { setIncludeDeleted(e.target.checked); setPage(0); }}
            className="h-4 w-4 rounded border-zinc-300"
          />
          <span className="text-sm text-zinc-600">탈퇴 회원 포함</span>
        </label>
      </div>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}
      {members.length === 0 ? (
        <div className="empty-state">
          <p className="text-base">회원이 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-zinc-200 text-sm">
              <thead>
                <tr className="bg-zinc-50">
                  <th className="border border-zinc-200 px-3 py-2 text-left">ID</th>
                  <th className="border border-zinc-200 px-3 py-2 text-left">이름</th>
                  <th className="border border-zinc-200 px-3 py-2 text-left">이메일</th>
                  <th className="border border-zinc-200 px-3 py-2 text-left">역할</th>
                  <th className="border border-zinc-200 px-3 py-2 text-left">상태</th>
                  <th className="border border-zinc-200 px-3 py-2 text-left">작업</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className={m.deleted ? "bg-red-50/50" : ""}>
                    <td className="border border-zinc-200 px-3 py-2">{m.id}</td>
                    <td className="border border-zinc-200 px-3 py-2">{m.name}</td>
                    <td className="border border-zinc-200 px-3 py-2">{m.email}</td>
                    <td className="border border-zinc-200 px-3 py-2">
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value)}
                        disabled={updatingId === m.id || m.deleted}
                        className="input-field w-auto min-w-[90px] text-sm disabled:opacity-50"
                      >
                        <option value="USER">USER</option>
                        <option value="SELLER">SELLER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="border border-zinc-200 px-3 py-2">
                      {m.deleted ? <span className="text-red-600">탈퇴</span> : <span className="text-zinc-600">정상</span>}
                    </td>
                    <td className="border border-zinc-200 px-3 py-2">
                      {m.deleted && (
                        <button
                          type="button"
                          onClick={() => handleRestore(m.id)}
                          className="text-sm text-amber-700 hover:underline"
                        >
                          복구
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button type="button" disabled={data?.first} onClick={() => setPage((p) => p - 1)} className="btn-secondary disabled:opacity-50">이전</button>
            <span className="text-sm text-zinc-600">{currentPage + 1} / {totalPages || 1}</span>
            <button type="button" disabled={data?.last} onClick={() => setPage((p) => p + 1)} className="btn-secondary disabled:opacity-50">다음</button>
          </div>
        </>
      )}
      <p className="mt-6">
        <Link href="/admin" className="btn-secondary inline-flex">대시보드</Link>
      </p>
    </div>
  );
}
