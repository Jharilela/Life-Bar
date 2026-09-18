export type MeasurementType =
  | "blood_pressure"
  | "glucose"
  | "weight"
  | "heart_rate"
  | "temperature"
  | "spo2"
  | "custom";

export type MedicationStatus = "active" | "completed" | "stopped";

export type Visit = {
  id: string;
  visit_date: string;
  doctor_name: string;
  specialty: string | null;
  reason: string;
  notes: string | null;
  created_at: string;
};

export type Medication = {
  id: string;
  visit_id: string | null;
  name: string;
  dosage: string | null;
  frequency: string | null;
  status: MedicationStatus;
  start_date: string;
  end_date: string | null;
  created_at: string;
};

export type MedicationLog = {
  id: string;
  medication_id: string;
  log_date: string;
  taken: boolean;
};

export type Measurement = {
  id: string;
  type: MeasurementType;
  label: string | null;
  value: number;
  value_secondary: number | null;
  unit: string;
  taken_at: string;
  note: string | null;
};

export type ShareLink = {
  id: string;
  token: string;
  label: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export type ShareGrant = {
  id: string;
  grantee_email: string;
  revoked_at: string | null;
  created_at: string;
};

export type AllergySeverity = "mild" | "moderate" | "severe";

export type Allergy = {
  id: string;
  substance: string;
  reaction: string | null;
  severity: AllergySeverity;
  notes: string | null;
  created_at: string;
};

export type Immunization = {
  id: string;
  vaccine_name: string;
  date_given: string;
  notes: string | null;
  created_at: string;
};

export type Profile = {
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  care_provider_name: string | null;
  care_provider_phone: string | null;
  pharmacy_name: string | null;
  pharmacy_phone: string | null;
};

export type LabResult = {
  id: string;
  test_name: string;
  result_date: string;
  summary: string | null;
  file_path: string | null;
  created_at: string;
};

export const ALLERGY_SEVERITY_BADGE: Record<AllergySeverity, string> = {
  mild: "lb-badge-good",
  moderate: "lb-badge-warn",
  severe: "lb-badge-critical",
};

export const MEDICATION_FREQUENCIES = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "As needed",
  "Custom",
] as const;

export const MEASUREMENT_LABELS: Record<MeasurementType, string> = {
  blood_pressure: "Blood Pressure",
  glucose: "Glucose",
  weight: "Weight",
  heart_rate: "Heart Rate",
  temperature: "Temperature",
  spo2: "SpO2",
  custom: "Custom",
};

export const MEASUREMENT_UNITS: Record<MeasurementType, string> = {
  blood_pressure: "mmHg",
  glucose: "mg/dL",
  weight: "lb",
  heart_rate: "bpm",
  temperature: "°F",
  spo2: "%",
  custom: "",
};
