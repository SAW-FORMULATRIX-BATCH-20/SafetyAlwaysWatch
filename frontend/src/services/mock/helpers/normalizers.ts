import type {
  CanonicalPpeClassConfiguration,
  DemoData,
  Employee,
  FaceSample,
  NotificationRecipientRole,
  SafetyScoreResetReason,
  SafetySettings,
} from "../../../types";
import {
  defaultCanonicalPpeClassConfiguration,
  defaultSafetySettings,
} from "../data/default-settings";
import {
  defaultComplianceReportObservations,
  defaultHazardousZone,
  defaultNotificationRecipients,
} from "../data/seed-data";
import { clone } from "./clone";
import { createMonitoringSimulation } from "./simulation";

export function normalizeSafetySettings(
  settings?: Partial<SafetySettings>
): SafetySettings {
  const fallback = clone(defaultSafetySettings);
  return {
    ...fallback,
    ...settings,
    deductions: settings?.deductions?.length
      ? clone(settings.deductions)
      : fallback.deductions,
    timeZone: "Asia/Jakarta",
  };
}

export function normalizeCanonicalPpeClassConfiguration(
  configuration?: CanonicalPpeClassConfiguration
): CanonicalPpeClassConfiguration {
  return clone(configuration ?? defaultCanonicalPpeClassConfiguration);
}

export function normalizeEmployee(employee: Employee): Employee {
  const faceSampleCount = Math.max(
    0,
    employee.faceSampleCount ?? (employee.enrollmentStatus === "enrolled" ? 1 : 0)
  );
  return {
    ...employee,
    employeeCode: employee.employeeCode ?? employee.id,
    status: employee.status ?? "active",
    faceSampleCount,
    enrollmentStatus: faceSampleCount > 0 ? "enrolled" : "not-enrolled",
    safetyScorePeriodStartedAt:
      employee.safetyScorePeriodStartedAt ?? "2026-09-01T00:00:00+07:00",
  };
}

export function synchronizeEmployeeFaceEnrollment(data: DemoData): void {
  data.employees.forEach((employee) => {
    const activeCount =
      data.faceSamples?.filter(
        (sample) => sample.employeeId === employee.id && sample.active
      ).length ?? 0;
    employee.faceSampleCount = activeCount;
    employee.enrollmentStatus = activeCount > 0 ? "enrolled" : "not-enrolled";
  });
}

export function normalizeData(input: DemoData): DemoData {
  const data = clone(input);
  data.employees = data.employees.map(normalizeEmployee);
  data.faceSamples =
    data.faceSamples ??
    data.employees.flatMap((employee) =>
      Array.from(
        { length: employee.faceSampleCount ?? 0 },
        (_, index): FaceSample => ({
          id: `FSC-SEED-${employee.id}-${index + 1}`,
          employeeId: employee.id,
          active: true,
          enrolledAt: "2026-09-01T00:00:00+07:00",
          enrolledBy: "Admin/Safety Officer",
        })
      )
    );
  synchronizeEmployeeFaceEnrollment(data);
  data.safetySettings = normalizeSafetySettings(
    data.safetySettings ?? {
      escalationThreshold: data.escalationThreshold,
    }
  );
  data.canonicalPpeClassConfiguration = normalizeCanonicalPpeClassConfiguration(
    data.canonicalPpeClassConfiguration
  );
  const legacyResetReason: Record<string, SafetyScoreResetReason> = {
    TeguranBriefingDiberikan: "BriefingCompleted",
    TrainingCleared: "TrainingCompleted",
    InvestigasiDitutup: "InvestigationClosed",
    PerbaikanFisikZona: "HazardousZoneRemediated",
    Lainnya: "Other",
  };
  const legacyRecipientRole: Record<string, NotificationRecipientRole> = {
    HRD: "Human Resources (HR)",
    "Supervisor Area": "Area Supervisor",
  };
  data.scorePeriods = (data.scorePeriods ?? []).map((period) => ({
    ...period,
    resetReason: legacyResetReason[period.resetReason] ?? period.resetReason,
  }));
  data.safetyScoreLedger = data.safetyScoreLedger ?? [];
  data.safetyScoreResetLogs = data.safetyScoreResetLogs ?? [];
  data.hazardousZones = data.hazardousZones ?? clone(defaultHazardousZone);
  data.notificationRecipients = (
    data.notificationRecipients ?? clone(defaultNotificationRecipients)
  ).map((recipient) => ({
    ...recipient,
    role: legacyRecipientRole[recipient.role] ?? recipient.role,
  }));
  data.notificationLogs = data.notificationLogs ?? [];
  data.complianceReportObservations =
    data.complianceReportObservations ?? clone(defaultComplianceReportObservations);
  data.monitoringSimulation = data.monitoringSimulation?.state
    ? data.monitoringSimulation
    : createMonitoringSimulation("normal");
  data.escalationThreshold = data.safetySettings.escalationThreshold;
  return data;
}
