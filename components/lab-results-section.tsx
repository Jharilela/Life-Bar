import type { LabResult } from "@/lib/types";
import { FormDialog } from "@/components/ui/form-dialog";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function openFile(getFileUrl: (path: string) => Promise<string>, filePath: string) {
  const url = await getFileUrl(filePath);
  window.open(url, "_blank", "noopener,noreferrer");
}

export function LabResultsSection({
  labResults,
  authed,
  onAddLabResult,
  onDeleteLabResult,
  onGetFileUrl,
}: {
  labResults: LabResult[];
  authed: boolean;
  onAddLabResult?: (formData: FormData) => void;
  onDeleteLabResult?: (labResult: LabResult) => void;
  onGetFileUrl?: (path: string) => Promise<string>;
}) {
  return (
    <article className="lb-card">
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <h2 className="lb-card-title mb-0">Lab Results &amp; Documents</h2>
        {authed && onAddLabResult && (
          <FormDialog title="Add a lab result" triggerLabel="Add a lab result">
            {(close) => (
              <form
                action={async (formData) => {
                  await onAddLabResult(formData);
                  close();
                }}
                className="space-y-3"
              >
                <div>
                  <label className="lb-label" htmlFor="test_name">
                    Test name
                  </label>
                  <input
                    className="lb-input"
                    id="test_name"
                    name="test_name"
                    placeholder="Complete blood count"
                    required
                  />
                </div>
                <div>
                  <label className="lb-label" htmlFor="result_date">
                    Date
                  </label>
                  <input
                    className="lb-input"
                    type="date"
                    id="result_date"
                    name="result_date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    required
                  />
                </div>
                <div>
                  <label className="lb-label" htmlFor="summary">
                    Summary
                  </label>
                  <textarea className="lb-textarea" id="summary" name="summary" />
                </div>
                <div>
                  <label className="lb-label" htmlFor="file">
                    File (PDF or image, optional)
                  </label>
                  <input
                    className="lb-input"
                    type="file"
                    id="file"
                    name="file"
                    accept="application/pdf,image/*"
                  />
                </div>
                <button type="submit" className="lb-btn lb-btn-primary w-full">
                  Save lab result
                </button>
              </form>
            )}
          </FormDialog>
        )}
      </div>

      {!authed && (
        <p className="text-sm text-[var(--muted)] mb-4">
          Sign in to store lab results and documents — this needs an account since files are kept
          in your Supabase storage, not this browser.
        </p>
      )}

      {authed && labResults.length === 0 && (
        <p className="text-sm text-[var(--muted)] mb-4">No lab results logged yet.</p>
      )}

      {authed && labResults.length > 0 && (
        <ul className="space-y-3 mb-4">
          {labResults.map((r) => (
            <li
              key={r.id}
              className="flex justify-between items-start gap-3 flex-wrap border-t border-[var(--line)] pt-3 first:border-t-0 first:pt-0"
            >
              <div>
                <span className="text-sm font-semibold">{r.test_name}</span>
                <div className="text-xs text-[var(--muted)]">{formatDate(r.result_date)}</div>
                {r.summary && <p className="text-xs text-[var(--muted)] mt-1">{r.summary}</p>}
              </div>
              <div className="flex gap-2">
                {r.file_path && onGetFileUrl && (
                  <button
                    type="button"
                    className="lb-btn text-xs"
                    onClick={() => openFile(onGetFileUrl, r.file_path!)}
                  >
                    View file
                  </button>
                )}
                {onDeleteLabResult && (
                  <button
                    type="button"
                    className="lb-btn lb-btn-danger text-xs"
                    onClick={() => onDeleteLabResult(r)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
