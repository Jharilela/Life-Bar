"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Measurement } from "@/lib/types";

export type RangeKey = "7d" | "30d" | "90d" | "all";

const RANGE_DAYS: Record<RangeKey, number | null> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: null,
};

export const RANGE_LABELS: Record<RangeKey, string> = {
  "7d": "7D",
  "30d": "30D",
  "90d": "90D",
  all: "All",
};

export function filterByRange(readings: Measurement[], range: RangeKey) {
  const days = RANGE_DAYS[range];
  if (days == null) return readings;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return readings.filter((r) => new Date(r.taken_at).getTime() >= cutoff);
}

function formatAxisDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTooltipDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CustomTooltip({
  active,
  payload,
  label,
  unit,
  secondaryLabel,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
  unit: string;
  secondaryLabel?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border-2 px-3 py-2 shadow-[3px_3px_0_0_var(--accent-soft)]"
      style={{ background: "var(--panel)", borderColor: "var(--line)" }}
    >
      <div className="text-[11px] text-[var(--muted)] mb-1">{label && formatTooltipDate(label)}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-sm font-mono tabular font-bold">
          <span
            className="inline-block w-[8px] h-[8px] rounded-full"
            style={{ background: p.color }}
          />
          {p.value}
          <span className="text-xs font-body font-normal text-[var(--muted)]">
            {unit} {secondaryLabel && payload.length > 1 ? `· ${p.name}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Interactive trend chart for a single vital. Renders one or two series
 * (e.g. blood pressure's systolic/diastolic) with a hover tooltip and a
 * gradient fill so the direction of travel reads at a glance. */
export function TrendChart({
  readings,
  unit,
  colorA = "var(--chart-a)",
  colorB,
  labelA = "Value",
  labelB,
  gradientId,
}: {
  readings: Measurement[];
  unit: string;
  colorA?: string;
  colorB?: string;
  labelA?: string;
  labelB?: string;
  gradientId: string;
}) {
  const data = useMemo(
    () =>
      readings.map((r) => ({
        date: r.taken_at,
        a: r.value,
        b: r.value_secondary ?? undefined,
      })),
    [readings]
  );

  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center h-[220px] rounded-lg text-sm text-[var(--muted)]"
        style={{ border: "1.5px dashed var(--line)" }}
      >
        Log at least two readings to see a trend.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colorA} stopOpacity={0.28} />
            <stop offset="95%" stopColor={colorA} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#e7e2d2" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatAxisDate}
          tick={{ fontSize: 10, fill: "var(--muted)", fontFamily: "var(--font-mono)" }}
          axisLine={{ stroke: "var(--line)" }}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--muted)", fontFamily: "var(--font-mono)" }}
          axisLine={false}
          tickLine={false}
          width={38}
          domain={["auto", "auto"]}
        />
        <Tooltip content={<CustomTooltip unit={unit} secondaryLabel={labelB} />} />
        {colorB && <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-body)" }} />}
        <Area
          type="monotone"
          dataKey="a"
          name={labelA}
          stroke={colorA}
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          dot={{ r: 3, fill: colorA, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
        {colorB && (
          <Line
            type="monotone"
            dataKey="b"
            name={labelB}
            stroke={colorB}
            strokeWidth={2.5}
            dot={{ r: 3, fill: colorB, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RangeToggle({
  value,
  onChange,
}: {
  value: RangeKey;
  onChange: (range: RangeKey) => void;
}) {
  const [hovered, setHovered] = useState<RangeKey | null>(null);
  const keys = Object.keys(RANGE_LABELS) as RangeKey[];

  return (
    <div className="inline-flex gap-1 p-0.5 rounded-md" style={{ background: "var(--accent-soft)" }}>
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          onMouseEnter={() => setHovered(k)}
          onMouseLeave={() => setHovered(null)}
          className="px-2 py-1 rounded text-[11px] font-bold font-mono cursor-pointer transition-colors"
          style={{
            background: value === k ? "var(--panel)" : hovered === k ? "#fffefc80" : "transparent",
            color: value === k ? "var(--accent-ink)" : "var(--muted)",
            boxShadow: value === k ? "2px 2px 0 0 var(--line)" : "none",
          }}
        >
          {RANGE_LABELS[k]}
        </button>
      ))}
    </div>
  );
}
