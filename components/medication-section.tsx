"use client";

import { useState } from "react";
import type { Medication, MedicationLog, MedicationStatus, Visit } from "@/lib/types";
import { MEDICATION_FREQUENCIES } from "@/lib/types";
import { computeAdherence } from "@/lib/adherence";
import { FormDialog } from "@/components/ui/form-dialog";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatVisitDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function AdherencePips({ logs, windowDays }: { logs: MedicationLog[]; windowDays: number }) {
  const byDate = new Map(logs.map((l) => [l.log_date, l.taken]));
  const days: { key: string; missed: boolean; logged: boolean }[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - (windowDays - 1));

  for (let i = 0; i < windowDays; i++) {
    const key = cursor.toISOString().slice(0, 10);
    const taken = byDate.get(key);
    days.push({ key, logged: taken !== undefined, missed: taken === false });
    cursor.setDate(cursor.getDate() + 1);
  }

  return (
    <div className="lb-pip-row" aria-hidden="true">
      {days.map((d) => (
        <span
          key={d.key}
          className="lb-pip"
          data-missed={d.logged && d.missed ? "true" : "false"}
          style={!d.logged ? { background: "transparent", border: "1px solid var(--line)" } : undefined}
        />
      ))}
    </div>
  );
}

function MedicationCard({
  medication,
  logs,
  visit,
  onLogDose,
  onSetStatus,
}: {
  medication: Medication;
  logs: MedicationLog[];
  visit?: Visit;
  onLogDose?: (formData: FormData) => void;
  onSetStatus?: (medicationId: string, status: MedicationStatus) => void;
}) {
  const adherence = computeAdherence(logs, 30);
  const today = todayKey();
  const takenToday = logs.find((l) => l.log_date === today)?.taken === true;

  return (
    <li className="border-t border-[var(--line)] pt-3 first:border-t-0 first:pt-0">
      <div className="flex justify-between items-baseline gap-3 flex-wrap mb-1">
        <span className="text-[15px] font-bold">
          {medication.name}
          {medication.dosage ? ` ${medication.dosage}` : ""}
        </span>
        <span className="text-xs text-[var(--muted)]">
          {medication.frequency || "As directed"}
        </span>
      </div>
      {visit && (
        <p className="text-xs text-[var(--muted)] mb-2">
          from visit: {visit.reason}, {formatVisitDate(visit.visit_date)}
        </p>
      )}

      {medication.status === "active" ? (
        <>
          <div className="flex gap-4 items-baseline flex-wrap mb-2 text-[13px]">
            <span>
              <strong className="font-mono text-[15px] text-[var(--accent-ink)]">
                {adherence.streakDays}
              </strong>{" "}
              day streak
            </span>
            <span className="font-mono font-bold tabular">
              {adherence.completionPct}%{" "}
              <small className="font-body font-normal text-[var(--muted)]">
                ({adherence.windowDays} days)
              </small>
            </span>
          </div>
          <AdherencePips logs={logs} windowDays={30} />
          {onLogDose && onSetStatus && (
            <div className="flex gap-2 mt-3">
              <form action={onLogDose}>
                <input type="hidden" name="medication_id" value={medication.id} />
                <input type="hidden" name="log_date" value={today} />
                <input type="hidden" name="taken" value="true" />
                <button
                  type="submit"
                  className="lb-btn text-xs"
                  style={
                    takenToday
                      ? { background: "var(--good-soft)", borderColor: "var(--good)", color: "#4d6b3a" }
                      : undefined
                  }
                >
                  {takenToday ? "✓ Taken today" : "Mark taken today"}
                </button>
              </form>
              {takenToday && (
                <form action={onLogDose}>
                  <input type="hidden" name="medication_id" value={medication.id} />
                  <input type="hidden" name="log_date" value={today} />
                  <input type="hidden" name="taken" value="false" />
                  <button type="submit" className="lb-btn lb-btn-ghost text-xs">
                    Undo
                  </button>
                </form>
              )}
              <button
                type="button"
                className="lb-btn lb-btn-ghost text-xs"
                onClick={() => onSetStatus(medication.id, "completed")}
              >
                Mark completed
              </button>
            </div>
          )}
        </>
      ) : (
        <span
          className={`lb-badge ${medication.status === "completed" ? "lb-badge-good" : "lb-badge-critical"}`}
        >
          {medication.status === "completed" ? "Completed" : "Stopped"}
        </span>
      )}
    </li>
  );
}

