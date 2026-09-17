import { createElement, type ReactNode } from "react";

import { Overview } from "../features/overview/Overview";
import type { Persona, PersonaRole } from "./personas";
import type { SawApplicationCapabilities } from "../services/saw-service";
import { Employees } from "../features/employees/Employees";
import { EmployeeDetail } from "../features/employees/EmployeeDetail";
import { EmployeeRegistration } from "../features/employees/EmployeeRegistration";
import { FaceEnrollment } from "../features/employees/FaceEnrollment";
import { HazardousZones } from "../features/hazardous-zones/HazardousZones";
import { CameraSources } from "../features/camera-sources/CameraSources";
import { CanonicalPpeClasses } from "../features/canonical-ppe-classes/CanonicalPpeClasses";
import { LiveMonitoring } from "../features/live-monitoring/LiveMonitoring";
import { ComplianceReport } from "../features/compliance-report/ComplianceReport";
import { Violations } from "../features/violations/Violations";
import { Notifications } from "../features/notifications/Notifications";
import { ScoreReset } from "../features/score-reset/ScoreReset";
import { SafetyParameters } from "../features/safety-parameters/SafetyParameters";

export type RouteDefinition = {
  group: string;
  path: CanonicalRoute | EmployeeRoute;
  navigation?: boolean;
  render: (persona: Persona, service: SawApplicationCapabilities) => ReactNode;
  roles: readonly PersonaRole[];
  title: string;
};

export type CanonicalRoute =
  | "/overview"
  | "/compliance-report"
  | "/monitoring/live"
  | "/violations"
  | "/employees"
  | "/camera-sources"
  | "/hazardous-zones"
  | "/canonical-ppe-classes"
  | "/safety-parameters"
  | "/score-reset"
  | "/notifications";

export type EmployeeRoute =
  | "/employees/new"
  | "/employees/:employeeId"
  | "/employees/:employeeId/face-enrollment";

export const navigationGroupLabels = [
  "Overview",
  "Monitoring",
  "Safety Operations",
  "Configuration",
  "Administration",
] as const;

export const routes: readonly RouteDefinition[] = [
  { group: "Overview", path: "/overview", title: "Overview", roles: ["admin"], render: (_persona, service) => createElement(Overview, { service }) },

  { group: "Overview", path: "/compliance-report", title: "Compliance Report", roles: ["admin", "hrd"], render: (_persona, service) => createElement(ComplianceReport, { service }) },

  //Monitoring
  { group: "Monitoring", path: "/monitoring/live", title: "Live Monitoring", roles: ["admin", "supervisor"], render: (persona, service) => createElement(LiveMonitoring, { persona, service }) },

  //Safety Ops
  { group: "Safety Operations", path: "/violations", title: "Violations", roles: ["admin", "supervisor", "hrd"], render: (_persona, service) => createElement(Violations, { service }) },
  
  { group: "Safety Operations", path: "/employees", title: "Employees", roles: ["admin", "supervisor", "hrd"], render: (persona, service) => createElement(Employees, { persona, service }) },
  { group: "Safety Operations", path: "/employees/new", navigation: false, title: "Add Employee", roles: ["admin"], render: (_persona, service) => createElement(EmployeeRegistration, { service }) },
  { group: "Safety Operations", path: "/employees/:employeeId", navigation: false, title: "Employee details", roles: ["admin", "supervisor", "hrd"], render: (persona, service) => createElement(EmployeeDetail, { persona, service }) },
  { group: "Safety Operations", path: "/employees/:employeeId/face-enrollment", navigation: false, title: "Face Enrollment", roles: ["admin"], render: (_persona, service) => createElement(FaceEnrollment, { service }) },

  //Configuration
  { group: "Configuration", path: "/camera-sources", title: "Camera Sources", roles: ["admin", "supervisor"], render: (persona, service) => createElement(CameraSources, { persona, service }) },

  { group: "Configuration", path: "/hazardous-zones", title: "Hazardous Zones", roles: ["admin"], render: (_persona, service) => createElement(HazardousZones, { service }) },

  { group: "Configuration", path: "/canonical-ppe-classes", title: "Canonical PPE Classes", roles: ["admin"], render: (_persona, service) => createElement(CanonicalPpeClasses, { service }) },
  
  //Administration
  { group: "Administration", path: "/safety-parameters", title: "Safety Parameters", roles: ["admin"], render: (_persona, service) => createElement(SafetyParameters, { service }) },
  
 { group: "Administration", path: "/score-reset", title: "Score Reset", roles: ["admin"], render: (_persona, service) => createElement(ScoreReset, { service }) },

  { group: "Administration", path: "/notifications", title: "Notifications", roles: ["admin", "hrd"], render: (persona, service) => createElement(Notifications, { persona, service }) },
];
