"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import * as local from "@/lib/local/store";
import * as remote from "@/lib/data/remote";
import type {
  Allergy,
  Immunization,
  LabResult,
  Measurement,
  Medication,
  MedicationLog,
  MedicationStatus,
  Profile,
  Visit,
} from "@/lib/types";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

const VisitSchema = z.object({
  visit_date: z.string().min(1),
  doctor_name: z.string().min(1),
  specialty: z.string().optional(),
  reason: z.string().min(1),
  notes: z.string().optional(),
});

const MedicationSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  start_date: z.string().min(1),
  visit_id: z.string().optional(),
});

const MeasurementSchema = z.object({
  type: z.enum(["blood_pressure", "glucose", "weight", "heart_rate", "temperature", "spo2", "custom"]),
  label: z.string().optional(),
  value: z.coerce.number(),
  value_secondary: z.string().optional(),
  unit: z.string().optional(),
  taken_at: z.string().min(1),
  note: z.string().optional(),
});

function parseMeasurement(formData: FormData) {
  const parsed = MeasurementSchema.parse({
    type: str(formData, "type"),
    label: str(formData, "label"),
    value: str(formData, "value"),
    value_secondary: str(formData, "value_secondary"),
    unit: str(formData, "unit"),
    taken_at: str(formData, "taken_at"),
    note: str(formData, "note"),
  });
  return {
    type: parsed.type,
    label: parsed.label || null,
    value: parsed.value,
    value_secondary: parsed.value_secondary ? Number(parsed.value_secondary) : null,
    unit: parsed.unit || "",
    taken_at: new Date(parsed.taken_at).toISOString(),
    note: parsed.note || null,
  };
}

const AllergySchema = z.object({
  substance: z.string().min(1),
  reaction: z.string().optional(),
  severity: z.enum(["mild", "moderate", "severe"]),
  notes: z.string().optional(),
});

const ImmunizationSchema = z.object({
  vaccine_name: z.string().min(1),
  date_given: z.string().min(1),
  notes: z.string().optional(),
});

