"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface Category {
  id: number;
  name: string;
}

export default function AdminCategoriesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [list, setList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const data = await api<Category[]>("/admin/categories");
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "카테고리를 불러올 수 없습니다.");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
      <ul className="mt-6 space-y-2">
        {list.length === 0 ? (
          <li className="text-zinc-500">등록된 카테고리가 없습니다.</li>
        ) : (
          list.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2">
              {editingId === c.id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input flex-1 min-w-0"
                    autoFocus
                  />
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
                    onClick={() => { setEditingId(null); setEditName(""); }}
                    className="btn-secondary text-sm"
                  >
                    취소
                  </button>
                </>
              ) : (
                <>
                  <span className="font-medium text-zinc-900">{c.name}</span>
                  <button
                    type="button"
                    onClick={() => { setEditingId(c.id); setEditName(c.name); }}
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
                </>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
