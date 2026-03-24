"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

function measureStripHeight(): number {
  if (typeof window === "undefined") return 600;
  const header = document.getElementById("site-header");
  const h = header?.getBoundingClientRect().height ?? 0;
  return Math.max(320, Math.round(window.innerHeight - h));
}

type HomeSwipePanelsProps = {
  /** Before scrolling to #home-shop — e.g. show the shop block (home page). */
  onRevealShopBelow?: () => void;
  /** When user goes back to the paper strip panel — e.g. hide #home-shop again. */
  onBackToPaperPanel?: () => void;
};

export default function HomeSwipePanels({ onRevealShopBelow, onBackToPaperPanel }: HomeSwipePanelsProps) {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [paperQuery, setPaperQuery] = useState("");
  const [stripH, setStripH] = useState(600);

  useLayoutEffect(() => {
    function update() {
      setStripH(measureStripHeight());
    }
    update();
    window.addEventListener("resize", update);
    const ro = new ResizeObserver(() => update());
    const el = document.getElementById("site-header");
    if (el) ro.observe(el);
    return () => {
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, []);

  const scrollToPanel = useCallback((index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    el.scrollTo({ left: index * w, behavior: "smooth" });
  }, []);

  function scrollToShopBelow() {
    if (onRevealShopBelow) {
      onRevealShopBelow();
      return;
    }
    document.getElementById("home-shop")?.scrollIntoView({ behavior: "smooth" });
  }

  function onPaperSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = paperQuery.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  const hStyle = { height: stripH, minHeight: stripH } as const;

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div
        ref={scrollerRef}
        className="flex w-full max-w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ ...hStyle, WebkitOverflowScrolling: "touch" }}
        aria-label="검색과 쇼핑 인트로"
      >
        {/* Panel 0 — research */}
        <div
          className="relative min-w-full max-w-full shrink-0 basis-full snap-center snap-always overflow-hidden"
          style={hStyle}
          aria-label="논문 검색"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-teal-950 via-stone-900 to-stone-950" />
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
              backgroundSize: "32px 32px",
            }}
          />
          <div className="pointer-events-none absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-teal-500/20 blur-[100px]" />
          <div className="pointer-events-none absolute -right-10 bottom-1/4 h-80 w-80 rounded-full bg-teal-400/12 blur-[100px]" />

          <div className="relative flex h-full flex-col justify-center overflow-y-auto px-6 py-6 sm:px-10">
            <div className="mx-auto w-full max-w-4xl text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-teal-300/90 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400" />
                AI · Research
              </p>
              <h1 className="mt-4 bg-gradient-to-r from-white via-teal-100 to-stone-200 bg-clip-text text-2xl font-bold leading-[1.15] tracking-tight text-transparent sm:mt-5 sm:text-4xl lg:text-5xl xl:text-6xl">
                수백만 편의 논문 속에서
                <br className="hidden sm:block" />
                <span className="text-white"> 당신의 질문에 답을 찾습니다</span>
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-stone-300 sm:mt-4 sm:text-base">
                키워드·초록·인용 네트워크를 넘나드는 검색.
              </p>

              <form onSubmit={onPaperSearch} className="mx-auto mt-6 max-w-2xl sm:mt-8">
                <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/10 p-2 backdrop-blur-md sm:flex-row sm:items-stretch">
                  <input
                    type="search"
                    value={paperQuery}
                    onChange={(e) => setPaperQuery(e.target.value)}
                    placeholder="bio, CRISPR, LLM …"
                    className="min-h-[48px] flex-1 rounded-xl border-0 bg-[var(--market-surface)] px-4 py-2.5 text-base text-[var(--market-text)] outline-none focus:ring-2 focus:ring-teal-500"
                    aria-label="논문 검색"
                  />
                  <button
                    type="submit"
                    className="min-h-[48px] shrink-0 rounded-xl bg-gradient-to-r from-teal-600 to-teal-800 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-950/40 hover:from-teal-500 hover:to-teal-700"
                  >
                    검색하기
                  </button>
                </div>
              </form>

              <Link href="/search" className="mt-4 inline-block text-sm font-semibold text-teal-200 hover:text-white sm:mt-5">
                고급 검색 화면 →
              </Link>

              <div className="mt-6 flex flex-col items-center gap-1 border-t border-white/10 pt-6 sm:mt-8">
                <button
                  type="button"
                  onClick={() => scrollToPanel(1)}
                  className="text-sm font-medium text-teal-200 underline decoration-teal-400/60 underline-offset-4 hover:text-white"
                >
                  쇼핑 인트로로 이동 →
                </button>
                <span className="text-xs text-white/40">또는 옆으로 스와이프</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 1 — shop banner only (full width) */}
        <div
          className="relative flex min-w-full max-w-full shrink-0 basis-full snap-center snap-always flex-col overflow-hidden bg-gradient-to-br from-teal-950 via-stone-900 to-stone-950"
          style={hStyle}
          aria-label="쇼핑"
        >
          <div className="pointer-events-none absolute -right-16 -top-10 h-48 w-48 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/4 h-40 w-64 rounded-full bg-teal-400/10 blur-3xl" />

          <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-teal-300/90 sm:text-xs">Open Market</p>
            <h2 className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              Discover products you&apos;ll love
            </h2>
            <p className="mt-3 max-w-md text-sm text-stone-300 sm:text-base">검증된 판매자 · 안전한 결제 · 빠른 배송</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/products"
                className="rounded-full bg-[var(--market-surface)] px-6 py-2.5 text-sm font-semibold text-[var(--market-text)] shadow-lg hover:bg-[var(--market-accent-subtle)]"
              >
                Shop all
              </Link>
              <Link
                href="/signup"
                className="rounded-full border border-white/35 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20"
              >
                판매자 참여
              </Link>
            </div>

            <div className="mt-8 flex max-w-sm flex-col items-center gap-3">
              <button
                type="button"
                onClick={scrollToShopBelow}
                className="text-sm font-semibold text-teal-200 underline decoration-teal-300/50 underline-offset-4 hover:text-white"
              >
                쇼핑 계속하기 (카테고리·신상) ↓
              </button>
              <button
                type="button"
                onClick={() => {
                  onBackToPaperPanel?.();
                  scrollToPanel(0);
                }}
                className="text-xs font-medium text-white/50 hover:text-white/80"
              >
                ← 논문 검색 화면으로
              </button>
              <span className="text-[11px] text-white/35">또는 옆으로 스와이프</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
