import type { HazardousZone } from "./hazardous-zone";
import type { Employee } from "./employee";

export type OverviewData = {
  activeCameras: number;
  activeViolations: number;
  ppeCompliance: number;
  employeesBelowEscalationThreshold: number;
  totalCameras: number;
};

export type ComplianceReportObservation = {
  id: string;
  observedAt: string;
  zoneId: string;
  departmentId: string;
  employeeId?: string;
  canonicalPpeClass: string;
  isCompliant: boolean;
  safetyScore: number;
};

export type ComplianceReportData = {
  observations: ComplianceReportObservation[];
  zones: HazardousZone[];
  employees: Employee[];
  escalationThreshold: number;
};
