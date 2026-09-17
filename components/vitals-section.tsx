import type { Measurement, MeasurementType } from "@/lib/types";
import { MEASUREMENT_LABELS } from "@/lib/types";
import { BloodPressureChart } from "@/components/vitals-chart";
import { Disclosure } from "@/components/disclosure";
import { MeasurementForm } from "@/components/measurement-form";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function LatestReadings({ measurements }: { measurements: Measurement[] }) {
  const otherTypes: MeasurementType[] = ["glucose", "weight", "heart_rate", "temperature", "spo2"];
  const tiles = otherTypes
    .map((type) => measurements.find((m) => m.type === type))
    .filter((m): m is Measurement => Boolean(m));

  const customs = measurements.filter((m) => m.type === "custom").slice(0, 2);

  const all = [...tiles, ...customs];
  if (all.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
      {all.map((m) => (
        <div key={m.id} className="rounded-lg px-3 py-2" style={{ background: "var(--accent-soft)" }}>
          <div className="text-[11px] text-[var(--accent-ink)] font-semibold uppercase tracking-wide">
            {m.type === "custom" ? m.label : MEASUREMENT_LABELS[m.type]}
          </div>
          <div className="font-mono text-lg font-bold tabular">
            {m.value}
            <span className="text-xs font-body font-normal ml-1">{m.unit}</span>
          </div>
          <div className="text-[11px] text-[var(--muted)]">{formatDate(m.taken_at)}</div>
        </div>
      ))}
    </div>
  );
}

export function VitalsSection({
  measurements,
  readOnly = false,
}: {
  measurements: Measurement[];
  readOnly?: boolean;
}) {
  const bp = measurements
    .filter((m) => m.type === "blood_pressure")
    .slice()
    .reverse();

  return (
    <article className="lb-card">
      <h2 className="lb-card-title mb-4">Vitals</h2>

      {measurements.length === 0 ? (
        <p className="text-sm text-[var(--muted)] mb-4">No measurements logged yet.</p>
      ) : (
        <>
          <BloodPressureChart readings={bp} />
          <LatestReadings measurements={measurements} />
        </>
      )}

      {!readOnly && (
        <div className="mt-4">
          <Disclosure label="Log a reading">
            <MeasurementForm />
          </Disclosure>
        </div>
      )}
    </article>
  );
}
