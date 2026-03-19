"use client";

import { api } from "@/lib/api";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setError("요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-stone-900">이메일 발송 완료</h1>
        <p className="mt-4 text-sm text-stone-600">
          등록된 이메일로 비밀번호 재설정 링크를 보냈습니다. 이메일을 확인한 뒤 링크를 클릭하여 새 비밀번호를 설정해 주세요.
        </p>
        <p className="mt-2 text-sm text-stone-500">링크는 1시간 동안 유효합니다.</p>
        <Link href="/login" className="btn-primary mt-6 inline-block">
          로그인으로
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-stone-900">비밀번호 찾기</h1>
      <p className="mt-2 text-sm text-stone-500">
        가입 시 사용한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        )}
        <label className="block">
          <span className="label">이메일</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
            autoComplete="email"
          />
        </label>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "발송 중…" : "재설정 링크 받기"}
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
