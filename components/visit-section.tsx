import type { Medication, Visit } from "@/lib/types";
import { FormDialog } from "@/components/ui/form-dialog";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Prescribed({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  return <p className="text-xs text-[var(--muted)] mt-1">Prescribed: {names.join(", ")}</p>;
}

export function VisitSection({
  visits,
  medications = [],
  readOnly = false,
  onAddVisit,
}: {
  visits: Visit[];
  medications?: Medication[];
  readOnly?: boolean;
  onAddVisit?: (formData: FormData) => void;
}) {
  const [latest, ...rest] = visits;
  const medicationNamesByVisit = new Map<string, string[]>();
  for (const m of medications) {
    if (!m.visit_id) continue;
    const list = medicationNamesByVisit.get(m.visit_id) ?? [];
    list.push(m.name);
    medicationNamesByVisit.set(m.visit_id, list);
  }

  return (
    <article className="lb-card">
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <h2 className="lb-card-title mb-0">Visits</h2>
        {!readOnly && onAddVisit && (
          <FormDialog title="Log a visit" triggerLabel="Log a visit">
            {(close) => (
              <form
                action={async (formData) => {
                  await onAddVisit(formData);
                  close();
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="lb-label" htmlFor="visit_date">
                      Date
                    </label>
                    <input
                      className="lb-input"
                      type="date"
                      id="visit_date"
                      name="visit_date"
                      defaultValue={new Date().toISOString().slice(0, 10)}
                      required
                    />
                  </div>
                  <div>
                    <label className="lb-label" htmlFor="doctor_name">
                      Doctor
                    </label>
                    <input
                      className="lb-input"
                      id="doctor_name"
                      name="doctor_name"
                      placeholder="Dr. Maria Chen"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="lb-label" htmlFor="specialty">
                    Specialty
                  </label>
                  <input
                    className="lb-input"
                    id="specialty"
                    name="specialty"
                    placeholder="Internal Medicine"
                  />
                </div>
                <div>
                  <label className="lb-label" htmlFor="reason">
                    Reason for visit
                  </label>
                  <input
                    className="lb-input"
                    id="reason"
                    name="reason"
                    placeholder="Annual physical"
                    required
                  />
                </div>
                <div>
                  <label className="lb-label" htmlFor="notes">
                    What the doctor told you
                  </label>
                  <textarea
                    className="lb-textarea"
                    id="notes"
                    name="notes"
                    placeholder="Blood pressure slightly elevated, reduce sodium, recheck in 4 weeks…"
                  />
                </div>
                <button type="submit" className="lb-btn lb-btn-primary w-full">
                  Save visit
                </button>
              </form>
            )}
          </FormDialog>
        )}
      </div>

      {!latest && (
        <p className="text-sm text-[var(--muted)] mb-4">
          No visits logged yet.
        </p>
      )}

      {latest && (
        <div className="mb-4">
          <div className="flex justify-between gap-3 flex-wrap mb-1">
            <span className="font-mono text-xs tabular text-[var(--muted)]">
              {formatDate(latest.visit_date)}
            </span>
            <span className="text-xs text-[var(--muted)] text-right">
              {latest.doctor_name}
              {latest.specialty ? ` · ${latest.specialty}` : ""}
            </span>
          </div>
          <h3 className="text-[17px] font-bold mb-2">{latest.reason}</h3>
          {latest.notes && (
            <p className="text-[13.5px] leading-relaxed opacity-85">
              &ldquo;{latest.notes}&rdquo;
            </p>
          )}
          <Prescribed names={medicationNamesByVisit.get(latest.id) ?? []} />
        </div>
      )}

      {rest.length > 0 && (
        <details className="mb-4">
          <summary className="text-xs text-[var(--muted)] cursor-pointer">
            {rest.length} earlier visit{rest.length === 1 ? "" : "s"}
          </summary>
          <ul className="mt-3 space-y-3">
            {rest.map((v) => (
              <li key={v.id} className="border-t border-[var(--line)] pt-2">
                <div className="flex justify-between gap-3 flex-wrap mb-1">
                  <span className="font-mono text-xs tabular text-[var(--muted)]">
                    {formatDate(v.visit_date)}
                  </span>
                  <span className="text-xs text-[var(--muted)] text-right">
                    {v.doctor_name}
                    {v.specialty ? ` · ${v.specialty}` : ""}
                  </span>
                </div>
                <p className="text-sm font-semibold">{v.reason}</p>
                <Prescribed names={medicationNamesByVisit.get(v.id) ?? []} />
              </li>
            ))}
          </ul>
        </details>
      )}

    </article>
  );
}
