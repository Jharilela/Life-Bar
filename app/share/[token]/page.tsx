import { createClient } from "@/lib/supabase/server";
import type { Medication, MedicationLog, Measurement, Visit } from "@/lib/types";
import { VisitSection } from "@/components/visit-section";
import { MedicationSection } from "@/components/medication-section";
import { VitalsSection } from "@/components/vitals-section";

type SharedMedication = Omit<Medication, "visit_id" | "created_at"> & {
  logs: Pick<MedicationLog, "log_date" | "taken">[];
};

type SharedSummary = {
  visits: Omit<Visit, "created_at">[];
  medications: SharedMedication[];
  measurements: Omit<Measurement, "note">[];
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
    <main className="max-w-3xl mx-auto px-6 py-8 pb-20">
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
      <p className="text-xs text-[var(--muted)] mb-6">
        Read-only shared summary. Ask the person who sent you this link if anything looks out of
        date.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <VisitSection visits={summary.visits as Visit[]} readOnly />
        <MedicationSection medications={medications} logsByMedication={logsByMedication} readOnly />
      </div>

      <VitalsSection measurements={summary.measurements as Measurement[]} readOnly />
    </main>
  );
}
