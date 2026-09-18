import type { Allergy, AllergySeverity } from "@/lib/types";
import { ALLERGY_SEVERITY_BADGE } from "@/lib/types";
import { FormDialog } from "@/components/ui/form-dialog";

export function AllergySection({
  allergies,
  readOnly = false,
  onAddAllergy,
  onDeleteAllergy,
}: {
  allergies: Allergy[];
  readOnly?: boolean;
  onAddAllergy?: (formData: FormData) => void;
  onDeleteAllergy?: (id: string) => void;
}) {
  return (
    <article className="lb-card">
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <h2 className="lb-card-title mb-0">Allergies</h2>
        {!readOnly && onAddAllergy && (
          <FormDialog title="Add an allergy" triggerLabel="Add an allergy">
            {(close) => (
              <form
                action={async (formData) => {
                  await onAddAllergy(formData);
                  close();
                }}
                className="space-y-3"
              >
                <div>
                  <label className="lb-label" htmlFor="substance">
                    Substance
                  </label>
                  <input
                    className="lb-input"
                    id="substance"
                    name="substance"
                    placeholder="Penicillin"
                    required
                  />
                </div>
                <div>
                  <label className="lb-label" htmlFor="reaction">
                    Reaction
                  </label>
                  <input className="lb-input" id="reaction" name="reaction" placeholder="Hives, swelling" />
                </div>
                <div>
                  <label className="lb-label" htmlFor="severity">
                    Severity
                  </label>
                  <select className="lb-select" id="severity" name="severity" defaultValue="mild">
                    {(["mild", "moderate", "severe"] as AllergySeverity[]).map((s) => (
                      <option key={s} value={s}>
                        {s[0].toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="lb-label" htmlFor="notes">
                    Notes
                  </label>
                  <textarea className="lb-textarea" id="notes" name="notes" />
                </div>
                <button type="submit" className="lb-btn lb-btn-primary w-full">
                  Save allergy
                </button>
              </form>
            )}
          </FormDialog>
        )}
      </div>

      {allergies.length === 0 && (
        <p className="text-sm text-[var(--muted)] mb-4">No allergies logged yet.</p>
      )}

      {allergies.length > 0 && (
        <ul className="space-y-3 mb-4">
          {allergies.map((a) => (
            <li
              key={a.id}
              className="flex justify-between items-start gap-3 flex-wrap border-t border-[var(--line)] pt-3 first:border-t-0 first:pt-0"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">{a.substance}</span>
                  <span className={`lb-badge ${ALLERGY_SEVERITY_BADGE[a.severity]}`}>
                    {a.severity}
                  </span>
                </div>
                {a.reaction && <p className="text-xs text-[var(--muted)]">{a.reaction}</p>}
                {a.notes && <p className="text-xs text-[var(--muted)] mt-1">{a.notes}</p>}
              </div>
              {!readOnly && onDeleteAllergy && (
                <button
                  type="button"
                  className="lb-btn lb-btn-danger text-xs"
                  onClick={() => onDeleteAllergy(a.id)}
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
