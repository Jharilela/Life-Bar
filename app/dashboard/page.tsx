import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Medication, MedicationLog, Measurement, Visit } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { VisitSection } from "@/components/visit-section";
import { MedicationSection } from "@/components/medication-section";
import { VitalsSection } from "@/components/vitals-section";
import { daysAgoISODate } from "@/lib/dates";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/");
  }

  const [visitsRes, medicationsRes, measurementsRes] = await Promise.all([
    supabase
      .from("visits")
      .select("id, visit_date, doctor_name, specialty, reason, notes, created_at")
      .order("visit_date", { ascending: false })
      .limit(20),
    supabase
      .from("medications")
      .select("id, visit_id, name, dosage, frequency, status, start_date, end_date, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("measurements")
      .select("id, type, label, value, value_secondary, unit, taken_at, note")
      .order("taken_at", { ascending: false })
      .limit(60),
  ]);

  const visits = (visitsRes.data ?? []) as Visit[];
  const medications = (medicationsRes.data ?? []) as Medication[];
  const measurements = (measurementsRes.data ?? []) as Measurement[];

  const medicationIds = medications.map((m) => m.id);
  const logsByMedication: Record<string, MedicationLog[]> = {};
  if (medicationIds.length > 0) {
    const thirtyDaysAgo = daysAgoISODate(30);
    const { data: logs } = await supabase
      .from("medication_logs")
      .select("id, medication_id, log_date, taken")
      .in("medication_id", medicationIds)
      .gte("log_date", thirtyDaysAgo);

    for (const log of (logs ?? []) as MedicationLog[]) {
      (logsByMedication[log.medication_id] ??= []).push(log);
    }
  }

  const displayName =
    userData.user.user_metadata?.full_name ??
    userData.user.user_metadata?.name ??
    userData.user.email ??
    "there";
  const firstName = String(displayName).split(" ")[0].split("@")[0];

  return (
    <main className="max-w-3xl mx-auto px-6 py-8 pb-20">
      <AppHeader greeting={`Welcome back, ${firstName}`} />

      <div className="grid sm:grid-cols-2 gap-4 mt-6 mb-4">
        <VisitSection visits={visits} />
        <MedicationSection medications={medications} logsByMedication={logsByMedication} />
      </div>

      <VitalsSection measurements={measurements} />
    </main>
  );
}
