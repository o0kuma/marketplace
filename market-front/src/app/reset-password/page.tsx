"use client";

import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!token) {
      setError("유효하지 않거나 만료된 링크입니다.");
      return;
    }
    setSubmitting(true);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호 재설정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-[var(--market-border)] bg-[var(--market-surface)] p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-stone-900">비밀번호가 변경되었습니다</h1>
        <p className="mt-4 text-sm text-stone-600">새 비밀번호로 로그인해 주세요.</p>
        <Link href="/login" className="btn-primary mt-6 inline-block">
          로그인
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-[var(--market-border)] bg-[var(--market-surface)] p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-stone-900">잘못된 링크</h1>
        <p className="mt-4 text-sm text-stone-600">
          유효하지 않거나 만료된 링크입니다. 비밀번호 찾기에서 다시 요청해 주세요.
        </p>
        <Link href="/forgot-password" className="btn-primary mt-6 inline-block">
          비밀번호 찾기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-[var(--market-border)] bg-[var(--market-surface)] p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-stone-900">새 비밀번호 설정</h1>
      <p className="mt-2 text-sm text-stone-500">새 비밀번호를 입력해 주세요. (4자 이상)</p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        )}
        <label className="block">
          <span className="label">새 비밀번호</span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={4}
            className="input-field"
            autoComplete="new-password"
          />
        </label>
        <label className="block">
          <span className="label">비밀번호 확인</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={4}
            className="input-field"
            autoComplete="new-password"
          />
        </label>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "저장 중…" : "비밀번호 변경"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-600">
        <Link href="/login" className="text-teal-700 hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <Suspense fallback={<div className="py-20 text-center text-stone-500">로딩 중…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