function AddMedicationForm({
  visits,
  onAddMedication,
  onDone,
}: {
  visits: Visit[];
  onAddMedication: (formData: FormData) => void;
  onDone: () => void;
}) {
  const [frequency, setFrequency] = useState<string>(MEDICATION_FREQUENCIES[0]);

  return (
    <form
      action={async (formData) => {
        await onAddMedication(formData);
        onDone();
      }}
      className="space-y-3"
    >
      <div>
        <label className="lb-label" htmlFor="name">
          Name
        </label>
        <input className="lb-input" id="name" name="name" placeholder="Lisinopril" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="lb-label" htmlFor="dosage">
            Dosage
          </label>
          <input className="lb-input" id="dosage" name="dosage" placeholder="10mg" />
        </div>
        <div>
          <label className="lb-label" htmlFor="frequency_preset">
            Frequency
          </label>
          <select
            className="lb-select"
            id="frequency_preset"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          >
            {MEDICATION_FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>
      {frequency === "Custom" ? (
        <div>
          <label className="lb-label" htmlFor="frequency">
            Custom frequency
          </label>
          <input className="lb-input" id="frequency" name="frequency" placeholder="Every other day" required />
        </div>
      ) : (
        <input type="hidden" name="frequency" value={frequency} />
      )}
      <div>
        <label className="lb-label" htmlFor="start_date">
          Start date
        </label>
        <input
          className="lb-input"
          type="date"
          id="start_date"
          name="start_date"
          defaultValue={todayKey()}
          required
        />
      </div>
      {visits.length > 0 && (
        <div>
          <label className="lb-label" htmlFor="visit_id">
            Prescribed at visit
          </label>
          <select className="lb-select" id="visit_id" name="visit_id" defaultValue="">
            <option value="">No linked visit</option>
            {visits.map((v) => (
              <option key={v.id} value={v.id}>
                {v.reason} — {formatVisitDate(v.visit_date)}
              </option>
            ))}
          </select>
        </div>
      )}
      <button type="submit" className="lb-btn lb-btn-primary w-full">
        Save medication
      </button>
    </form>
  );
}

export function MedicationSection({
  medications,
  logsByMedication,
  visits = [],
  readOnly = false,
  onAddMedication,
  onLogDose,
  onSetStatus,
}: {
  medications: Medication[];
  logsByMedication: Record<string, MedicationLog[]>;
  visits?: Visit[];
  readOnly?: boolean;
  onAddMedication?: (formData: FormData) => void;
  onLogDose?: (formData: FormData) => void;
  onSetStatus?: (medicationId: string, status: MedicationStatus) => void;
}) {
  const active = medications.filter((m) => m.status === "active");
  const inactive = medications.filter((m) => m.status !== "active");
  const visitsById = new Map(visits.map((v) => [v.id, v]));

  return (
    <article className="lb-card">
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <h2 className="lb-card-title mb-0">Medications</h2>
        {!readOnly && onAddMedication && (
          <FormDialog title="Add a medication" triggerLabel="Add a medication">
            {(close) => (
              <AddMedicationForm visits={visits} onAddMedication={onAddMedication} onDone={close} />
            )}
          </FormDialog>
        )}
      </div>

      {medications.length === 0 && (
        <p className="text-sm text-[var(--muted)] mb-4">
          No medications logged yet.
        </p>
      )}

      {active.length > 0 && (
        <ul className="space-y-3 mb-2">
          {active.map((m) => (
            <MedicationCard
              key={m.id}
              medication={m}
              logs={logsByMedication[m.id] ?? []}
              visit={m.visit_id ? visitsById.get(m.visit_id) : undefined}
              onLogDose={onLogDose}
              onSetStatus={onSetStatus}
            />
          ))}
        </ul>
      )}

      {inactive.length > 0 && (
        <details className="mb-4 mt-3">
          <summary className="text-xs text-[var(--muted)] cursor-pointer">
            {inactive.length} completed / stopped
          </summary>
          <ul className="mt-3 space-y-3">
            {inactive.map((m) => (
              <MedicationCard
                key={m.id}
                medication={m}
                logs={logsByMedication[m.id] ?? []}
                visit={m.visit_id ? visitsById.get(m.visit_id) : undefined}
                onLogDose={onLogDose}
                onSetStatus={onSetStatus}
              />
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
