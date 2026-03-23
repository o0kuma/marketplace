"use client";

export interface DailyTrendPoint {
  date: string;
  orderCount: number;
  sales: number;
}

function formatShortDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${m}/${d}`;
}

/** Bar chart: daily order count (last 14 days). */
export function OrdersBarChart({ data }: { data: DailyTrendPoint[] }) {
  if (!data.length) return null;
  const max = Math.max(1, ...data.map((p) => p.orderCount));
  const h = 120;
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-[320px] items-end gap-1" style={{ height: h + 37 }}>
        {data.map((p) => {
          const barH = Math.round((p.orderCount / max) * h);
          return (
            <div key={p.date} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] font-medium text-[var(--market-text-muted)]">{p.orderCount > 0 ? p.orderCount : ""}</span>
              <div
                className="w-full max-w-[28px] rounded-t bg-[var(--market-accent)] transition-[height] duration-300"
                style={{ height: Math.max(barH, 2), minHeight: p.orderCount > 0 ? 4 : 2 }}
                title={`${p.date}: ${p.orderCount}건`}
              />
              <span className="text-[9px] text-[var(--market-text-muted)]">{formatShortDate(p.date)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Line chart: daily sales (SVG, normalized height). */
export function SalesLineChart({ data }: { data: DailyTrendPoint[] }) {
  if (!data.length) return null;
  const w = 560;
  const h = 120;
  const pad = 8;
  const maxSales = Math.max(1, ...data.map((p) => p.sales));
  const n = data.length;
  const step = (w - pad * 2) / Math.max(1, n - 1);
  const points = data.map((p, i) => {
    const x = pad + i * step;
    const y = h - pad - (p.sales / maxSales) * (h - pad * 2);
    return `${x},${y}`;
  });
  const pathD = `M ${points.join(" L ")}`;
  const areaD = `${pathD} L ${pad + (n - 1) * step},${h - pad} L ${pad},${h - pad} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h + 20}`} className="h-auto w-full min-w-[320px]" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--market-secondary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--market-secondary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#salesFill)" />
        <path d={pathD} fill="none" stroke="var(--market-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((p, i) => {
          const x = pad + i * step;
          const y = h - pad - (p.sales / maxSales) * (h - pad * 2);
          return (
            <circle key={p.date} cx={x} cy={y} r={p.sales > 0 ? 3 : 1.5} fill={p.sales > 0 ? "var(--market-secondary)" : "var(--market-text-muted)"}>
              <title>{`${p.date}: ${Number(p.sales).toLocaleString()}원`}</title>
            </circle>
          );
        })}
        {data.map((p, i) => (
          <text key={`l-${p.date}`} x={pad + i * step} y={h + 14} textAnchor="middle" className="fill-[var(--market-text-muted)] text-[9px]">
            {formatShortDate(p.date)}
          </text>
        ))}
      </svg>
      <p className="mt-1 text-center text-xs text-[var(--market-text-muted)]">
        최고 일 매출 {Number(maxSales).toLocaleString()}원 (14일 구간)
      </p>
    </div>
  );
}
