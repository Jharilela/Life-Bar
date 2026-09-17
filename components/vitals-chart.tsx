import type { Measurement } from "@/lib/types";

const WIDTH = 480;
const HEIGHT = 190;
const PAD_LEFT = 34;
const PAD_RIGHT = 50;
const PLOT_TOP = 14;
const PLOT_BOTTOM = 160;

function scaleY(value: number, min: number, max: number) {
  const range = max - min || 1;
  return PLOT_BOTTOM - ((value - min) / range) * (PLOT_BOTTOM - PLOT_TOP);
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
}

export function BloodPressureChart({ readings }: { readings: Measurement[] }) {
  const points = readings.slice(-8);
  if (points.length < 2) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Log at least two blood pressure readings to see a trend.
      </p>
    );
  }

  const allValues = points.flatMap((p) => [p.value, p.value_secondary ?? p.value]);
  const min = Math.min(...allValues) - 6;
  const max = Math.max(...allValues) + 6;
  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const stepX = points.length > 1 ? plotWidth / (points.length - 1) : 0;
  const xAt = (i: number) => PAD_LEFT + i * stepX;

  const sysPts = points.map((p, i) => [xAt(i), scaleY(p.value, min, max)] as const);
  const diaPts = points.map(
    (p, i) => [xAt(i), scaleY(p.value_secondary ?? p.value, min, max)] as const
  );

  const gridValues = [min + (max - min) * 0.9, min + (max - min) * 0.6, min + (max - min) * 0.3];
  const last = points[points.length - 1];

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Blood pressure over the last ${points.length} readings, most recent ${last.value} over ${last.value_secondary ?? "—"}`}
        className="w-full h-auto block"
      >
        {gridValues.map((v) => (
          <g key={v}>
            <line
              x1={PAD_LEFT}
              y1={scaleY(v, min, max)}
              x2={WIDTH - PAD_RIGHT}
              y2={scaleY(v, min, max)}
              stroke="#e7e2d2"
              strokeWidth={1}
            />
            <text
              x={PAD_LEFT - 8}
              y={scaleY(v, min, max) + 3}
              fontSize={10}
              textAnchor="end"
              fill="var(--muted)"
              fontFamily="var(--font-mono)"
            >
              {Math.round(v)}
            </text>
          </g>
        ))}

        <polyline
          points={sysPts.map(([x, y]) => `${x},${y}`).join(" ")}
          fill="none"
          stroke="var(--chart-a)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={diaPts.map(([x, y]) => `${x},${y}`).join(" ")}
          fill="none"
          stroke="var(--chart-b)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {sysPts.map(([x, y], i) => (
          <circle key={`s${i}`} cx={x} cy={y} r={i === sysPts.length - 1 ? 3.5 : 3} fill="var(--chart-a)" />
        ))}
        {diaPts.map(([x, y], i) => (
          <circle key={`d${i}`} cx={x} cy={y} r={i === diaPts.length - 1 ? 3.5 : 3} fill="var(--chart-b)" />
        ))}

        <text
          x={WIDTH - PAD_RIGHT}
          y={sysPts[sysPts.length - 1][1] - 8}
          fontSize={12}
          fontWeight={700}
          textAnchor="end"
          fill="var(--chart-a)"
          fontFamily="var(--font-mono)"
        >
          {last.value}
        </text>
        <text
          x={WIDTH - PAD_RIGHT}
          y={diaPts[diaPts.length - 1][1] + 16}
          fontSize={12}
          fontWeight={700}
          textAnchor="end"
          fill="var(--chart-b)"
          fontFamily="var(--font-mono)"
        >
          {last.value_secondary}
        </text>

        <g fontSize={10} fill="var(--muted)" textAnchor="middle" fontFamily="var(--font-mono)">
          {points.map((p, i) => (
            <text key={p.id} x={xAt(i)} y={176}>
              {formatShortDate(p.taken_at)}
            </text>
          ))}
        </g>
      </svg>
      <div className="flex gap-4 text-xs text-[var(--muted)] mt-1">
        <span>
          <span
            className="inline-block w-[9px] h-[9px] rounded-full mr-1.5 align-middle"
            style={{ background: "var(--chart-a)" }}
          />
          Systolic
        </span>
        <span>
          <span
            className="inline-block w-[9px] h-[9px] rounded-full mr-1.5 align-middle"
            style={{ background: "var(--chart-b)" }}
          />
          Diastolic
        </span>
      </div>
    </div>
  );
}
