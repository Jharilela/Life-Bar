"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const SHARING_PATH = "/dashboard/sharing";
const DASHBOARD_PATH = "/dashboard";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

const VisitSchema = z.object({
  visit_date: z.string().min(1),
  doctor_name: z.string().min(1),
  specialty: z.string().optional(),
  reason: z.string().min(1),
  notes: z.string().optional(),
});

export async function addVisit(formData: FormData) {
  const parsed = VisitSchema.parse({
    visit_date: str(formData, "visit_date"),
    doctor_name: str(formData, "doctor_name"),
    specialty: str(formData, "specialty"),
    reason: str(formData, "reason"),
    notes: str(formData, "notes"),
  });

  const supabase = await createClient();
  const { error } = await supabase.from("visits").insert({
    visit_date: parsed.visit_date,
    doctor_name: parsed.doctor_name,
    specialty: parsed.specialty || null,
    reason: parsed.reason,
    notes: parsed.notes || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath(DASHBOARD_PATH);
}

const MedicationSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  start_date: z.string().min(1),
  visit_id: z.string().optional(),
});

export async function addMedication(formData: FormData) {
  const parsed = MedicationSchema.parse({
    name: str(formData, "name"),
    dosage: str(formData, "dosage"),
    frequency: str(formData, "frequency"),
    start_date: str(formData, "start_date"),
    visit_id: str(formData, "visit_id"),
  });

  const supabase = await createClient();
  const { error } = await supabase.from("medications").insert({
    name: parsed.name,
    dosage: parsed.dosage || null,
    frequency: parsed.frequency || null,
    start_date: parsed.start_date,
    visit_id: parsed.visit_id || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath(DASHBOARD_PATH);
}

export async function setMedicationStatus(medicationId: string, status: "active" | "completed" | "stopped") {
  const supabase = await createClient();
  const { error } = await supabase
    .from("medications")
    .update({ status })
    .eq("id", medicationId);
  if (error) throw new Error(error.message);

  revalidatePath(DASHBOARD_PATH);
}

export async function logDose(formData: FormData) {
  const medicationId = str(formData, "medication_id");
  const logDate = str(formData, "log_date");
  const taken = str(formData, "taken") === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("medication_logs")
    .upsert(
      { medication_id: medicationId, log_date: logDate, taken },
      { onConflict: "medication_id,log_date" }
    );
  if (error) throw new Error(error.message);

  revalidatePath(DASHBOARD_PATH);
}

const MeasurementSchema = z.object({
  type: z.enum([
    "blood_pressure",
    "glucose",
    "weight",
    "heart_rate",
    "temperature",
    "spo2",
    "custom",
  ]),
  label: z.string().optional(),
  value: z.coerce.number(),
  value_secondary: z.string().optional(),
  unit: z.string().optional(),
  taken_at: z.string().min(1),
  note: z.string().optional(),
});

export async function addMeasurement(formData: FormData) {
  const parsed = MeasurementSchema.parse({
    type: str(formData, "type"),
    label: str(formData, "label"),
    value: str(formData, "value"),
    value_secondary: str(formData, "value_secondary"),
    unit: str(formData, "unit"),
    taken_at: str(formData, "taken_at"),
    note: str(formData, "note"),
  });

  const supabase = await createClient();
  const { error } = await supabase.from("measurements").insert({
    type: parsed.type,
    label: parsed.label || null,
    value: parsed.value,
    value_secondary: parsed.value_secondary ? Number(parsed.value_secondary) : null,
    unit: parsed.unit || "",
    taken_at: new Date(parsed.taken_at).toISOString(),
    note: parsed.note || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath(DASHBOARD_PATH);
}

export async function createShareLink(formData: FormData) {
  const label = str(formData, "label");
  const expiresInDays = str(formData, "expires_in_days");

  const token = randomBytes(24).toString("base64url");
  const expiresAt = expiresInDays
    ? new Date(Date.now() + Number(expiresInDays) * 86_400_000).toISOString()
    : null;

  const supabase = await createClient();
  const { error } = await supabase.from("share_links").insert({
    token,
    label: label || null,
    expires_at: expiresAt,
  });
  if (error) throw new Error(error.message);

  revalidatePath(SHARING_PATH);
}

export async function revokeShareLink(linkId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", linkId);
  if (error) throw new Error(error.message);

  revalidatePath(SHARING_PATH);
}

const EmailSchema = z.email();

export async function grantAccess(formData: FormData) {
  const email = EmailSchema.parse(str(formData, "email").toLowerCase());

  const supabase = await createClient();
  const { error } = await supabase
    .from("share_grants")
    .upsert(
      { grantee_email: email, revoked_at: null },
      { onConflict: "owner_id,grantee_email" }
    );
  if (error) throw new Error(error.message);

  revalidatePath(SHARING_PATH);
}

export async function revokeGrant(grantId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("share_grants")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", grantId);
  if (error) throw new Error(error.message);

  revalidatePath(SHARING_PATH);
}
