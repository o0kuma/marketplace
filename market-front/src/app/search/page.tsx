"use client";

import type { GraphNode, PaperSearchResult } from "@/lib/papersApi";
import { searchPapers } from "@/lib/papersApi";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

const PaperCitationGraph = dynamic(() => import("@/app/components/PaperCitationGraph"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[380px] flex-1 items-center justify-center text-zinc-500">그래프 모듈 로드 중…</div>
  ),
});

const HISTORY_KEY = "paper-search-history";
const MAX_HISTORY = 12;

const SUGGESTED_PROMPTS = [
  "CRISPR gene editing review",
  "transformer attention mechanism",
  "single cell RNA sequencing",
  "climate machine learning",
  "protein structure prediction AlphaFold",
];

function loadHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveHistory(term: string) {
  const t = term.trim();
  if (!t || typeof window === "undefined") return;
  const prev = loadHistory().filter((x) => x.toLowerCase() !== t.toLowerCase());
  prev.unshift(t);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(prev.slice(0, MAX_HISTORY)));
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(qParam);
  const [history, setHistory] = useState<string[]>([]);
  const [results, setResults] = useState<PaperSearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<"list" | "graph">("list");
  /** Detail panel when selected node is not in current search results (e.g. from graph). */
  const [graphPaper, setGraphPaper] = useState<PaperSearchResult | null>(null);

  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  useEffect(() => {
    setHistory(loadHistory());
  }, [qParam]);

  useEffect(() => {
    if (!qParam.trim()) {
      setResults([]);
      setTotalCount(0);
      setPage(0);
      setSelectedId(null);
      setGraphPaper(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPage(0);
    setMainTab("list");
    searchPapers(qParam, 0)
      .then((r) => {
        if (cancelled) return;
        setResults(r.results);
        setTotalCount(r.totalCount);
        setGraphPaper(null);
        if (r.results.length) {
          setSelectedId((prev) =>
            prev && r.results.some((p) => p.id === prev) ? prev : r.results[0].id
          );
        } else {
          setSelectedId(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message ?? "검색에 실패했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [qParam]);

  const selected =
    results.find((p) => p.id === selectedId) ??
    (graphPaper?.id === selectedId ? graphPaper : null);

  const runSearch = useCallback(
    (term: string) => {
      const t = term.trim();
      if (!t) return;
      saveHistory(t);
      setHistory(loadHistory());
      router.push(`/search?q=${encodeURIComponent(t)}`);
    },
    [router]
  );

  const loadMore = useCallback(() => {
    if (!qParam.trim() || loadingMore) return;
    const next = page + 1;
    setLoadingMore(true);
    searchPapers(qParam, next)
      .then((r) => {
        setResults((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          const add = r.results.filter((p) => !seen.has(p.id));
          return [...prev, ...add];
        });
        setPage(next);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [qParam, page, loadingMore]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(query);
  }

  const hasMore = results.length < totalCount && totalCount > 0;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-[480px] flex-col bg-white lg:flex-row">
      <aside className="flex max-h-[40vh] w-full shrink-0 flex-col border-b border-zinc-200 bg-zinc-50/90 lg:max-h-none lg:w-[min(100%,280px)] lg:border-b-0 lg:border-r">
        <div className="border-b border-zinc-200 p-4">
          <form onSubmit={onSubmit} className="relative">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="키워드, 제목…"
              className="w-full rounded-full border border-zinc-200 bg-white py-2.5 pl-4 pr-20 text-sm text-zinc-900 shadow-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              aria-label="논문 검색"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-teal-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
            >
              검색
            </button>
          </form>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">추천 검색어</p>
          <ul className="mt-3 space-y-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <li key={prompt}>
                <button
                  type="button"
                  onClick={() => {
                    setQuery(prompt);
                    runSearch(prompt);
                  }}
                  className="w-full rounded-lg border border-zinc-100 bg-white p-3 text-left text-sm leading-snug text-zinc-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50/50"
                >
                  {prompt}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="shrink-0 border-t border-zinc-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">히스토리</p>
          <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-sm lg:max-h-36">
            {history.length === 0 ? (
              <li className="text-zinc-400">검색 기록이 없습니다.</li>
            ) : (
              history.map((h) => (
                <li key={h}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery(h);
                      runSearch(h);
                    }}
                    className="w-full truncate rounded px-2 py-1.5 text-left text-zinc-700 hover:bg-zinc-200/60"
                  >
                    {h}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-zinc-200 bg-white lg:border-b-0 lg:border-r">
        <div className="shrink-0 border-b border-zinc-100 px-4 py-3">
          <h2 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-zinc-900">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-zinc-100 text-xs" aria-hidden>
              🔍
            </span>
            {qParam ? (
              <>
                <span className="max-w-[min(100%,280px)] truncate sm:max-w-none">&quot;{qParam}&quot;</span>
                <span className="font-normal text-zinc-500">
                  · {loading ? "…" : `${totalCount.toLocaleString()}건`}
                </span>
              </>
            ) : (
              <span className="font-normal text-zinc-500">검색어를 입력하거나 왼쪽 추천을 선택하세요.</span>
            )}
          </h2>
          {qParam ? (
            <div className="mt-3 flex gap-2 border-t border-zinc-100 pt-3">
              <button
                type="button"
                onClick={() => setMainTab("list")}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  mainTab === "list" ? "bg-teal-800 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                검색 결과
              </button>
              <button
                type="button"
                onClick={() => setMainTab("graph")}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  mainTab === "graph" ? "bg-teal-800 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                인용 그래프
              </button>
            </div>
          ) : null}
        </div>

        {mainTab === "graph" && qParam ? (
          <div className="flex min-h-0 flex-1 flex-col p-2 sm:p-3">
            <PaperCitationGraph
              workId={selectedId}
              onSelectNode={(node: GraphNode) => {
                setSelectedId(node.id);
                if (!results.some((p) => p.id === node.id)) {
                  setGraphPaper({
                    id: node.id,
                    title: node.title,
                    year: node.year,
                    citedByCount: node.citations,
                    doi: node.doi,
                    abstractText:
                      "그래프에서 선택한 연결 논문입니다. 전체 초록은 OpenAlex 또는 DOI 링크에서 확인할 수 있습니다.",
                    authors: [],
                  });
                } else {
                  setGraphPaper(null);
                }
                setMainTab("list");
              }}
            />
            <p className="mt-2 text-center text-[10px] text-zinc-400">
              데이터:{" "}
              <a href="https://openalex.org" className="underline hover:text-teal-700" target="_blank" rel="noreferrer">
                OpenAlex
              </a>
            </p>
          </div>
        ) : (
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {!qParam ? (
              <li className="px-4 py-8 text-center text-sm text-zinc-500">
                메인에서 검색하거나 왼쪽에서 검색해 보세요.
                <p className="mt-4">
                  <Link href="/" className="text-teal-800 underline">
                    메인으로
                  </Link>
                </p>
              </li>
            ) : loading ? (
              <li className="px-4 py-12 text-center text-sm text-zinc-500">OpenAlex에서 검색 중…</li>
            ) : error ? (
              <li className="px-4 py-8 text-center text-sm text-red-600">{error}</li>
            ) : results.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-zinc-500">일치하는 논문이 없습니다. 다른 키워드를 시도해 보세요.</li>
            ) : (
              <>
                {results.map((p) => (
                  <ResultListItem
                    key={p.id}
                    paper={p}
                    active={p.id === selectedId}
                    onSelect={() => {
                      setSelectedId(p.id);
                      setGraphPaper(null);
                    }}
                  />
                ))}
                {hasMore ? (
                  <li className="p-4 text-center">
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="rounded-full border border-teal-700 px-5 py-2 text-sm font-medium text-teal-800 hover:bg-teal-50 disabled:opacity-50"
                    >
                      {loadingMore ? "불러오는 중…" : "더 보기"}
                    </button>
                  </li>
                ) : null}
              </>
            )}
          </ul>
        )}
      </section>

      <section className="hidden min-h-0 min-w-0 flex-[1.15] flex-col overflow-hidden bg-zinc-50/60 lg:flex">
        {selected ? (
          <PaperDetail paper={selected} />
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-zinc-500">
            목록에서 논문을 선택하면 초록이 표시됩니다.
          </div>
        )}
        <p className="shrink-0 border-t border-zinc-200 bg-white px-4 py-2 text-center text-[10px] text-zinc-400">
          메타데이터 제공:{" "}
          <a href="https://openalex.org" target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">
            OpenAlex
          </a>
        </p>
      </section>

      {selected && (
        <section className="max-h-[50vh] min-h-[200px] overflow-y-auto border-t border-zinc-200 bg-zinc-50/60 lg:hidden">
          <PaperDetail paper={selected} compact />
        </section>
      )}
    </div>
  );
}

function ResultListItem({
  paper,
  active,
  onSelect,
}: {
  paper: PaperSearchResult;
  active: boolean;
  onSelect: () => void;
}) {
  const snippet =
    paper.abstractText.length > 160 ? `${paper.abstractText.slice(0, 160)}…` : paper.abstractText || paper.title;
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`w-full border-b border-zinc-100 px-4 py-4 text-left transition ${
          active
            ? "border-l-4 border-l-teal-600 bg-zinc-100/90 pl-3"
            : "border-l-4 border-l-transparent hover:bg-zinc-50"
        }`}
      >
        <span className="inline-block rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-900">
          OpenAlex
        </span>
        <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-zinc-900">{paper.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{snippet}</p>
        <p className="mt-2 text-[11px] text-zinc-500">
          {paper.year ? `${paper.year} · ` : ""}
          인용 {paper.citedByCount.toLocaleString()}회
          {paper.authors.length ? ` · ${paper.authors.slice(0, 2).join(", ")}${paper.authors.length > 2 ? " …" : ""}` : ""}
        </p>
        {paper.doi ? <p className="mt-0.5 font-mono text-[10px] text-zinc-400">DOI: {paper.doi}</p> : null}
      </button>
    </li>
  );
}

function PaperDetail({ paper, compact }: { paper: PaperSearchResult; compact?: boolean }) {
  const doiUrl = paper.doi ? `https://doi.org/${paper.doi}` : `https://openalex.org/${paper.id}`;
  return (
    <div className={`flex flex-col overflow-y-auto ${compact ? "p-4" : "h-full"}`}>
      <div className={`shrink-0 border-b border-zinc-200 bg-white shadow-sm ${compact ? "p-4" : "p-6"}`}>
        <h1
          className={`font-bold leading-snug text-zinc-900 ${compact ? "text-base" : "text-xl lg:text-2xl"}`}
        >
          {paper.title}
        </h1>
        <a
          href={doiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:underline"
        >
          논문 / 출처 열기 →
        </a>
        <div className="mt-3 space-y-0.5 text-sm text-zinc-600">
          {paper.authors.length > 0 ? (
            <p>
              <span className="font-medium text-zinc-700">저자</span> {paper.authors.join(", ")}
            </p>
          ) : null}
          {paper.year ? (
            <p>
              <span className="font-medium text-zinc-700">연도</span> {paper.year}
            </p>
          ) : null}
          <p>
            <span className="font-medium text-zinc-700">인용</span> {paper.citedByCount.toLocaleString()}회 · OpenAlex{" "}
            <span className="font-mono text-xs">{paper.id}</span>
          </p>
          {paper.doi ? (
            <p>
              <span className="font-medium text-zinc-700">DOI</span> {paper.doi}
            </p>
          ) : null}
        </div>
      </div>
      <div className={`flex-1 ${compact ? "p-4" : "p-6"}`}>
        <h2 className="text-sm font-semibold text-zinc-800">초록</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700">
          {paper.abstractText || "OpenAlex에 등록된 초록이 없습니다."}
        </p>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-white text-zinc-500">
          로딩 중…
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
