import { createElement, type ReactNode } from "react";

import {
  Cameras,
  CanonicalPpeClasses,
  ComplianceReport,
  Employees,
  HazardousZoneEditor,
  LiveMonitoring,
  NotificationConfiguration,
  Overview,
  SafetyParameters,
  SafetyScoreReset,
  Violations,
} from "./RoutedApplication";
import type { Persona, PersonaRole } from "./personas";
import type { SawApplicationCapabilities } from "../services/saw-service";

export type RouteDefinition = {
  group: string;
  path: CanonicalRoute;
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
  { group: "Monitoring", path: "/monitoring/live", title: "Live Monitoring", roles: ["admin", "supervisor"], render: (persona, service) => createElement(LiveMonitoring, { persona, service }) },
  { group: "Safety Operations", path: "/violations", title: "Violations", roles: ["admin", "supervisor", "hrd"], render: (_persona, service) => createElement(Violations, { service }) },
  { group: "Safety Operations", path: "/employees", title: "Employees", roles: ["admin", "supervisor", "hrd"], render: (persona, service) => createElement(Employees, { persona, service }) },
  { group: "Configuration", path: "/camera-sources", title: "Camera Sources", roles: ["admin", "supervisor"], render: (persona, service) => createElement(Cameras, { persona, service }) },
  { group: "Configuration", path: "/hazardous-zones", title: "Hazardous Zones", roles: ["admin"], render: (_persona, service) => createElement(HazardousZoneEditor, { service }) },
  { group: "Configuration", path: "/canonical-ppe-classes", title: "Canonical PPE Classes", roles: ["admin"], render: (_persona, service) => createElement(CanonicalPpeClasses, { service }) },
  { group: "Administration", path: "/safety-parameters", title: "Safety Parameters", roles: ["admin"], render: (_persona, service) => createElement(SafetyParameters, { service }) },
  { group: "Administration", path: "/score-reset", title: "Score Reset", roles: ["admin"], render: (_persona, service) => createElement(SafetyScoreReset, { service }) },
  { group: "Administration", path: "/notifications", title: "Notifications", roles: ["admin", "hrd"], render: (persona, service) => createElement(NotificationConfiguration, { persona, service }) },
];

export const legacyRouteRedirects: Readonly<Record<string, CanonicalRoute>> = {
  "/laporan-kepatuhan": "/compliance-report",
  "/pelanggaran": "/violations",
  "/karyawan": "/employees",
  "/konfigurasi/kamera": "/camera-sources",
  "/konfigurasi/zona": "/hazardous-zones",
  "/konfigurasi/apd": "/canonical-ppe-classes",
  "/administrasi/parameter": "/safety-parameters",
  "/administrasi/reset-skor": "/score-reset",
  "/administrasi/notifikasi": "/notifications",
};
