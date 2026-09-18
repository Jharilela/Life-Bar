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
} from "@/lib/types";

const KEY = "lifebar:v1";

export type LocalData = {
  visits: Visit[];
  medications: Medication[];
  medicationLogs: MedicationLog[];
  measurements: Measurement[];
  allergies: Allergy[];
  immunizations: Immunization[];
  profile: Profile | null;
};

function emptyData(): LocalData {
  return {
    visits: [],
    medications: [],
    medicationLogs: [],
    measurements: [],
    allergies: [],
    immunizations: [],
    profile: null,
  };
}

function read(): LocalData {
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return emptyData();
  try {
    return { ...emptyData(), ...JSON.parse(raw) };
  } catch {
    return emptyData();
  }
}

function write(data: LocalData) {
  window.localStorage.setItem(KEY, JSON.stringify(data));
}

function newId() {
  return crypto.randomUUID();
}

function nowISO() {
  return new Date().toISOString();
}

export function getAll(): LocalData {
  return read();
}

export function hasData(): boolean {
  const data = read();
  return (
    data.visits.length > 0 ||
    data.medications.length > 0 ||
    data.medicationLogs.length > 0 ||
    data.measurements.length > 0 ||
    data.allergies.length > 0 ||
    data.immunizations.length > 0 ||
    data.profile !== null
  );
}

export function clear() {
  window.localStorage.removeItem(KEY);
}

export function addVisit(input: {
  visit_date: string;
  doctor_name: string;
  specialty: string | null;
  reason: string;
  notes: string | null;
}): Visit {
  const data = read();
  const visit: Visit = { id: newId(), created_at: nowISO(), ...input };
  data.visits.unshift(visit);
  write(data);
  return visit;
}

export function addMedication(input: {
  name: string;
  dosage: string | null;
  frequency: string | null;
  start_date: string;
  visit_id: string | null;
}): Medication {
  const data = read();
  const medication: Medication = {
    id: newId(),
    created_at: nowISO(),
    status: "active",
    end_date: null,
    ...input,
  };
  data.medications.unshift(medication);
  write(data);
  return medication;
}

export function setMedicationStatus(medicationId: string, status: MedicationStatus) {
  const data = read();
  const medication = data.medications.find((m) => m.id === medicationId);
  if (medication) medication.status = status;
  write(data);
}

export function logDose(medicationId: string, logDate: string, taken: boolean): MedicationLog {
  const data = read();
  let log = data.medicationLogs.find(
    (l) => l.medication_id === medicationId && l.log_date === logDate
  );
  if (log) {
    log.taken = taken;
  } else {
    log = { id: newId(), medication_id: medicationId, log_date: logDate, taken };
    data.medicationLogs.push(log);
  }
  write(data);
  return log;
}

export function addMeasurement(input: {
  type: MeasurementType;
  label: string | null;
  value: number;
  value_secondary: number | null;
  unit: string;
  taken_at: string;
  note: string | null;
}): Measurement {
  const data = read();
  const measurement: Measurement = { id: newId(), ...input };
  data.measurements.unshift(measurement);
  data.measurements.sort((a, b) => (a.taken_at < b.taken_at ? 1 : -1));
  write(data);
  return measurement;
}

export function updateMeasurement(
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
): Measurement {
  const data = read();
  const existing = data.measurements.find((m) => m.id === id);
  if (!existing) throw new Error("Measurement not found");
  Object.assign(existing, input);
  data.measurements.sort((a, b) => (a.taken_at < b.taken_at ? 1 : -1));
  write(data);
  return existing;
}

export function deleteMeasurement(id: string) {
  const data = read();
  data.measurements = data.measurements.filter((m) => m.id !== id);
  write(data);
}

export function addAllergy(input: {
  substance: string;
  reaction: string | null;
  severity: AllergySeverity;
  notes: string | null;
}): Allergy {
  const data = read();
  const allergy: Allergy = { id: newId(), created_at: nowISO(), ...input };
  data.allergies.unshift(allergy);
  write(data);
  return allergy;
}

export function deleteAllergy(id: string) {
  const data = read();
  data.allergies = data.allergies.filter((a) => a.id !== id);
  write(data);
}

export function addImmunization(input: {
  vaccine_name: string;
  date_given: string;
  notes: string | null;
}): Immunization {
  const data = read();
  const immunization: Immunization = { id: newId(), created_at: nowISO(), ...input };
  data.immunizations.unshift(immunization);
  data.immunizations.sort((a, b) => (a.date_given < b.date_given ? 1 : -1));
  write(data);
  return immunization;
}

export function deleteImmunization(id: string) {
  const data = read();
  data.immunizations = data.immunizations.filter((i) => i.id !== id);
  write(data);
}

export function getProfile(): Profile | null {
  return read().profile;
}

export function setProfile(profile: Profile): Profile {
  const data = read();
  data.profile = profile;
  write(data);
  return profile;
}
