import { createClient } from "@/lib/supabase/client";
import type { LocalData } from "@/lib/local/store";
import type {
  Allergy,
  AllergySeverity,
  Immunization,
  Measurement,
  MeasurementType,
  Medication,
  MedicationLog,
  MedicationStatus,
  Profile,
  Visit,
  LabResult,
} from "@/lib/types";
import { daysAgoISODate } from "@/lib/dates";

export async function listAll() {
  const supabase = createClient();

  const [visitsRes, medicationsRes, measurementsRes, allergiesRes, immunizationsRes, profileRes, labResultsRes] =
    await Promise.all([
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
      supabase
        .from("allergies")
        .select("id, substance, reaction, severity, notes, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("immunizations")
        .select("id, vaccine_name, date_given, notes, created_at")
        .order("date_given", { ascending: false }),
      supabase
        .from("profile")
        .select(
          "emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, care_provider_name, care_provider_phone, pharmacy_name, pharmacy_phone"
        )
        .maybeSingle(),
      supabase
        .from("lab_results")
        .select("id, test_name, result_date, summary, file_path, created_at")
        .order("result_date", { ascending: false }),
    ]);

  const visits = (visitsRes.data ?? []) as Visit[];
  const medications = (medicationsRes.data ?? []) as Medication[];
  const measurements = (measurementsRes.data ?? []) as Measurement[];
  const allergies = (allergiesRes.data ?? []) as Allergy[];
  const immunizations = (immunizationsRes.data ?? []) as Immunization[];
  const profile = (profileRes.data ?? null) as Profile | null;
  const labResults = (labResultsRes.data ?? []) as LabResult[];

  let medicationLogs: MedicationLog[] = [];
  const medicationIds = medications.map((m) => m.id);
  if (medicationIds.length > 0) {
    const { data: logs } = await supabase
      .from("medication_logs")
      .select("id, medication_id, log_date, taken")
      .in("medication_id", medicationIds)
      .gte("log_date", daysAgoISODate(30));
    medicationLogs = (logs ?? []) as MedicationLog[];
  }

  return {
    visits,
    medications,
    medicationLogs,
    measurements,
    allergies,
    immunizations,
    profile,
    labResults,
  };
}

export async function addVisit(input: {
  visit_date: string;
  doctor_name: string;
  specialty: string | null;
  reason: string;
  notes: string | null;
}): Promise<Visit> {
  const supabase = createClient();
  const { data, error } = await supabase.from("visits").insert(input).select().single();
  if (error) throw new Error(error.message);
  return data as Visit;
}

export async function addMedication(input: {
  name: string;
  dosage: string | null;
  frequency: string | null;
  start_date: string;
  visit_id: string | null;
}): Promise<Medication> {
  const supabase = createClient();
  const { data, error } = await supabase.from("medications").insert(input).select().single();
  if (error) throw new Error(error.message);
  return data as Medication;
}

export async function setMedicationStatus(medicationId: string, status: MedicationStatus) {
  const supabase = createClient();
  const { error } = await supabase.from("medications").update({ status }).eq("id", medicationId);
  if (error) throw new Error(error.message);
}

export async function logDose(
  medicationId: string,
  logDate: string,
  taken: boolean
): Promise<MedicationLog> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("medication_logs")
    .upsert(
      { medication_id: medicationId, log_date: logDate, taken },
      { onConflict: "medication_id,log_date" }
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as MedicationLog;
}

export async function addMeasurement(input: {
  type: MeasurementType;
  label: string | null;
  value: number;
  value_secondary: number | null;
  unit: string;
  taken_at: string;
  note: string | null;
}): Promise<Measurement> {
  const supabase = createClient();
  const { data, error } = await supabase.from("measurements").insert(input).select().single();
  if (error) throw new Error(error.message);
  return data as Measurement;
}

export async function updateMeasurement(
  id: string,
  input: {
    type: MeasurementType;
    label: string | null;
    value: number;
    value_secondary: number | null;
    unit: string;
    taken_at: string;
    note: string | null;
  }
): Promise<Measurement> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("measurements")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Measurement;
}

