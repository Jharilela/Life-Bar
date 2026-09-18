"use client";

import { useMemo, useState } from "react";
import type { Measurement, MeasurementType } from "@/lib/types";
import { MEASUREMENT_LABELS, MEASUREMENT_UNITS } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormDialog } from "@/components/ui/form-dialog";
import { RangeToggle, TrendChart, filterByRange, type RangeKey } from "@/components/vitals-chart";
import { MeasurementForm } from "@/components/measurement-form";

const VITAL_TABS: MeasurementType[] = [
  "weight",
  "blood_pressure",
  "glucose",
  "heart_rate",
  "temperature",
  "spo2",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function StatTile({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="lb-stat-tile">
      <div className="text-[10px] text-[var(--muted)] uppercase tracking-wide">{label}</div>
      <div className="font-mono text-base font-bold tabular">
        {value}
        {unit && <span className="text-[11px] font-body font-normal text-[var(--muted)] ml-1">{unit}</span>}
      </div>
    </div>
  );
}

function HistoryRow({
  measurement,
  onUpdateMeasurement,
  onDeleteMeasurement,
}: {
  measurement: Measurement;
  onUpdateMeasurement?: (id: string, formData: FormData) => void;
  onDeleteMeasurement?: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="border-t border-[var(--line)] pt-3 first:border-t-0 first:pt-0">
        <MeasurementForm
          initial={measurement}
          submitLabel="Save changes"
          onCancel={() => setEditing(false)}
          onSubmit={(formData) => {
            onUpdateMeasurement?.(measurement.id, formData);
            setEditing(false);
          }}
        />
      </li>
    );
  }

  return (
    <li className="flex justify-between items-center gap-3 flex-wrap border-t border-[var(--line)] pt-2 first:border-t-0 first:pt-0">
      <div className="text-sm">
        <span className="font-mono tabular font-bold">
          {measurement.value}
          {measurement.value_secondary != null ? `/${measurement.value_secondary}` : ""}{" "}
        </span>
        <span className="text-xs text-[var(--muted)]">
          {measurement.unit} · {formatDate(measurement.taken_at)}
          {measurement.note ? ` · ${measurement.note}` : ""}
        </span>
      </div>
      {(onUpdateMeasurement || onDeleteMeasurement) && (
        <div className="flex gap-2">
          {onUpdateMeasurement && (
            <button type="button" className="lb-btn lb-btn-ghost text-xs" onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
          {onDeleteMeasurement && (
            <button
              type="button"
              className="lb-btn lb-btn-danger text-xs"
              onClick={() => onDeleteMeasurement(measurement.id)}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function VitalPanel({
  type,
  readings,
  onUpdateMeasurement,
  onDeleteMeasurement,
}: {
  type: MeasurementType;
  readings: Measurement[];
  onUpdateMeasurement?: (id: string, formData: FormData) => void;
  onDeleteMeasurement?: (id: string) => void;
}) {
  const [range, setRange] = useState<RangeKey>("30d");
  const ascending = useMemo(() => readings.slice().reverse(), [readings]);
  const ranged = useMemo(() => filterByRange(ascending, range), [ascending, range]);
  const unit = MEASUREMENT_UNITS[type];
  const isBp = type === "blood_pressure";

  const latest = ascending[ascending.length - 1];
  const previous = ascending[ascending.length - 2];
  const values = ranged.map((r) => r.value);
  const min = values.length ? Math.min(...values) : null;
  const max = values.length ? Math.max(...values) : null;
  const avg = values.length ? round1(values.reduce((a, b) => a + b, 0) / values.length) : null;
  const delta = latest && previous ? round1(latest.value - previous.value) : null;

  return (
    <div>
      <div className="flex justify-between items-start flex-wrap gap-3 mb-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tabular" style={{ color: "var(--accent-ink)" }}>
              {latest ? latest.value : "—"}
              {isBp && latest?.value_secondary != null && (
                <span className="text-xl">/{latest.value_secondary}</span>
              )}
            </span>
            <span className="text-sm text-[var(--muted)]">{unit}</span>
            {delta != null && delta !== 0 && !isBp && (
              <span
                className="lb-badge"
                style={{
                  background: delta > 0 ? "var(--warn-soft)" : "var(--good-soft)",
                  color: delta > 0 ? "#8a5a1f" : "#4d6b3a",
                }}
              >
                {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}
              </span>
            )}
          </div>
          <div className="text-xs text-[var(--muted)] mt-0.5">
            {latest ? `Latest · ${formatDate(latest.taken_at)}` : "No readings yet"}
          </div>
        </div>
        <RangeToggle value={range} onChange={setRange} />
      </div>

      <TrendChart
        readings={ranged}
        unit={unit}
        gradientId={`grad-${type}`}
        colorA="var(--chart-a)"
        colorB={isBp ? "var(--chart-b)" : undefined}
        labelA={isBp ? "Systolic" : MEASUREMENT_LABELS[type]}
        labelB={isBp ? "Diastolic" : undefined}
      />

      {values.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          <StatTile label="Min" value={String(min)} unit={unit} />
          <StatTile label="Avg" value={String(avg)} unit={unit} />
          <StatTile label="Max" value={String(max)} unit={unit} />
        </div>
      )}

      {readings.length > 0 && (
        <details className="mt-4">
          <summary className="text-xs text-[var(--muted)] cursor-pointer">
            {readings.length} reading{readings.length === 1 ? "" : "s"} logged
          </summary>
          <ul className="mt-3 space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {readings.map((m) => (
              <HistoryRow
                key={m.id}
                measurement={m}
                onUpdateMeasurement={onUpdateMeasurement}
                onDeleteMeasurement={onDeleteMeasurement}
              />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export function VitalsSection({
  measurements,
  readOnly = false,
  onAddMeasurement,
  onUpdateMeasurement,
  onDeleteMeasurement,
}: {
  measurements: Measurement[];
  readOnly?: boolean;
  onAddMeasurement?: (formData: FormData) => void;
  onUpdateMeasurement?: (id: string, formData: FormData) => void;
  onDeleteMeasurement?: (id: string) => void;
}) {
  const byType = useMemo(() => {
    const map = new Map<MeasurementType, Measurement[]>();
    for (const m of measurements) {
      const list = map.get(m.type) ?? [];
      list.push(m);
      map.set(m.type, list);
    }
    return map;
  }, [measurements]);

  const availableTabs = VITAL_TABS.filter((t) => (byType.get(t)?.length ?? 0) > 0);
  const defaultTab = availableTabs[0] ?? "weight";
  const [activeTab, setActiveTab] = useState<MeasurementType>(defaultTab);

  return (
    <article className="lb-card">
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <h2 className="lb-card-title mb-0">Vitals</h2>
        {!readOnly && onAddMeasurement && (
          <FormDialog title="Log a reading" triggerLabel="Log a reading" triggerClassName="lb-btn lb-btn-primary text-xs">
            {(close) => (
              <MeasurementForm
                defaultType={activeTab}
                onSubmit={(formData) => {
                  onAddMeasurement(formData);
                  close();
                }}
              />
            )}
          </FormDialog>
        )}
      </div>

      {measurements.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          No measurements logged yet. Log a weight, blood pressure, or glucose reading to see it
          charted here.
        </p>
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MeasurementType)}>
          <TabsList>
            {availableTabs.map((t) => (
              <TabsTrigger key={t} value={t}>
                {MEASUREMENT_LABELS[t]}
              </TabsTrigger>
            ))}
          </TabsList>
          {availableTabs.map((t) => (
            <TabsContent key={t} value={t}>
              <VitalPanel
                type={t}
                readings={byType.get(t) ?? []}
                onUpdateMeasurement={onUpdateMeasurement}
                onDeleteMeasurement={onDeleteMeasurement}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </article>
  );
}
