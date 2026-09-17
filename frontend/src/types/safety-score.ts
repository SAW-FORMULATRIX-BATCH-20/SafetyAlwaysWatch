import type { Employee } from "./employee";

export const safetyScoreResetReasons = [
  "BriefingCompleted",
  "TrainingCompleted",
  "InvestigationClosed",
  "HazardousZoneRemediated",
  "Other",
] as const;

export type SafetyScoreResetReason = (typeof safetyScoreResetReasons)[number];

export const safetyScoreResetReasonLabels: Record<SafetyScoreResetReason, string> = {
  BriefingCompleted: "Briefing completed",
  TrainingCompleted: "Training completed",
  InvestigationClosed: "Investigation closed",
  HazardousZoneRemediated: "Hazardous Zone remediation completed",
  Other: "Other",
};

export type SafetyScorePeriod = {
  id: string;
  employeeId: string;
  startedAt: string;
  closedAt: string;
  finalScoreBeforeReset: number;
  totalViolations: number;
  violationsByCanonicalPpeClass: Record<string, number>;
  trigger: "Manual";
  resetReason: SafetyScoreResetReason;
  note?: string;
  closedBy: string;
};

export type SafetyScoreLedgerEntry = {
  id: string;
  employeeId: string;
  periodId: string;
  scoreBefore: number;
  scoreAfter: number;
  recordedAt: string;
  actor: string;
};

export type SafetyScoreResetLog = {
  id: string;
  employeeId: string;
  periodId: string;
  ledgerEntryId: string;
  trigger: "Manual";
  reason: SafetyScoreResetReason;
  note?: string;
  actor: string;
  occurredAt: string;
};

export type SafetyScoreAudit = {
  periods: SafetyScorePeriod[];
  ledger: SafetyScoreLedgerEntry[];
  resetLogs: SafetyScoreResetLog[];
};

export type SafetyScoreResetRequest = {
  employeeId: string;
  reason: SafetyScoreResetReason;
  note?: string;
  actor: string;
};

export type SafetyScoreResetResult = {
  employee: Employee;
  closedPeriod: SafetyScorePeriod;
  ledgerEntry: SafetyScoreLedgerEntry;
  resetLog: SafetyScoreResetLog;
};