export async function deleteMeasurement(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("measurements").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addAllergy(input: {
  substance: string;
  reaction: string | null;
  severity: AllergySeverity;
  notes: string | null;
}): Promise<Allergy> {
  const supabase = createClient();
  const { data, error } = await supabase.from("allergies").insert(input).select().single();
  if (error) throw new Error(error.message);
  return data as Allergy;
}

export async function deleteAllergy(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("allergies").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addImmunization(input: {
  vaccine_name: string;
  date_given: string;
  notes: string | null;
}): Promise<Immunization> {
  const supabase = createClient();
  const { data, error } = await supabase.from("immunizations").insert(input).select().single();
  if (error) throw new Error(error.message);
  return data as Immunization;
}

export async function deleteImmunization(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("immunizations").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setProfile(profile: Profile): Promise<Profile> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profile")
    .upsert({ ...profile, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Profile;
}

export async function addLabResult(input: {
  test_name: string;
  result_date: string;
  summary: string | null;
  file: File | null;
}): Promise<LabResult> {
  const supabase = createClient();

  let filePath: string | null = null;
  if (input.file) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in");
    filePath = `${user.id}/${crypto.randomUUID()}-${input.file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("lab-results")
      .upload(filePath, input.file);
    if (uploadError) throw new Error(uploadError.message);
  }

  const { data, error } = await supabase
    .from("lab_results")
    .insert({
      test_name: input.test_name,
      result_date: input.result_date,
      summary: input.summary,
      file_path: filePath,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as LabResult;
}

export async function deleteLabResult(labResult: LabResult) {
  const supabase = createClient();
  if (labResult.file_path) {
    await supabase.storage.from("lab-results").remove([labResult.file_path]);
  }
  const { error } = await supabase.from("lab_results").delete().eq("id", labResult.id);
  if (error) throw new Error(error.message);
}

export async function getLabResultFileUrl(filePath: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("lab-results")
    .createSignedUrl(filePath, 60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

/** Imports everything sitting in the local (logged-out) store into the now-authenticated
 * account. Throws on the first failure so the caller can leave local data untouched. */
export async function migrateLocalToRemote(local: LocalData) {
  const supabase = createClient();

  const visitIdMap = new Map<string, string>();
  for (const visit of local.visits) {
    const { data, error } = await supabase
      .from("visits")
      .insert({
        visit_date: visit.visit_date,
        doctor_name: visit.doctor_name,
        specialty: visit.specialty,
        reason: visit.reason,
        notes: visit.notes,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    visitIdMap.set(visit.id, (data as { id: string }).id);
  }

  const medicationIdMap = new Map<string, string>();
  for (const medication of local.medications) {
    const { data, error } = await supabase
      .from("medications")
      .insert({
        visit_id: medication.visit_id ? (visitIdMap.get(medication.visit_id) ?? null) : null,
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        status: medication.status,
        start_date: medication.start_date,
        end_date: medication.end_date,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    medicationIdMap.set(medication.id, (data as { id: string }).id);
  }

  for (const log of local.medicationLogs) {
    const medicationId = medicationIdMap.get(log.medication_id);
    if (!medicationId) continue;
    const { error } = await supabase
      .from("medication_logs")
      .upsert(
        { medication_id: medicationId, log_date: log.log_date, taken: log.taken },
        { onConflict: "medication_id,log_date" }
      );
    if (error) throw new Error(error.message);
  }

  for (const measurement of local.measurements) {
    const { error } = await supabase.from("measurements").insert({
      type: measurement.type,
      label: measurement.label,
      value: measurement.value,
      value_secondary: measurement.value_secondary,
      unit: measurement.unit,
      taken_at: measurement.taken_at,
      note: measurement.note,
    });
    if (error) throw new Error(error.message);
  }

  for (const allergy of local.allergies) {
    const { error } = await supabase.from("allergies").insert({
      substance: allergy.substance,
      reaction: allergy.reaction,
      severity: allergy.severity,
      notes: allergy.notes,
    });
    if (error) throw new Error(error.message);
  }

  for (const immunization of local.immunizations) {
    const { error } = await supabase.from("immunizations").insert({
      vaccine_name: immunization.vaccine_name,
      date_given: immunization.date_given,
      notes: immunization.notes,
    });
    if (error) throw new Error(error.message);
  }

  if (local.profile) {
    const { error } = await supabase
      .from("profile")
      .upsert({ ...local.profile, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
  }
}
