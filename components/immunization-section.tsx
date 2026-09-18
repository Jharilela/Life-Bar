import type { Immunization } from "@/lib/types";
import { FormDialog } from "@/components/ui/form-dialog";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ImmunizationSection({
  immunizations,
  readOnly = false,
  onAddImmunization,
  onDeleteImmunization,
}: {
  immunizations: Immunization[];
  readOnly?: boolean;
  onAddImmunization?: (formData: FormData) => void;
  onDeleteImmunization?: (id: string) => void;
}) {
  return (
    <article className="lb-card">
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <h2 className="lb-card-title mb-0">Immunizations</h2>
        {!readOnly && onAddImmunization && (
          <FormDialog title="Add an immunization" triggerLabel="Add an immunization">
            {(close) => (
              <form
                action={async (formData) => {
                  await onAddImmunization(formData);
                  close();
                }}
                className="space-y-3"
              >
                <div>
                  <label className="lb-label" htmlFor="vaccine_name">
                    Vaccine
                  </label>
                  <input
                    className="lb-input"
                    id="vaccine_name"
                    name="vaccine_name"
                    placeholder="Tetanus booster"
                    required
                  />
                </div>
                <div>
                  <label className="lb-label" htmlFor="date_given">
                    Date given
                  </label>
                  <input
                    className="lb-input"
                    type="date"
                    id="date_given"
                    name="date_given"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    required
                  />
                </div>
                <div>
                  <label className="lb-label" htmlFor="notes">
                    Notes
                  </label>
                  <textarea className="lb-textarea" id="notes" name="notes" />
                </div>
                <button type="submit" className="lb-btn lb-btn-primary w-full">
                  Save immunization
                </button>
              </form>
            )}
          </FormDialog>
        )}
      </div>

      {immunizations.length === 0 && (
        <p className="text-sm text-[var(--muted)] mb-4">No immunizations logged yet.</p>
      )}

      {immunizations.length > 0 && (
        <ul className="space-y-3 mb-4">
          {immunizations.map((i) => (
            <li
              key={i.id}
              className="flex justify-between items-start gap-3 flex-wrap border-t border-[var(--line)] pt-3 first:border-t-0 first:pt-0"
            >
              <div>
                <span className="text-sm font-semibold">{i.vaccine_name}</span>
                <div className="text-xs text-[var(--muted)]">{formatDate(i.date_given)}</div>
                {i.notes && <p className="text-xs text-[var(--muted)] mt-1">{i.notes}</p>}
              </div>
              {!readOnly && onDeleteImmunization && (
                <button
                  type="button"
                  className="lb-btn lb-btn-danger text-xs"
                  onClick={() => onDeleteImmunization(i.id)}
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
