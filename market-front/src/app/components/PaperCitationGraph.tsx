"use client";

import { fetchPaperGraph, type GraphNode, type PaperGraphResponse } from "@/lib/papersApi";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";

type NodeObj = GraphNode & {
  id: string;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
};

function yearToFill(year: number | null, minY: number, maxY: number): string {
  if (year == null) return "#a8a29e";
  if (maxY <= minY) return "#0f766e";
  const t = Math.max(0, Math.min(1, (year - minY) / (maxY - minY)));
  const r = Math.round(204 + (17 - 204) * t);
  const g = Math.round(251 + (94 - 251) * t);
  const b = Math.round(241 + (89 - 241) * t);
  return `rgb(${r},${g},${b})`;
}

function nodeRadius(citations: number, maxCit: number): number {
  const base = 5;
  const span = 20;
  if (maxCit <= 0) return base + span * 0.35;
  const n = Math.sqrt(citations + 1) / Math.sqrt(maxCit + 1);
  return base + n * span;
}

type Props = {
  workId: string | null;
  onSelectNode?: (node: GraphNode) => void;
};

export default function PaperCitationGraph({ workId, onSelectNode }: Props) {
  const [data, setData] = useState<PaperGraphResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 640, h: 600 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (wrapRef.current) {
        setDims({
          w: Math.max(320, wrapRef.current.clientWidth),
          h: Math.max(380, wrapRef.current.clientHeight),
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!workId) {
      setData(null);
      setErr(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErr(null);
    fetchPaperGraph(workId)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message ?? "그래프를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workId]);

  const { graphData, minYear, maxYear, maxCitations } = useMemo(() => {
    if (!data?.nodes.length) {
      return {
        graphData: { nodes: [] as NodeObj[], links: [] as { source: string; target: string }[] },
        minYear: new Date().getFullYear(),
        maxYear: new Date().getFullYear(),
        maxCitations: 1,
      };
    }
    const nodes: NodeObj[] = data.nodes.map((n) => ({ ...n, id: n.id }));
    const links = data.links.map((l) => ({ source: l.source, target: l.target }));
    const years = nodes.map((n) => n.year).filter((y): y is number => y != null);
    const minY = years.length ? Math.min(...years) : new Date().getFullYear();
    const maxY = years.length ? Math.max(...years) : minY;
    const maxC = Math.max(...nodes.map((n) => n.citations), 1);

    const leaves = nodes.filter((n) => !n.seed);
    const nLeaf = leaves.length;
    const ringR = Math.max(140, Math.min(320, 55 + nLeaf * 14));
    leaves.forEach((node, i) => {
      const a = (2 * Math.PI * i) / Math.max(nLeaf, 1) - Math.PI / 2;
      node.x = Math.cos(a) * ringR;
      node.y = Math.sin(a) * ringR;
    });
    const seedN = nodes.find((n) => n.seed);
    if (seedN) {
      seedN.x = 0;
      seedN.y = 0;
      seedN.fx = 0;
      seedN.fy = 0;
    }

    return { graphData: { nodes, links }, minYear: minY, maxYear: maxY, maxCitations: maxC };
  }, [data]);

  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);

  useEffect(() => {
    if (!graphData.nodes.length) return;
    const fg = fgRef.current;
    if (!fg?.d3Force) return;
    const ch = fg.d3Force("charge");
    if (ch?.strength) ch.strength(-580);
    const lk = fg.d3Force("link");
    if (lk?.distance) lk.distance(155);
    fg.d3ReheatSimulation?.();
  }, [graphData, dims.w, dims.h]);

  const paintNode = useCallback(
    (node: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as NodeObj;
      const x = n.x ?? 0;
      const y = n.y ?? 0;
      const r = nodeRadius(n.citations, maxCitations);
      const fill = yearToFill(n.year, minYear, maxYear);

      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = fill;
      ctx.fill();

      if (n.seed) {
        ctx.strokeStyle = "#7c3aed";
        ctx.lineWidth = Math.max(2.5, 3 / globalScale);
        ctx.stroke();
      }

      const author = n.firstAuthor?.trim() || "?";
      const yr = n.year != null ? String(n.year) : "—";
      const label = `${author}, ${yr}`;
      const fs = Math.max(9, Math.min(12, 11 / globalScale));
      ctx.font = `${fs}px system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const pad = 4 / globalScale;
      ctx.fillStyle = globalScale < 0.45 ? "rgba(68,64,60,0.85)" : "#44403c";
      ctx.fillText(label, x + r + pad, y);
    },
    [maxCitations, minYear, maxYear]
  );

  const paintPointer = useCallback(
    (node: object, color: string, ctx: CanvasRenderingContext2D) => {
      const n = node as NodeObj;
      const x = n.x ?? 0;
      const y = n.y ?? 0;
      const r = nodeRadius(n.citations, maxCitations) + 4;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    },
    [maxCitations]
  );

  const handleClick = useCallback(
    (n: object) => {
      const node = n as NodeObj;
      onSelectNode?.({
        id: node.id,
        title: node.title,
        year: node.year,
        citations: node.citations,
        doi: node.doi,
        seed: node.seed,
        firstAuthor: node.firstAuthor,
      });
    },
    [onSelectNode]
  );

  if (!workId) {
    return (
      <p className="flex flex-1 items-center justify-center p-8 text-center text-sm text-zinc-500">
        목록에서 논문을 선택한 뒤 인용 그래프를 확인하세요.
      </p>
    );
  }
  if (loading) {
    return <div className="flex min-h-[380px] flex-1 items-center justify-center text-zinc-500">OpenAlex에서 그래프 로드 중…</div>;
  }
  if (err) {
    return <div className="flex min-h-[380px] flex-1 items-center justify-center p-6 text-center text-sm text-red-600">{err}</div>;
  }
  if (!graphData.nodes.length) {
    return (
      <div className="flex min-h-[380px] flex-1 items-center justify-center p-6 text-center text-sm text-zinc-500">
        표시할 인용·피인용 연결이 없습니다. 다른 논문을 선택해 보세요.
      </div>
    );
  }

  const legendStyle = {
    background: `linear-gradient(to right, ${yearToFill(minYear, minYear, maxYear)}, ${yearToFill(maxYear, minYear, maxYear)})`,
  };

  return (
    <div ref={wrapRef} className="relative min-h-[420px] w-full flex-1 overflow-hidden rounded-lg border border-stone-200 bg-stone-100/80">
      <p className="absolute left-3 top-2 z-10 max-w-[min(100%,220px)] text-[11px] leading-snug text-stone-600">
        노드 크기 ≈ 인용 수 · 색 = 연도(옅은 틸=오래됨, 진한 틸=최근) · 보라 테두리 = 기준 논문
      </p>

      <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-md border border-stone-300 bg-white/95 px-2.5 py-2 shadow-sm">
        <p className="mb-1 text-center text-[9px] font-semibold uppercase tracking-wide text-stone-500">출판 연도</p>
        <div className="h-3 w-36 rounded-sm border border-stone-200" style={legendStyle} />
        <div className="mt-1 flex justify-between font-mono text-[10px] text-stone-600">
          <span>{minYear}</span>
          <span>{maxYear}</span>
        </div>
        <p className="mt-1.5 border-t border-stone-100 pt-1 text-[9px] text-stone-400">연도 없음: 회색</p>
      </div>

      <ForceGraph2D
        ref={fgRef}
        width={dims.w}
        height={dims.h}
        graphData={graphData}
        nodeLabel={(n: object) => (n as NodeObj).title}
        nodeCanvasObject={paintNode}
        nodeCanvasObjectMode={() => "replace"}
        nodePointerAreaPaint={paintPointer}
        linkWidth={0.9}
        linkColor={() => "rgba(120, 113, 108, 0.35)"}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={() => "rgba(120, 113, 108, 0.5)"}
        d3VelocityDecay={0.12}
        warmupTicks={280}
        cooldownTicks={220}
        onEngineStop={() => fgRef.current?.zoomToFit(500, 88)}
        onNodeClick={handleClick}
        backgroundColor="rgba(247, 246, 244, 0.98)"
      />
    </div>
  );
}
