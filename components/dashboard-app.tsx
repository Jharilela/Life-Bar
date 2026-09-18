"use client";

import { useHealthData } from "@/hooks/use-health-data";
import * as remote from "@/lib/data/remote";
import { AppHeader } from "@/components/app-header";
import { VisitSection } from "@/components/visit-section";
import { MedicationSection } from "@/components/medication-section";
import { VitalsSection } from "@/components/vitals-section";
import { AllergySection } from "@/components/allergy-section";
import { ImmunizationSection } from "@/components/immunization-section";
import { ProfileSection } from "@/components/profile-section";
import { LabResultsSection } from "@/components/lab-results-section";

export function DashboardApp() {
  const {
    authed,
    loading,
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
  } = useHealthData();

  const logsByMedication: Record<string, typeof medicationLogs> = {};
  for (const log of medicationLogs) {
    (logsByMedication[log.medication_id] ??= []).push(log);
  }

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-8 py-10 pb-24">
        <AppHeader authed={false} />
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-8 py-10 pb-24">
      <AppHeader authed={authed} />

      {importError && (
        <p className="text-sm mt-6" style={{ color: "var(--critical)" }}>
          Couldn&apos;t save your local data to your account ({importError}). It&apos;s still
          safe in this browser — try signing in again.
        </p>
      )}

      <div className="mt-8">
        <VitalsSection
          measurements={measurements}
          onAddMeasurement={addMeasurement}
          onUpdateMeasurement={updateMeasurement}
          onDeleteMeasurement={deleteMeasurement}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <VisitSection visits={visits} medications={medications} onAddVisit={addVisit} />
        <MedicationSection
          medications={medications}
          logsByMedication={logsByMedication}
          visits={visits}
          onAddMedication={addMedication}
          onLogDose={logDose}
          onSetStatus={setMedicationStatus}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <AllergySection
          allergies={allergies}
          onAddAllergy={addAllergy}
          onDeleteAllergy={deleteAllergy}
        />
        <ProfileSection profile={profile} onSaveProfile={saveProfile} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <ImmunizationSection
          immunizations={immunizations}
          onAddImmunization={addImmunization}
          onDeleteImmunization={deleteImmunization}
        />
        <LabResultsSection
          labResults={labResults}
          authed={authed}
          onAddLabResult={addLabResult}
          onDeleteLabResult={deleteLabResult}
          onGetFileUrl={remote.getLabResultFileUrl}
        />
      </div>
    </main>
  );
}
