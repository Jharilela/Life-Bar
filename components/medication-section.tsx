import type { Medication, MedicationLog } from "@/lib/types";
import { computeAdherence } from "@/lib/adherence";
import { Disclosure } from "@/components/disclosure";
import { addMedication, logDose, setMedicationStatus } from "@/app/dashboard/actions";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
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

function MedicationCard({ medication, logs }: { medication: Medication; logs: MedicationLog[] }) {
  const adherence = computeAdherence(logs, 30);
  const today = todayKey();
  const takenToday = logs.find((l) => l.log_date === today)?.taken === true;

  return (
    <li className="border-t border-[var(--line)] pt-3 first:border-t-0 first:pt-0">
      <div className="flex justify-between items-baseline gap-3 flex-wrap mb-2">
        <span className="text-[15px] font-bold">
          {medication.name}
          {medication.dosage ? ` ${medication.dosage}` : ""}
        </span>
        <span className="text-xs text-[var(--muted)]">
          {medication.frequency || "As directed"}
        </span>
      </div>

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
          <div className="flex gap-2 mt-3">
            <form action={logDose}>
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
              <form action={logDose}>
                <input type="hidden" name="medication_id" value={medication.id} />
                <input type="hidden" name="log_date" value={today} />
                <input type="hidden" name="taken" value="false" />
                <button type="submit" className="lb-btn lb-btn-ghost text-xs">
                  Undo
                </button>
              </form>
            )}
            <form action={setMedicationStatus.bind(null, medication.id, "completed")}>
              <button type="submit" className="lb-btn lb-btn-ghost text-xs">
                Mark completed
              </button>
            </form>
          </div>
        </>
      ) : (
        <span className="lb-badge lb-badge-warn">
          {medication.status === "completed" ? "Completed" : "Stopped"}
        </span>
      )}
    </li>
  );
}

export function MedicationSection({
  medications,
  logsByMedication,
  readOnly = false,
}: {
  medications: Medication[];
  logsByMedication: Record<string, MedicationLog[]>;
  readOnly?: boolean;
}) {
  const active = medications.filter((m) => m.status === "active");
  const inactive = medications.filter((m) => m.status !== "active");

  return (
    <article className="lb-card">
      <h2 className="lb-card-title mb-4">Medications</h2>

      {medications.length === 0 && (
        <p className="text-sm text-[var(--muted)] mb-4">
          No medications logged yet.
        </p>
      )}

      {active.length > 0 && (
        <ul className="space-y-3 mb-2">
          {active.map((m) => (
            <MedicationCard key={m.id} medication={m} logs={logsByMedication[m.id] ?? []} />
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
              <MedicationCard key={m.id} medication={m} logs={logsByMedication[m.id] ?? []} />
            ))}
          </ul>
        </details>
      )}

      {!readOnly && (
        <div className="mt-4">
          <Disclosure label="Add a medication">
            <form action={addMedication} className="space-y-3">
              <div>
                <label className="lb-label" htmlFor="name">
                  Name
                </label>
                <input
                  className="lb-input"
                  id="name"
                  name="name"
                  placeholder="Lisinopril"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="lb-label" htmlFor="dosage">
                    Dosage
                  </label>
                  <input className="lb-input" id="dosage" name="dosage" placeholder="10mg" />
                </div>
                <div>
                  <label className="lb-label" htmlFor="frequency">
                    Frequency
                  </label>
                  <input
                    className="lb-input"
                    id="frequency"
                    name="frequency"
                    placeholder="Once daily"
                  />
                </div>
              </div>
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
              <button type="submit" className="lb-btn lb-btn-primary w-full">
                Save medication
              </button>
            </form>
          </Disclosure>
        </div>
      )}
    </article>
  );
}
