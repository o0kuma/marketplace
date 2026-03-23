"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface Category {
  id: number;
  name: string;
  productCount: number;
}

export default function AdminCategoriesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [list, setList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [hasProductsFilter, setHasProductsFilter] = useState<"" | "true" | "false">("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (keyword.trim()) params.keyword = keyword.trim();
      if (hasProductsFilter) params.hasProducts = hasProductsFilter;
      const data = await api<Category[]>("/admin/categories", { params });
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "카테고리를 불러올 수 없습니다.");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [user, keyword, hasProductsFilter]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchCategories();
  }, [user, router, fetchCategories]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name || saving) return;
    setSaving(true);
    setError("");
    try {
      await api("/admin/categories", { method: "POST", body: JSON.stringify({ name }) });
      setNewName("");
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "추가 실패");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: number, name: string) {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      await api(`/admin/categories/${id}`, { method: "PATCH", body: JSON.stringify({ name: name.trim() }) });
      setEditingId(null);
      setEditName("");
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정 실패");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("이 카테고리를 삭제하시겠습니까? 해당 상품의 카테고리는 해제됩니다.")) return;
    setSaving(true);
    setError("");
    try {
      await api(`/admin/categories/${id}`, { method: "DELETE" });
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setSaving(false);
    }
  }

  if (!user || user.role !== "ADMIN") return null;
  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="section-title">카테고리 관리</h1>
      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="카테고리명 검색"
          className="input-field w-56"
        />
        <select
          value={hasProductsFilter}
          onChange={(e) => setHasProductsFilter(e.target.value as "" | "true" | "false")}
          className="input-field w-auto"
        >
          <option value="">전체</option>
          <option value="true">상품 있는 카테고리</option>
          <option value="false">상품 없는 카테고리</option>
        </select>
      </div>
      <form onSubmit={handleCreate} className="mt-4 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="새 카테고리 이름"
          className="input w-48"
        />
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "처리 중..." : "추가"}
        </button>
      </form>
      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="border-b border-zinc-200 px-3 py-2 text-left">ID</th>
              <th className="border-b border-zinc-200 px-3 py-2 text-left">카테고리명</th>
              <th className="border-b border-zinc-200 px-3 py-2 text-right">상품수</th>
              <th className="border-b border-zinc-200 px-3 py-2 text-left">작업</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-zinc-500">
                  등록된 카테고리가 없습니다.
                </td>
              </tr>
            ) : (
              list.map((c) => (
                <tr key={c.id} className="border-t border-zinc-100">
                  <td className="px-3 py-2 text-zinc-700">{c.id}</td>
                  <td className="px-3 py-2">
                    {editingId === c.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input-field w-full max-w-md"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-zinc-900">{c.name}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-zinc-700">{c.productCount.toLocaleString()}</td>
                  <td className="px-3 py-2">
                    {editingId === c.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdate(c.id, editName)}
                          disabled={saving}
                          className="btn-primary text-sm"
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditName("");
                          }}
                          className="btn-secondary text-sm"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(c.id);
                            setEditName(c.name);
                          }}
                          className="text-sm text-zinc-600 hover:underline"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          disabled={saving}
                          className="text-sm text-red-600 hover:underline disabled:opacity-50"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
