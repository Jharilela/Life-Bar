import type { Profile } from "@/lib/types";
import { FormDialog } from "@/components/ui/form-dialog";

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[11px] text-[var(--muted)] uppercase tracking-wide">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

export function ProfileSection({
  profile,
  readOnly = false,
  onSaveProfile,
}: {
  profile: Profile | null;
  readOnly?: boolean;
  onSaveProfile?: (formData: FormData) => void;
}) {
  const hasAny = profile && Object.values(profile).some(Boolean);

  return (
    <article className="lb-card">
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <h2 className="lb-card-title mb-0">Emergency Contact &amp; Care Team</h2>
        {!readOnly && onSaveProfile && (
          <FormDialog
            title="Emergency contact & care team"
            triggerLabel={hasAny ? "Edit" : "Add contact & care team info"}
          >
            {(close) => (
              <form
                action={async (formData) => {
                  await onSaveProfile(formData);
                  close();
                }}
                className="space-y-3"
              >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="lb-label" htmlFor="emergency_contact_name">
                  Emergency contact
                </label>
                <input
                  className="lb-input"
                  id="emergency_contact_name"
                  name="emergency_contact_name"
                  defaultValue={profile?.emergency_contact_name ?? ""}
                />
              </div>
              <div>
                <label className="lb-label" htmlFor="emergency_contact_relationship">
                  Relationship
                </label>
                <input
                  className="lb-input"
                  id="emergency_contact_relationship"
                  name="emergency_contact_relationship"
                  defaultValue={profile?.emergency_contact_relationship ?? ""}
                />
              </div>
            </div>
            <div>
              <label className="lb-label" htmlFor="emergency_contact_phone">
                Emergency phone
              </label>
              <input
                className="lb-input"
                id="emergency_contact_phone"
                name="emergency_contact_phone"
                defaultValue={profile?.emergency_contact_phone ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="lb-label" htmlFor="care_provider_name">
                  Primary care provider
                </label>
                <input
                  className="lb-input"
                  id="care_provider_name"
                  name="care_provider_name"
                  defaultValue={profile?.care_provider_name ?? ""}
                />
              </div>
              <div>
                <label className="lb-label" htmlFor="care_provider_phone">
                  Provider phone
                </label>
                <input
                  className="lb-input"
                  id="care_provider_phone"
                  name="care_provider_phone"
                  defaultValue={profile?.care_provider_phone ?? ""}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="lb-label" htmlFor="pharmacy_name">
                  Pharmacy
                </label>
                <input
                  className="lb-input"
                  id="pharmacy_name"
                  name="pharmacy_name"
                  defaultValue={profile?.pharmacy_name ?? ""}
                />
              </div>
              <div>
                <label className="lb-label" htmlFor="pharmacy_phone">
                  Pharmacy phone
                </label>
                <input
                  className="lb-input"
                  id="pharmacy_phone"
                  name="pharmacy_phone"
                  defaultValue={profile?.pharmacy_phone ?? ""}
                />
              </div>
            </div>
                <button type="submit" className="lb-btn lb-btn-primary w-full">
                  Save
                </button>
              </form>
            )}
          </FormDialog>
        )}
      </div>

      {!hasAny && <p className="text-sm text-[var(--muted)]">Nothing on file yet.</p>}

      {hasAny && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Emergency contact" value={profile!.emergency_contact_name} />
          <Field label="Relationship" value={profile!.emergency_contact_relationship} />
          <Field label="Emergency phone" value={profile!.emergency_contact_phone} />
          <Field label="Primary care provider" value={profile!.care_provider_name} />
          <Field label="Provider phone" value={profile!.care_provider_phone} />
          <Field label="Pharmacy" value={profile!.pharmacy_name} />
          <Field label="Pharmacy phone" value={profile!.pharmacy_phone} />
        </div>
      )}
    </article>
  );
}
