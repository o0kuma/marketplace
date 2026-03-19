"use client";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const { login } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      toast.show("Signed in successfully.", "success");
      router.push(redirect && redirect.startsWith("/") ? redirect : "/");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed.";
      setError(msg);
      toast.show(msg, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-[70vh] overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl lg:grid-cols-2">
      <div className="hidden flex-col justify-center bg-gradient-to-br from-teal-950 via-stone-900 to-stone-950 p-12 text-white lg:flex">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-300">Open Market</p>
        <h2 className="mt-4 text-3xl font-semibold leading-tight">Welcome back</h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone-300">
          Sign in to track orders, manage your cart, and shop with confidence.
        </p>
      </div>
      <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Sign in</h1>
        <p className="mt-2 text-sm text-stone-500">Enter your email and password.</p>
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
          {error && (
            <p id="login-error" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          )}
          <label className="block">
            <span className="label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
              autoComplete="email"
              aria-invalid={!!error}
              aria-describedby={error ? "login-error" : undefined}
            />
          </label>
          <label className="block">
            <span className="label">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field"
              autoComplete="current-password"
              aria-invalid={!!error}
              aria-describedby={error ? "login-error" : undefined}
            />
            <span className="mt-1 block text-right">
              <Link href="/forgot-password" className="text-sm text-stone-500 hover:text-teal-700 hover:underline">
                비밀번호 찾기
              </Link>
            </span>
          </label>
          <button type="submit" disabled={submitting} className="btn-primary mt-2 w-full sm:w-auto">
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-stone-600 lg:text-left">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-teal-800 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <Suspense fallback={<div className="py-20 text-center text-stone-500">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
