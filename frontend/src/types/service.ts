import type { Camera } from "./camera";
import type { Employee, FaceSample } from "./employee";
import type { HazardousZone } from "./hazardous-zone";
import type { SafetySettings, CanonicalPpeClassConfiguration } from "./safety-settings";
import type { SafetyScorePeriod, SafetyScoreLedgerEntry, SafetyScoreResetLog } from "./safety-score";
import type { ViolationRecord } from "./violation";
import type { MonitoringSimulation } from "./monitoring";
import type { NotificationRecipient, NotificationSimulationLog } from "./notification";
import type { ComplianceReportObservation } from "./compliance-report";

export type ServiceScenario = "ready" | "loading" | "empty" | "error";

export type DemoData = {
  cameras: Camera[];
  compliance: { compliantObservations: number; totalObservations: number };
  departments: string[];
  employees: Employee[];
  faceSamples?: FaceSample[];
  escalationThreshold: number;
  safetySettings?: SafetySettings;
  canonicalPpeClassConfiguration?: CanonicalPpeClassConfiguration;
  scorePeriods?: SafetyScorePeriod[];
  safetyScoreLedger?: SafetyScoreLedgerEntry[];
  safetyScoreResetLogs?: SafetyScoreResetLog[];
  violations: ViolationRecord[];
  zones: string[];
  hazardousZones?: HazardousZone[];
  monitoringSimulation?: MonitoringSimulation;
  notificationRecipients?: NotificationRecipient[];
  notificationLogs?: NotificationSimulationLog[];
  complianceReportObservations?: ComplianceReportObservation[];
};
