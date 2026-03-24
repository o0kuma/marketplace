"use client";

import LegalRichEditor from "@/app/components/LegalRichEditor";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { api } from "@/lib/api";
import { isLegalHtmlEmpty, sanitizeLegalHtml } from "@/lib/sanitizeLegalHtml";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface DocBlock {
  type: string;
  content: string;
  updatedAt: string;
}

export default function AdminSiteDocumentsPage() {
  const [terms, setTerms] = useState("");
  const [privacy, setPrivacy] = useState("");
  const [termsUpdated, setTermsUpdated] = useState("");
  const [privacyUpdated, setPrivacyUpdated] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"TERMS" | "PRIVACY" | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const map = await api<Record<string, DocBlock>>("/admin/site-documents");
      if (map.TERMS) {
        setTerms(sanitizeLegalHtml(map.TERMS.content));
        setTermsUpdated(map.TERMS.updatedAt);
      }
      if (map.PRIVACY) {
        setPrivacy(sanitizeLegalHtml(map.PRIVACY.content));
        setPrivacyUpdated(map.PRIVACY.updatedAt);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(which: "TERMS" | "PRIVACY") {
    const raw = which === "TERMS" ? terms : privacy;
    const content = sanitizeLegalHtml(raw);
    if (isLegalHtmlEmpty(content)) {
      setError("내용이 비어 있습니다.");
      return;
    }
    if (content !== raw) {
      if (which === "TERMS") setTerms(content);
      else setPrivacy(content);
    }
    setSaving(which);
    setError("");
    setOk("");
    try {
      const res = await api<DocBlock>(`/admin/site-documents/${which}`, {
        method: "PUT",
        body: JSON.stringify({ content }),
      });
      if (which === "TERMS") {
        setTermsUpdated(res.updatedAt);
        setTerms(sanitizeLegalHtml(res.content));
      } else {
        setPrivacyUpdated(res.updatedAt);
        setPrivacy(sanitizeLegalHtml(res.content));
      }
      setOk(which === "TERMS" ? "이용약관이 저장되었습니다." : "개인정보처리방침이 저장되었습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="section-title">약관 · 개인정보처리방침</h1>
      <p className="mt-2 text-sm text-zinc-500">
        아래 에디터로 작성한 내용이 HTML로 저장되어{" "}
        <Link href="/terms" className="underline" target="_blank">
          /terms
        </Link>
        ,{" "}
        <Link href="/privacy" className="underline" target="_blank">
          /privacy
        </Link>
        에 표시됩니다. 저장 시 스크립트 등 위험 태그는 자동으로 제거됩니다.
      </p>
      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {ok && <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{ok}</p>}

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">이용약관</h2>
        {termsUpdated && (
          <p className="mt-1 text-xs text-zinc-500">마지막 수정: {new Date(termsUpdated).toLocaleString("ko-KR")}</p>
        )}
        <LegalRichEditor value={terms} onChange={setTerms} placeholder="이용약관 본문을 입력하세요…" />
        <button
          type="button"
          onClick={() => save("TERMS")}
          disabled={saving !== null}
          className="btn-primary mt-3 disabled:opacity-50"
        >
          {saving === "TERMS" ? "저장 중…" : "이용약관 저장"}
        </button>
      </section>

      <section className="mt-10 border-t border-zinc-200 pt-8">
        <h2 className="text-lg font-semibold text-zinc-900">개인정보처리방침</h2>
        {privacyUpdated && (
          <p className="mt-1 text-xs text-zinc-500">마지막 수정: {new Date(privacyUpdated).toLocaleString("ko-KR")}</p>
        )}
        <LegalRichEditor value={privacy} onChange={setPrivacy} placeholder="개인정보처리방침 본문을 입력하세요…" />
        <button
          type="button"
          onClick={() => save("PRIVACY")}
          disabled={saving !== null}
          className="btn-primary mt-3 disabled:opacity-50"
        >
          {saving === "PRIVACY" ? "저장 중…" : "개인정보처리방침 저장"}
        </button>
      </section>

      <p className="mt-10">
        <Link href="/admin" className="btn-secondary inline-flex">
          대시보드
        </Link>
      </p>
    </div>
  );
}
