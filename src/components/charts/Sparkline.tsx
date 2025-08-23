import { Snapshot } from '../../types';
// Backend now handles totals computation

interface SparklineProps {
  snapshots: Snapshot[];
  width?: number;
  height?: number;
}

function formatCurrencyShort(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(0)}k`;
  return `$${Math.round(value)}`;
}

function formatMonth(dateMs: number): string {
  const d = new Date(dateMs);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export default function Sparkline({ snapshots, width = 360, height = 120 }: SparklineProps) {
  if (!snapshots || snapshots.length === 0) return null;

  const sorted = [...snapshots]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const paddingLeft = 44; // space for y-axis labels
  const paddingRight = 10;
  const paddingTop = 10;
  const paddingBottom = 24; // space for x-axis labels
  const w = width - paddingLeft - paddingRight;
  const h = height - paddingTop - paddingBottom;

  const dates = sorted.map(s => new Date(s.date).getTime());
  const values = sorted.map(s => s.totalNetWorth);
  const minX = Math.min(...dates);
  const maxX = Math.max(...dates);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const yMin = minVal === maxVal ? minVal - 1 : minVal;
  const yMax = minVal === maxVal ? maxVal + 1 : maxVal;
  const rangeY = yMax - yMin || 1;
  const rangeX = maxX - minX || 1;

  const xScale = (ms: number) => paddingLeft + ((ms - minX) / rangeX) * w;
  const yScale = (v: number) => paddingTop + (1 - (v - yMin) / rangeY) * h;

  const points = sorted.map((s, i) => {
    const x = xScale(new Date(s.date).getTime());
    const y = yScale(values[i]);
    return `${x},${y}`;
  });

  const d = points.reduce((acc, p, i) => acc + (i === 0 ? `M ${p}` : ` L ${p}`), '');

  // y-axis ticks: 4 ticks (min, ~33%, ~66%, max)
  const yTicksValues = [yMin, yMin + rangeY * 0.33, yMin + rangeY * 0.66, yMax];
  const yTicks = yTicksValues.map(v => ({ y: yScale(v), label: formatCurrencyShort(v) }));

  // x-axis ticks: first, middle, last
  const midX = minX + rangeX / 2;
  const xTicksValues = [minX, midX, maxX];
  const xTicks = xTicksValues.map(v => ({ x: xScale(v), label: formatMonth(v) }));

  return (
    <svg width={width} height={height}>
      {/* Axes */}
      <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={paddingTop + h} stroke="#e5e7eb" />
      <line x1={paddingLeft} y1={paddingTop + h} x2={paddingLeft + w} y2={paddingTop + h} stroke="#e5e7eb" />

      {/* Grid + y labels */}
      {yTicks.map((t, i) => (
        <g key={`y-${i}`}>
          <line x1={paddingLeft} y1={t.y} x2={paddingLeft + w} y2={t.y} stroke="#f3f4f6" />
          <text x={paddingLeft - 8} y={t.y} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#6b7280">
            {t.label}
          </text>
        </g>
      ))}

      {/* Path */}
      <path d={d}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={2}
      />

      {/* Points */}
      {points.map((p, i) => {
        const [x, y] = p.split(',').map(Number);
        return <circle key={i} cx={x} cy={y} r={2.5} fill="#3b82f6" />;
      })}

      {/* x labels */}
      {xTicks.map((t, i) => (
        <text key={`x-${i}`} x={t.x} y={paddingTop + h + 16} textAnchor="middle" fontSize={11} fill="#6b7280">
          {t.label}
        </text>
      ))}
    </svg>
  );
}


