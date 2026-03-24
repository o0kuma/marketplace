"use client";

import { useAuth, type SignupData } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState<"USER" | "SELLER">("USER");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!termsAgreed) {
      setError("Please agree to the terms.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const data: SignupData = {
        name,
        email,
        password,
        phone: phone || undefined,
        address: address || undefined,
        role,
        termsAgreedAt: new Date().toISOString(),
      };
      await signup(data);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid min-h-[72vh] overflow-hidden rounded-3xl border border-[var(--market-border)] bg-[var(--market-surface)] shadow-xl lg:grid-cols-5">
        <div className="hidden flex-col justify-center bg-gradient-to-br from-teal-950 to-stone-900 p-10 text-white lg:col-span-2 lg:flex">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-300">Join us</p>
          <h2 className="mt-4 text-2xl font-semibold">Create your account</h2>
          <p className="mt-4 text-sm leading-relaxed text-stone-300">
            Shop thousands of products or start selling — one account for everything.
          </p>
        </div>
        <div className="px-6 py-10 sm:px-10 lg:col-span-3 lg:py-12">
          <h1 className="text-2xl font-semibold text-stone-900">Sign up</h1>
          <p className="mt-1 text-sm text-stone-500">Fill in your details below.</p>
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
            <label className="block">
              <span className="label">Full name</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="input-field" autoComplete="name" />
            </label>
            <label className="block">
              <span className="label">Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" autoComplete="email" />
            </label>
            <label className="block">
              <span className="label">Password (8+ characters)</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="input-field" autoComplete="new-password" />
            </label>
            <label className="block">
              <span className="label">Phone (optional)</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" autoComplete="tel" />
            </label>
            <label className="block">
              <span className="label">Address (optional)</span>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="input-field" autoComplete="street-address" />
            </label>
            <label className="block">
              <span className="label">Account type</span>
              <select value={role} onChange={(e) => setRole(e.target.value as "USER" | "SELLER")} className="input-field">
                <option value="USER">Shopper</option>
                <option value="SELLER">Seller</option>
              </select>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-[var(--market-border)] bg-stone-50/80 p-4">
              <input type="checkbox" checked={termsAgreed} onChange={(e) => setTermsAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-stone-300 text-teal-800" />
              <span className="text-sm text-stone-600">
                I agree to the{" "}
                <Link href="/terms" className="font-medium text-teal-800 underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-medium text-teal-800 underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            <button type="submit" disabled={submitting} className="btn-primary mt-2 w-full sm:w-auto">
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>
          <p className="mt-8 text-center text-sm text-stone-600 sm:text-left">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-teal-800 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