export function useHealthData() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [immunizations, setImmunizations] = useState<Immunization[]>([]);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const migrating = useRef(false);

  const loadLocal = useCallback(() => {
    const data = local.getAll();
    setVisits(data.visits);
    setMedications(data.medications);
    setMedicationLogs(data.medicationLogs);
    setMeasurements(data.measurements);
    setAllergies(data.allergies);
    setImmunizations(data.immunizations);
    setProfileState(data.profile);
    setLabResults([]);
  }, []);

  const loadRemote = useCallback(async () => {
    const data = await remote.listAll();
    setVisits(data.visits);
    setMedications(data.medications);
    setMedicationLogs(data.medicationLogs);
    setMeasurements(data.measurements);
    setAllergies(data.allergies);
    setImmunizations(data.immunizations);
    setProfileState(data.profile);
    setLabResults(data.labResults);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) =>
      setSession(data.session)
    );

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event: string, newSession: Session | null) => {
        setSession(newSession);
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;

    if (!session) {
      // localStorage is synchronous and unsubscribable; there's no external-store
      // event to defer this to, so the read has to land directly here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadLocal();
      return;
    }

    if (local.hasData() && !migrating.current) {
      migrating.current = true;
      const pending = local.getAll();
      remote
        .migrateLocalToRemote(pending)
        .then(() => {
          local.clear();
          setImportError(null);
          return loadRemote();
        })
        .catch((err) => setImportError(err instanceof Error ? err.message : String(err)))
        .finally(() => {
          migrating.current = false;
        });
      return;
    }

    loadRemote();
  }, [session, loadLocal, loadRemote]);

  const authed = Boolean(session);

  const addVisit = useCallback(
    async (formData: FormData) => {
      const parsed = VisitSchema.parse({
        visit_date: str(formData, "visit_date"),
        doctor_name: str(formData, "doctor_name"),
        specialty: str(formData, "specialty"),
        reason: str(formData, "reason"),
        notes: str(formData, "notes"),
      });
      const input = {
        visit_date: parsed.visit_date,
        doctor_name: parsed.doctor_name,
        specialty: parsed.specialty || null,
        reason: parsed.reason,
        notes: parsed.notes || null,
      };
      const visit = authed ? await remote.addVisit(input) : local.addVisit(input);
      setVisits((prev) => [visit, ...prev]);
    },
    [authed]
  );

  const addMedication = useCallback(
    async (formData: FormData) => {
      const parsed = MedicationSchema.parse({
        name: str(formData, "name"),
        dosage: str(formData, "dosage"),
        frequency: str(formData, "frequency"),
        start_date: str(formData, "start_date"),
        visit_id: str(formData, "visit_id"),
      });
      const input = {
        name: parsed.name,
        dosage: parsed.dosage || null,
        frequency: parsed.frequency || null,
        start_date: parsed.start_date,
        visit_id: parsed.visit_id || null,
      };
      const medication = authed ? await remote.addMedication(input) : local.addMedication(input);
      setMedications((prev) => [medication, ...prev]);
    },
    [authed]
  );

  const setMedicationStatus = useCallback(
    async (medicationId: string, status: MedicationStatus) => {
      if (authed) await remote.setMedicationStatus(medicationId, status);
      else local.setMedicationStatus(medicationId, status);
      setMedications((prev) => prev.map((m) => (m.id === medicationId ? { ...m, status } : m)));
    },
    [authed]
  );

  const logDose = useCallback(
    async (formData: FormData) => {
      const medicationId = str(formData, "medication_id");
      const logDate = str(formData, "log_date");
      const taken = str(formData, "taken") === "true";
      const log = authed
        ? await remote.logDose(medicationId, logDate, taken)
        : local.logDose(medicationId, logDate, taken);
      setMedicationLogs((prev) => [
        ...prev.filter((l) => !(l.medication_id === medicationId && l.log_date === logDate)),
        log,
      ]);
    },
    [authed]
  );

  const addMeasurement = useCallback(
    async (formData: FormData) => {
      const input = parseMeasurement(formData);
      const measurement = authed ? await remote.addMeasurement(input) : local.addMeasurement(input);
      setMeasurements((prev) =>
        [measurement, ...prev].sort((a, b) => (a.taken_at < b.taken_at ? 1 : -1))
      );
    },
    [authed]
  );

  const updateMeasurement = useCallback(
    async (id: string, formData: FormData) => {
      const input = parseMeasurement(formData);
      const measurement = authed
        ? await remote.updateMeasurement(id, input)
        : local.updateMeasurement(id, input);
      setMeasurements((prev) =>
        prev.map((m) => (m.id === id ? measurement : m)).sort((a, b) => (a.taken_at < b.taken_at ? 1 : -1))
      );
    },
    [authed]
  );

  const deleteMeasurement = useCallback(
    async (id: string) => {
      if (authed) await remote.deleteMeasurement(id);
      else local.deleteMeasurement(id);
      setMeasurements((prev) => prev.filter((m) => m.id !== id));
    },
    [authed]
  );

  const addAllergy = useCallback(
    async (formData: FormData) => {
      const parsed = AllergySchema.parse({
        substance: str(formData, "substance"),
        reaction: str(formData, "reaction"),
        severity: str(formData, "severity"),
        notes: str(formData, "notes"),
      });
      const input = {
        substance: parsed.substance,
        reaction: parsed.reaction || null,
        severity: parsed.severity,
        notes: parsed.notes || null,
      };
      const allergy = authed ? await remote.addAllergy(input) : local.addAllergy(input);
      setAllergies((prev) => [allergy, ...prev]);
    },
    [authed]
  );

  const deleteAllergy = useCallback(
    async (id: string) => {
      if (authed) await remote.deleteAllergy(id);
      else local.deleteAllergy(id);
      setAllergies((prev) => prev.filter((a) => a.id !== id));
    },
    [authed]
  );

  const addImmunization = useCallback(
    async (formData: FormData) => {
      const parsed = ImmunizationSchema.parse({
        vaccine_name: str(formData, "vaccine_name"),
        date_given: str(formData, "date_given"),
        notes: str(formData, "notes"),
      });
      const input = {
        vaccine_name: parsed.vaccine_name,
        date_given: parsed.date_given,
        notes: parsed.notes || null,
      };
      const immunization = authed
        ? await remote.addImmunization(input)
        : local.addImmunization(input);
      setImmunizations((prev) =>
        [immunization, ...prev].sort((a, b) => (a.date_given < b.date_given ? 1 : -1))
      );
    },
    [authed]
  );

  const deleteImmunization = useCallback(
    async (id: string) => {
      if (authed) await remote.deleteImmunization(id);
      else local.deleteImmunization(id);
      setImmunizations((prev) => prev.filter((i) => i.id !== id));
    },
    [authed]
  );

  const saveProfile = useCallback(
    async (formData: FormData) => {
      const input: Profile = {
        emergency_contact_name: str(formData, "emergency_contact_name") || null,
        emergency_contact_phone: str(formData, "emergency_contact_phone") || null,
        emergency_contact_relationship: str(formData, "emergency_contact_relationship") || null,
        care_provider_name: str(formData, "care_provider_name") || null,
        care_provider_phone: str(formData, "care_provider_phone") || null,
        pharmacy_name: str(formData, "pharmacy_name") || null,
        pharmacy_phone: str(formData, "pharmacy_phone") || null,
      };
      const saved = authed ? await remote.setProfile(input) : local.setProfile(input);
      setProfileState(saved);
    },
    [authed]
  );

  const addLabResult = useCallback(async (formData: FormData) => {
    const testName = str(formData, "test_name");
    const resultDate = str(formData, "result_date");
    const summary = str(formData, "summary");
    const fileEntry = formData.get("file");
    const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;
    const labResult = await remote.addLabResult({
      test_name: testName,
      result_date: resultDate,
      summary: summary || null,
      file,
    });
    setLabResults((prev) =>
      [labResult, ...prev].sort((a, b) => (a.result_date < b.result_date ? 1 : -1))
    );
  }, []);

  const deleteLabResult = useCallback(async (labResult: LabResult) => {
    await remote.deleteLabResult(labResult);
    setLabResults((prev) => prev.filter((l) => l.id !== labResult.id));
  }, []);

  return {
    session,
    authed,
    loading: session === undefined,
    visits,
    medications,
    medicationLogs,
    measurements,
    allergies,
    immunizations,
    profile,
    labResults,
    importError,
    addVisit,
    addMedication,
    setMedicationStatus,
    logDose,
    addMeasurement,
    updateMeasurement,
    deleteMeasurement,
    addAllergy,
    deleteAllergy,
    addImmunization,
    deleteImmunization,
    saveProfile,
    addLabResult,
    deleteLabResult,
  };
}
