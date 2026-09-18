import { createClient } from "@/lib/supabase/server";
import type { Allergy, Immunization, Medication, MedicationLog, Measurement, Profile, Visit } from "@/lib/types";
import { VisitSection } from "@/components/visit-section";
import { MedicationSection } from "@/components/medication-section";
import { VitalsSection } from "@/components/vitals-section";
import { AllergySection } from "@/components/allergy-section";
import { ImmunizationSection } from "@/components/immunization-section";
import { ProfileSection } from "@/components/profile-section";

type SharedMedication = Omit<Medication, "visit_id" | "created_at"> & {
  logs: Pick<MedicationLog, "log_date" | "taken">[];
};

type SharedSummary = {
  visits: Omit<Visit, "created_at">[];
  medications: SharedMedication[];
  measurements: Omit<Measurement, "note">[];
  allergies: Allergy[];
  immunizations: Immunization[];
  profile: Profile | null;
};

export default async function SharedSummaryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_shared_summary", { p_token: token });
  const summary = data as SharedSummary | null;

  if (!summary) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="lb-card max-w-sm text-center">
          <h1 className="font-display text-sm tracking-wide text-[var(--accent-ink)] mb-2">
            LINK NOT AVAILABLE
          </h1>
          <p className="text-sm text-[var(--muted)]">
            This link is invalid, has expired, or was revoked by its owner.
          </p>
        </div>
      </main>
    );
  }

  const logsByMedication: Record<string, MedicationLog[]> = {};
  const medications: Medication[] = summary.medications.map((m) => {
    logsByMedication[m.id] = m.logs.map((l, j) => ({
      id: `${m.id}-${j}`,
      medication_id: m.id,
      log_date: l.log_date,
      taken: l.taken,
    }));
    return { ...m, visit_id: null, created_at: "" };
  });

  return (
    <main className="max-w-6xl mx-auto px-8 py-10 pb-24">
      <div className="flex items-center gap-2.5 mb-1.5" aria-hidden="true">
        <span className="flex items-end gap-[2px]">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="block w-[6px] h-[15px] rounded-[1px]"
              style={{ background: i < 4 ? "var(--accent)" : "var(--line)" }}
            />
          ))}
        </span>
        <span className="font-display text-[17px] tracking-wide">LIFEBAR</span>
      </div>
      <p className="text-xs text-[var(--muted)] mb-8">
        Read-only shared summary. Ask the person who sent you this link if anything looks out of
        date.
      </p>

      <VitalsSection measurements={summary.measurements as Measurement[]} readOnly />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <VisitSection visits={summary.visits as Visit[]} readOnly />
        <MedicationSection medications={medications} logsByMedication={logsByMedication} readOnly />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <AllergySection allergies={summary.allergies} readOnly />
        <ProfileSection profile={summary.profile} readOnly />
      </div>

      <div className="mt-6">
        <ImmunizationSection immunizations={summary.immunizations} readOnly />
      </div>
    </main>
  );
}
