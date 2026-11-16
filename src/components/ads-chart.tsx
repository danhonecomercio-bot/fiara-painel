import { formatSince } from "@/lib/offers/format";
import type { SnapshotRow } from "@/lib/offers/types";

export function AdsChart({ snapshots }: { snapshots: SnapshotRow[] }) {
  const points = [...snapshots].sort((a, b) => a.captured_at.localeCompare(b.captured_at));
  if (points.length === 0) {
    return <p className="text-sm text-muted">Ainda não há histórico de anúncios.</p>;
  }

  const width = 640;
  const height = 180;
  const padLeft = 44;
  const padRight = 12;
  const padTop = 16;
  const padBottom = 28;
  const values = points.map((point) => point.total_active_ads);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min = Math.max(0, min - 1);
    max += 1;
  }
  const span = max - min || 1;
  const innerWidth = width - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;
  const coords = points.map((point, index) => {
    const x =
      points.length === 1
        ? padLeft + innerWidth / 2
        : padLeft + (index / (points.length - 1)) * innerWidth;
    const y = padTop + (1 - (point.total_active_ads - min) / span) * innerHeight;
    return { x, y, point };
  });
  const line = coords.map((coord) => `${coord.x.toFixed(1)},${coord.y.toFixed(1)}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];
  const description = `De ${first.total_active_ads} em ${formatSince(first.captured_at)} até ${last.total_active_ads} em ${formatSince(last.captured_at)}.`;

  return (
    <div className="grid gap-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby="ads-chart-title ads-chart-desc"
        className="h-44 w-full"
      >
        <title id="ads-chart-title">Anúncios ativos ao longo das leituras</title>
        <desc id="ads-chart-desc">{description}</desc>
        {[0, 0.5, 1].map((step) => {
          const y = padTop + innerHeight * step;
          const value = Math.round(max - span * step);
          return (
            <g key={step}>
              <line x1={padLeft} x2={width - padRight} y1={y} y2={y} stroke="#2a2a2a" />
              <text x={padLeft - 8} y={y + 4} textAnchor="end" fill="#d5ddd7" fontSize="11">
                {value}
              </text>
            </g>
          );
        })}
        <polyline fill="none" stroke="#e6b869" strokeWidth="2.5" points={line} />
        {coords.map((coord) => (
          <circle key={coord.point.captured_at} cx={coord.x} cy={coord.y} r="3.5" fill="#e6b869" />
        ))}
        <text x={coords[0].x} y={height - 8} textAnchor="start" fill="#ffffff" fontSize="11">
          {formatSince(first.captured_at)}
        </text>
        {points.length > 1 ? (
          <text x={coords[coords.length - 1].x} y={height - 8} textAnchor="end" fill="#ffffff" fontSize="11">
            {formatSince(last.captured_at)}
          </text>
        ) : null}
      </svg>
      <ul className="grid max-h-48 gap-1 overflow-auto text-sm">
        {[...points].reverse().map((point) => (
          <li key={point.captured_at} className="tabular-nums">
            {formatSince(point.captured_at)} — {point.total_active_ads} anúncios
          </li>
        ))}
      </ul>
    </div>
  );
}
