export type ServiceScenario = "ready" | "loading" | "empty" | "error";

export type CameraStatus = "online" | "degraded" | "offline";

export type SafetyDeduction = {
  canonicalPpeClass: string;
  points: number;
};

export type PpeComplianceCategory = "compliance" | "violation";

export type CanonicalPpeClassMapping = {
  id: string;
  yoloIndex: number;
  rawLabel: string;
  canonicalPpeClass: string;
  complianceCategory: PpeComplianceCategory;
  active: boolean;
};

export type OnnxModelMetadata = {
  fileName: string;
  sizeBytes: number;
  mimeType: string;
};

export type CanonicalPpeClassConfiguration = {
  mappings: CanonicalPpeClassMapping[];
  modelFileMetadata?: OnnxModelMetadata;
};

export type SafetySettings = {
  initialScore: number;
  escalationThreshold: number;
  deductions: SafetyDeduction[];
  confirmThresholdSeconds: number;
  clearThresholdSeconds: number;
  minimumConfidence: number;
  resetTime: string;
  recapLeadMinutes: number;
  timeZone: "Asia/Jakarta";
};

export const defaultSafetySettings: SafetySettings = {
  initialScore: 100,
  escalationThreshold: 60,
  deductions: [
    { canonicalPpeClass: "Safety Helmet", points: 10 },
    { canonicalPpeClass: "Safety Vest", points: 8 },
    { canonicalPpeClass: "Safety Boots", points: 12 },
    { canonicalPpeClass: "Hearing Protection", points: 6 },
  ],
  confirmThresholdSeconds: 5,
  clearThresholdSeconds: 3,
  minimumConfidence: 0.5,
  resetTime: "00:00",
  recapLeadMinutes: 15,
  timeZone: "Asia/Jakarta",
};

export type Camera = {
  id: string;
  name: string;
  location: string;
  zoneIds: string[];
  status: CameraStatus;
  lastUpdatedAt: string;
  supervisorArea: string;
};

export type CameraMetadata = Pick<Camera, "name" | "location">;
export type CameraScope = "all" | { type: "supervisor-area"; area: string };
export type NormalizedZoneBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type HazardousZone = {
  id: string;
  name: string;
  cameraId: string;
  active: boolean;
  bounds: NormalizedZoneBounds;
  requiredCanonicalPpeClasses: string[];
  supervisorAreas: string[];
};

export type HazardousZoneWithViolationHistory = HazardousZone & {
  hasViolationHistory: boolean;
};

export type HazardousZoneInput = Omit<HazardousZone, "id"> & { id?: string };
export type ViolationTimelineEntry = {
  status: EpisodeStatus;
  occurredAt: string;
  description: string;
};

export type ViolationNotificationRecipient = {
  name: string;
  role: "Human Resources (HR)" | "Area Supervisor";
  deliveryStatus: "sent" | "failed" | "pending";
};

export type NotificationRecipientRole = "Human Resources (HR)" | "Area Supervisor";

export type NotificationRecipientScope =
  | { type: "global" }
  | { type: "zone"; zoneId: string }
  | { type: "department"; departmentId: string };

export type NotificationRecipient = {
  id: string;
  name: string;
  role: NotificationRecipientRole;
  maskedChatId: string;
  scope: NotificationRecipientScope;
};

export type NotificationRecipientInput = {
  name: string;
  role: NotificationRecipientRole;
  chatId: string;
  scope: NotificationRecipientScope;
};

export type NotificationSimulationLog = {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientRole: NotificationRecipientRole;
  deliveryStatus: "sent" | "failed";
  violationId: string;
  occurredAt: string;
};

export type ViolationRecord = {
  id: string;
  status: "confirmed" | "clearing" | "cleared";
  zoneId?: string;
  cameraId?: string;
  episodeId?: string;
  employeeId?: string;
  missingCanonicalPpeClasses?: string[];
  confidence?: number;
  detectedAt?: string;
  updatedAt?: string;
  scoreChange?: { before: number; after: number };
  notificationRecipients?: ViolationNotificationRecipient[];
  timeline?: ViolationTimelineEntry[];
};

export type MonitoringScenario = "normal" | "missing-ppe" | "unidentified" | "camera-offline" | "score-escalation";
export type EpisodeStatus = "candidate" | "confirmed" | "clearing" | "cleared";
export type MonitoringSimulationState = "normal" | "episode" | "offline";
export type MonitoringFrame = {
  confidence: number;
  isCompliant: boolean;
  elapsedSeconds: number;
};

export type MonitoringSimulation = {
  scenario: MonitoringScenario;
  cameraId: string;
  state: MonitoringSimulationState;
  episodeId?: string;
  episodeStatus: EpisodeStatus;
  confidence: number;
  identity: "employee" | "unidentified";
  employeeId?: string;
  identityLabel: string;
  missingCanonicalPpeClasses: string[];
  confirmationElapsedSeconds: number;
  clearingElapsedSeconds: number;
  eventId?: string;
  scoreChange?: { before: number; after: number; crossedEscalationThreshold: boolean };
};
export type EmployeeEnrollmentStatus = "enrolled" | "pending" | "not-enrolled";

export type Employee = {
  id: string;
  departmentId: string;
  safetyScore: number;
  safetyScorePeriodStartedAt?: string;
  name?: string;
  supervisorArea?: string;
  enrollmentStatus?: EmployeeEnrollmentStatus;
  lastAuditAt?: string;
  auditSummary?: {
    violationCount: number;
    resetCount: number;
  };
};

export type EmployeeScope = "all" | { type: "supervisor-area"; area: string };
export type EmployeeDirectoryData = {
  employees: Employee[];
  escalationThreshold: number;
};

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

export type DemoData = {
  cameras: Camera[];
  compliance: { compliantObservations: number; totalObservations: number };
  departments: string[];
  employees: Employee[];
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

export interface OverviewCapability {
  getOverview(): Promise<OverviewData | null>;
  resetDemoData(): Promise<OverviewData>;
}

export interface ComplianceReportingCapability {
  getComplianceReport(): Promise<ComplianceReportData>;
}

export interface CameraSourceCapability {
  getCameras(scope?: CameraScope): Promise<Camera[]>;
  updateCameraMetadata(id: string, metadata: CameraMetadata): Promise<Camera>;
}

export interface HazardousZoneCapability {
  getHazardousZone(): Promise<HazardousZoneWithViolationHistory[]>;
  saveHazardousZone(zone: HazardousZoneInput): Promise<HazardousZoneWithViolationHistory>;
  deactivateHazardousZone(id: string): Promise<HazardousZoneWithViolationHistory>;
  deleteHazardousZone(id: string): Promise<void>;
}

export interface ViolationHistoryCapability {
  getViolationHistory(): Promise<ViolationRecord[]>;
}

export interface EmployeeDirectoryCapability {
  getEmployeeDirectory(scope?: EmployeeScope): Promise<EmployeeDirectoryData>;
}

export interface SafetyScoreCapability {
  getSafetyScoreAudit(employeeId: string): Promise<SafetyScoreAudit>;
  resetSafetyScore(request: SafetyScoreResetRequest): Promise<SafetyScoreResetResult>;
}

export interface SafetySettingsCapability {
  getSafetySettings(): Promise<SafetySettings>;
  updateSafetySettings(settings: SafetySettings): Promise<SafetySettings>;
}

export interface CanonicalPpeClassCapability {
  getCanonicalPpeClassConfiguration(): Promise<CanonicalPpeClassConfiguration>;
  updateCanonicalPpeClassConfiguration(configuration: CanonicalPpeClassConfiguration): Promise<CanonicalPpeClassConfiguration>;
}

export interface NotificationCapability {
  getNotificationRecipients(): Promise<NotificationRecipient[]>;
  saveNotificationRecipient(input: NotificationRecipientInput): Promise<NotificationRecipient>;
  deleteNotificationRecipient(id: string): Promise<void>;
  getNotificationSimulationLogs(): Promise<NotificationSimulationLog[]>;
  simulateNotification(recipientId: string, deliveryStatus: "sent" | "failed"): Promise<NotificationSimulationLog>;
}

export interface MonitoringCapability {
  getMonitoringSimulation(): Promise<MonitoringSimulation>;
  selectMonitoringScenario(scenario: MonitoringScenario): Promise<MonitoringSimulation>;
  processMonitoringFrame(frame: MonitoringFrame): Promise<MonitoringSimulation>;
}

/** The router composes every capability; feature screens receive only what they use. */
export type SawApplicationCapabilities =
  & OverviewCapability
  & ComplianceReportingCapability
  & CameraSourceCapability
  & HazardousZoneCapability
  & ViolationHistoryCapability
  & EmployeeDirectoryCapability
  & SafetyScoreCapability
  & SafetySettingsCapability
  & CanonicalPpeClassCapability
  & NotificationCapability
  & MonitoringCapability;

type MockServiceOptions = {
  initialData?: DemoData;
  scenario?: ServiceScenario;
  storage?: Storage | null;
};

const storageKey = "saw-demo-data";

const defaultCanonicalPpeClassConfiguration: CanonicalPpeClassConfiguration = {
  mappings: [
    { id: "PPE-01", yoloIndex: 0, rawLabel: "helmet", canonicalPpeClass: "Safety Helmet", complianceCategory: "compliance", active: true },
    { id: "PPE-02", yoloIndex: 1, rawLabel: "hardhat", canonicalPpeClass: "Safety Helmet", complianceCategory: "compliance", active: true },
    { id: "PPE-03", yoloIndex: 2, rawLabel: "mask", canonicalPpeClass: "Face Mask", complianceCategory: "compliance", active: true },
    { id: "PPE-04", yoloIndex: 3, rawLabel: "Face Mask", canonicalPpeClass: "Face Mask", complianceCategory: "compliance", active: true },
    { id: "PPE-05", yoloIndex: 4, rawLabel: "no_vest", canonicalPpeClass: "Safety Vest", complianceCategory: "violation", active: true },
  ],
  modelFileMetadata: {
    fileName: "saw-ppe-demo.onnx",
    sizeBytes: 2048000,
    mimeType: "application/octet-stream",
  },
};

const defaultHazardousZone: HazardousZone[] = [
  { id: "ZON-01", name: "Main Gate Zone", cameraId: "CAM-01", active: true, bounds: { x: 0.12, y: 0.18, width: 0.3, height: 0.52 }, requiredCanonicalPpeClasses: ["Safety Helmet", "Safety Vest"], supervisorAreas: ["Production"] },
  { id: "ZON-02", name: "Press Machine Zone", cameraId: "CAM-01", active: true, bounds: { x: 0.58, y: 0.2, width: 0.25, height: 0.43 }, requiredCanonicalPpeClasses: ["Safety Helmet"], supervisorAreas: ["Production"] },
  { id: "ZON-03", name: "Warehouse Loading Zone", cameraId: "CAM-02", active: true, bounds: { x: 0.16, y: 0.32, width: 0.26, height: 0.38 }, requiredCanonicalPpeClasses: ["Safety Helmet", "Face Mask"], supervisorAreas: ["Warehouse"] },
  { id: "ZON-04", name: "Material Rack Zone", cameraId: "CAM-02", active: false, bounds: { x: 0.55, y: 0.2, width: 0.28, height: 0.48 }, requiredCanonicalPpeClasses: ["Safety Vest"], supervisorAreas: ["Warehouse"] },
];

const defaultNotificationRecipients: NotificationRecipient[] = [
  { id: "REC-01", name: "Operations Human Resources", role: "Human Resources (HR)", maskedChatId: "•••• 4821", scope: { type: "global" } },
  { id: "REC-02", name: "Supervisor Production", role: "Area Supervisor", maskedChatId: "•••• 7310", scope: { type: "zone", zoneId: "ZON-01" } },
  { id: "REC-03", name: "Supervisor Maintenance", role: "Area Supervisor", maskedChatId: "•••• 9452", scope: { type: "department", departmentId: "Maintenance" } },
];

const defaultComplianceReportObservations: ComplianceReportObservation[] = [
  { id: "OBS-01", observedAt: "2026-09-01T08:10:00+07:00", zoneId: "ZON-01", departmentId: "Production", employeeId: "EMP-02", canonicalPpeClass: "Safety Vest", isCompliant: false, safetyScore: 84 },
  { id: "OBS-02", observedAt: "2026-09-01T08:12:00+07:00", zoneId: "ZON-01", departmentId: "Production", employeeId: "EMP-01", canonicalPpeClass: "Safety Helmet", isCompliant: true, safetyScore: 92 },
  { id: "OBS-03", observedAt: "2026-09-02T09:40:00+07:00", zoneId: "ZON-04", departmentId: "Warehouse", canonicalPpeClass: "Face Mask", isCompliant: false, safetyScore: 0 },
  { id: "OBS-04", observedAt: "2026-09-03T10:05:00+07:00", zoneId: "ZON-03", departmentId: "Warehouse", employeeId: "EMP-05", canonicalPpeClass: "Safety Helmet", isCompliant: false, safetyScore: 68 },
  { id: "OBS-05", observedAt: "2026-09-03T11:30:00+07:00", zoneId: "ZON-03", departmentId: "Warehouse", employeeId: "EMP-06", canonicalPpeClass: "Face Mask", isCompliant: true, safetyScore: 96 },
  { id: "OBS-06", observedAt: "2026-09-04T11:20:00+07:00", zoneId: "ZON-03", departmentId: "Warehouse", employeeId: "EMP-07", canonicalPpeClass: "Safety Helmet", isCompliant: false, safetyScore: 55 },
  { id: "OBS-07", observedAt: "2026-09-05T13:45:00+07:00", zoneId: "ZON-01", departmentId: "Warehouse", employeeId: "EMP-07", canonicalPpeClass: "Safety Vest", isCompliant: false, safetyScore: 55 },
  { id: "OBS-08", observedAt: "2026-09-05T15:10:00+07:00", zoneId: "ZON-02", departmentId: "Production", employeeId: "EMP-04", canonicalPpeClass: "Safety Helmet", isCompliant: true, safetyScore: 77 },
];

const seedData: DemoData = {
  cameras: [
    {
      id: "CAM-01",
      name: "Production Gate",
      location: "Main Production Line",
      zoneIds: ["ZON-01", "ZON-02"],
      status: "online",
      lastUpdatedAt: "2026-09-08T08:15:00+07:00",
      supervisorArea: "Production",
    },
    {
      id: "CAM-02",
      name: "Warehouse Raw Materials",
      location: "Warehouse Raw Materials",
      zoneIds: ["ZON-03", "ZON-04"],
      status: "offline",
      lastUpdatedAt: "2026-09-08T07:48:00+07:00",
      supervisorArea: "Warehouse",
    },
  ],
  zones: ["ZON-01", "ZON-02", "ZON-03", "ZON-04"],
  departments: ["Production", "Warehouse", "Maintenance"],
  employees: [
    { id: "EMP-01", name: "Employee Production 01", departmentId: "Production", supervisorArea: "Production", safetyScore: 92, enrollmentStatus: "enrolled", lastAuditAt: "2026-09-07T09:20:00+07:00", auditSummary: { violationCount: 0, resetCount: 1 } },
    { id: "EMP-02", name: "Employee Production 02", departmentId: "Production", supervisorArea: "Production", safetyScore: 84, enrollmentStatus: "enrolled", lastAuditAt: "2026-09-06T14:10:00+07:00", auditSummary: { violationCount: 1, resetCount: 0 } },
    { id: "EMP-03", name: "Employee Production 03", departmentId: "Production", supervisorArea: "Production", safetyScore: 58, enrollmentStatus: "pending", lastAuditAt: "2026-09-05T11:40:00+07:00", auditSummary: { violationCount: 3, resetCount: 0 } },
    { id: "EMP-04", name: "Employee Production 04", departmentId: "Production", supervisorArea: "Production", safetyScore: 77, enrollmentStatus: "enrolled", lastAuditAt: "2026-09-04T08:15:00+07:00", auditSummary: { violationCount: 1, resetCount: 0 } },
    { id: "EMP-05", name: "Employee Warehouse 01", departmentId: "Warehouse", supervisorArea: "Warehouse", safetyScore: 68, enrollmentStatus: "enrolled", lastAuditAt: "2026-09-06T10:05:00+07:00", auditSummary: { violationCount: 2, resetCount: 1 } },
    { id: "EMP-06", name: "Employee Warehouse 02", departmentId: "Warehouse", supervisorArea: "Warehouse", safetyScore: 96, enrollmentStatus: "enrolled", lastAuditAt: "2026-09-07T15:25:00+07:00", auditSummary: { violationCount: 0, resetCount: 0 } },
    { id: "EMP-07", name: "Employee Warehouse 03", departmentId: "Warehouse", supervisorArea: "Warehouse", safetyScore: 55, enrollmentStatus: "not-enrolled", lastAuditAt: "2026-09-03T13:45:00+07:00", auditSummary: { violationCount: 4, resetCount: 0 } },
    { id: "EMP-08", name: "Employee Warehouse 04", departmentId: "Warehouse", supervisorArea: "Warehouse", safetyScore: 73, enrollmentStatus: "enrolled", lastAuditAt: "2026-09-02T09:50:00+07:00", auditSummary: { violationCount: 1, resetCount: 0 } },
    { id: "EMP-09", name: "Employee Maintenance 01", departmentId: "Maintenance", supervisorArea: "Maintenance", safetyScore: 88, enrollmentStatus: "enrolled", lastAuditAt: "2026-09-01T16:30:00+07:00", auditSummary: { violationCount: 0, resetCount: 1 } },
    { id: "EMP-10", name: "Employee Maintenance 02", departmentId: "Maintenance", supervisorArea: "Maintenance", safetyScore: 90, enrollmentStatus: "enrolled", lastAuditAt: "2026-09-01T11:10:00+07:00", auditSummary: { violationCount: 0, resetCount: 0 } },
    { id: "EMP-11", name: "Employee Maintenance 03", departmentId: "Maintenance", supervisorArea: "Maintenance", safetyScore: 79, enrollmentStatus: "pending", lastAuditAt: "2026-08-31T10:00:00+07:00", auditSummary: { violationCount: 1, resetCount: 0 } },
    { id: "EMP-12", name: "Employee Maintenance 04", departmentId: "Maintenance", supervisorArea: "Maintenance", safetyScore: 65, enrollmentStatus: "enrolled", lastAuditAt: "2026-08-30T08:40:00+07:00", auditSummary: { violationCount: 2, resetCount: 0 } },
  ],
  escalationThreshold: 60,
  violations: [
    {
      id: "VIO-01", status: "cleared", zoneId: "ZON-01", cameraId: "CAM-01", episodeId: "EPS-001", employeeId: "EMP-02", missingCanonicalPpeClasses: ["Safety Vest"], confidence: 0.96, detectedAt: "2026-09-01T08:10:00+07:00", updatedAt: "2026-09-01T08:20:00+07:00", scoreChange: { before: 92, after: 84 }, notificationRecipients: [{ name: "Production Supervisor", role: "Area Supervisor", deliveryStatus: "sent" }], timeline: [{ status: "candidate", occurredAt: "2026-09-01T08:10:00+07:00", description: "Missing PPE signal entered verification." }, { status: "confirmed", occurredAt: "2026-09-01T08:10:05+07:00", description: "Violation Event recorded and Safety Score reduced." }, { status: "clearing", occurredAt: "2026-09-01T08:19:00+07:00", description: "Violation Episode entered Clearing." }, { status: "cleared", occurredAt: "2026-09-01T08:20:00+07:00", description: "Violation Episode Cleared and retained in history." }],
    },
    {
      id: "VIO-02", status: "confirmed", zoneId: "ZON-04", cameraId: "CAM-02", episodeId: "EPS-002", missingCanonicalPpeClasses: ["Face Mask"], confidence: 0.91, detectedAt: "2026-09-02T09:40:00+07:00", updatedAt: "2026-09-02T09:40:05+07:00", notificationRecipients: [{ name: "Operations Human Resources", role: "Human Resources (HR)", deliveryStatus: "pending" }], timeline: [{ status: "candidate", occurredAt: "2026-09-02T09:40:00+07:00", description: "Detected Person could not be matched to an Employee." }, { status: "confirmed", occurredAt: "2026-09-02T09:40:05+07:00", description: "Violation Event recorded for Unknown." }],
    },
    {
      id: "VIO-03", status: "cleared", zoneId: "ZON-03", cameraId: "CAM-02", episodeId: "EPS-003", employeeId: "EMP-05", missingCanonicalPpeClasses: ["Safety Helmet"], confidence: 0.89, detectedAt: "2026-09-03T10:05:00+07:00", updatedAt: "2026-09-03T10:08:00+07:00", scoreChange: { before: 78, after: 68 }, notificationRecipients: [{ name: "Supervisor Warehouse", role: "Area Supervisor", deliveryStatus: "sent" }], timeline: [{ status: "confirmed", occurredAt: "2026-09-03T10:05:05+07:00", description: "Violation Event confirmed." }, { status: "cleared", occurredAt: "2026-09-03T10:08:00+07:00", description: "Violation Episode Cleared." }],
    },
    {
      id: "VIO-04", status: "cleared", zoneId: "ZON-03", cameraId: "CAM-02", episodeId: "EPS-004", employeeId: "EMP-03", missingCanonicalPpeClasses: ["Safety Helmet", "Safety Vest"], confidence: 0.94, detectedAt: "2026-09-04T11:20:00+07:00", updatedAt: "2026-09-04T11:30:00+07:00", scoreChange: { before: 76, after: 58 }, notificationRecipients: [{ name: "Operations Human Resources", role: "Human Resources (HR)", deliveryStatus: "sent" }], timeline: [{ status: "confirmed", occurredAt: "2026-09-04T11:20:05+07:00", description: "Violation Event confirmed." }, { status: "cleared", occurredAt: "2026-09-04T11:30:00+07:00", description: "Violation Episode Cleared." }],
    },
    {
      id: "VIO-05", status: "cleared", zoneId: "ZON-01", cameraId: "CAM-01", episodeId: "EPS-005", employeeId: "EMP-07", missingCanonicalPpeClasses: ["Safety Vest"], confidence: 0.87, detectedAt: "2026-09-05T13:45:00+07:00", updatedAt: "2026-09-05T13:53:00+07:00", scoreChange: { before: 63, after: 55 }, notificationRecipients: [{ name: "Supervisor Warehouse", role: "Area Supervisor", deliveryStatus: "failed" }], timeline: [{ status: "confirmed", occurredAt: "2026-09-05T13:45:05+07:00", description: "Violation Event confirmed." }, { status: "cleared", occurredAt: "2026-09-05T13:53:00+07:00", description: "Violation Episode Cleared." }],
    },
  ],
  compliance: { compliantObservations: 83, totalObservations: 100 },
  notificationRecipients: defaultNotificationRecipients,
  notificationLogs: [
    { id: "NTF-01", recipientId: "REC-02", recipientName: "Supervisor Production", recipientRole: "Area Supervisor", deliveryStatus: "sent", violationId: "VIO-01", occurredAt: "2026-09-01T08:10:05+07:00" },
    { id: "NTF-02", recipientId: "REC-03", recipientName: "Supervisor Maintenance", recipientRole: "Area Supervisor", deliveryStatus: "failed", violationId: "VIO-05", occurredAt: "2026-09-05T13:45:05+07:00" },
  ],
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeSafetySettings(settings?: Partial<SafetySettings>): SafetySettings {
  const fallback = clone(defaultSafetySettings);
  return {
    ...fallback,
    ...settings,
    deductions: settings?.deductions?.length ? clone(settings.deductions) : fallback.deductions,
    timeZone: "Asia/Jakarta",
  };
}

function normalizeCanonicalPpeClassConfiguration(
  configuration?: CanonicalPpeClassConfiguration,
): CanonicalPpeClassConfiguration {
  return clone(configuration ?? defaultCanonicalPpeClassConfiguration);
}

function normalizeData(input: DemoData): DemoData {
  const data = clone(input);
  data.employees = data.employees.map((employee) => ({
    ...employee,
    safetyScorePeriodStartedAt: employee.safetyScorePeriodStartedAt ?? "2026-09-01T00:00:00+07:00",
  }));
  data.safetySettings = normalizeSafetySettings(data.safetySettings ?? {
    escalationThreshold: data.escalationThreshold,
  });
  data.canonicalPpeClassConfiguration = normalizeCanonicalPpeClassConfiguration(data.canonicalPpeClassConfiguration);
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
  data.notificationRecipients = (data.notificationRecipients ?? clone(defaultNotificationRecipients)).map((recipient) => ({
    ...recipient,
    role: legacyRecipientRole[recipient.role] ?? recipient.role,
  }));
  data.notificationLogs = data.notificationLogs ?? [];
  data.complianceReportObservations = data.complianceReportObservations ?? clone(defaultComplianceReportObservations);
  data.monitoringSimulation = data.monitoringSimulation?.state
    ? data.monitoringSimulation
    : createMonitoringSimulation("normal");
  data.escalationThreshold = data.safetySettings.escalationThreshold;
  return data;
}

function createMonitoringSimulation(scenario: MonitoringScenario, episodeNumber = 1): MonitoringSimulation {
  const episodeId = `EPS-SIM-${String(episodeNumber).padStart(2, "0")}`;
  switch (scenario) {
    case "missing-ppe":
      return { scenario, cameraId: "CAM-01", state: "episode", episodeId, episodeStatus: "candidate", confidence: 0.96, identity: "employee", employeeId: "EMP-01", identityLabel: "Employee Production 01", missingCanonicalPpeClasses: ["Safety Vest"], confirmationElapsedSeconds: 0, clearingElapsedSeconds: 0 };
    case "unidentified":
      return { scenario, cameraId: "CAM-01", state: "episode", episodeId, episodeStatus: "candidate", confidence: 0.96, identity: "unidentified", identityLabel: "Unknown", missingCanonicalPpeClasses: ["Safety Vest"], confirmationElapsedSeconds: 0, clearingElapsedSeconds: 0 };
    case "camera-offline":
      return { scenario, cameraId: "CAM-02", state: "offline", episodeStatus: "cleared", confidence: 0, identity: "unidentified", identityLabel: "Unknown", missingCanonicalPpeClasses: [], confirmationElapsedSeconds: 0, clearingElapsedSeconds: 0 };
    case "score-escalation":
      return { scenario, cameraId: "CAM-01", state: "episode", episodeId, episodeStatus: "candidate", confidence: 0.96, identity: "employee", employeeId: "EMP-12", identityLabel: "Employee Maintenance 04", missingCanonicalPpeClasses: ["Safety Helmet"], confirmationElapsedSeconds: 0, clearingElapsedSeconds: 0 };
    default:
      return { scenario, cameraId: "CAM-01", state: "normal", episodeStatus: "cleared", confidence: 0.96, identity: "employee", employeeId: "EMP-01", identityLabel: "Employee Production 01", missingCanonicalPpeClasses: [], confirmationElapsedSeconds: 0, clearingElapsedSeconds: 0 };
  }
}

function deductionFor(data: DemoData, canonicalPpeClasses: string[]) {
  return canonicalPpeClasses.reduce((total, ppeClass) => {
    return total + (data.safetySettings?.deductions.find((item) => item.canonicalPpeClass === ppeClass)?.points ?? 0);
  }, 0);
}

function maskChatId(chatId: string) {
  const normalized = chatId.replace(/\s/g, "");
  if (normalized.length < 4) throw new Error("Telegram Chat ID must contain at least 4 characters.");
  return `•••• ${normalized.slice(-4)}`;
}

function nextNotificationRecipientId(recipients: NotificationRecipient[]) {
  const highestSequence = recipients.reduce((highest, recipient) => {
    const sequence = Number(recipient.id.replace("REC-", ""));
    return Number.isInteger(sequence) ? Math.max(highest, sequence) : highest;
  }, 0);
  return `REC-${String(highestSequence + 1).padStart(2, "0")}`;
}

function appendNotificationSimulationLog(
  data: DemoData,
  recipient: NotificationRecipient,
  deliveryStatus: "sent" | "failed",
  violationId: string,
  occurredAt: string,
): NotificationSimulationLog {
  const log: NotificationSimulationLog = {
    id: `NTF-${String((data.notificationLogs?.length ?? 0) + 1).padStart(2, "0")}`,
    recipientId: recipient.id,
    recipientName: recipient.name,
    recipientRole: recipient.role,
    deliveryStatus,
    violationId,
    occurredAt,
  };
  data.notificationLogs?.push(log);
  const violation = data.violations.find((item) => item.id === violationId);
  if (violation) {
    violation.notificationRecipients = [
      ...(violation.notificationRecipients ?? []).filter((item) => item.name !== recipient.name || item.role !== recipient.role),
      { name: recipient.name, role: recipient.role, deliveryStatus },
    ];
  }
  return log;
}

function confirmMonitoringSimulation(data: DemoData, simulation: MonitoringSimulation) {
  if (simulation.eventId) return;

  const sequence = data.violations.filter((violation) => violation.id.startsWith("VIO-SIM-")).length + 1;
  const eventId = `VIO-SIM-${String(sequence).padStart(2, "0")}`;
  simulation.eventId = eventId;
  const violation: ViolationRecord = {
    id: eventId,
    status: "confirmed",
    zoneId: "ZON-01",
    cameraId: simulation.cameraId,
    episodeId: simulation.episodeId,
    employeeId: simulation.employeeId,
    missingCanonicalPpeClasses: clone(simulation.missingCanonicalPpeClasses),
    confidence: simulation.confidence,
    detectedAt: "2026-09-09T10:00:00+07:00",
    updatedAt: "2026-09-09T10:00:00+07:00",
    notificationRecipients: [],
    timeline: [
      { status: "candidate", occurredAt: "2026-09-09T09:59:55+07:00", description: "Missing PPE signal entered verification." },
      { status: "confirmed", occurredAt: "2026-09-09T10:00:00+07:00", description: "Violation Event recorded." },
    ],
  };
  data.violations.push(violation);

  if (!simulation.employeeId) return;
  const employee = data.employees.find((item) => item.id === simulation.employeeId);
  if (!employee) return;
  const deduction = deductionFor(data, simulation.missingCanonicalPpeClasses);
  const before = employee.safetyScore;
  const after = Math.max(0, before - deduction);
  employee.safetyScore = after;
  employee.lastAuditAt = "2026-09-09T10:00:00+07:00";
  employee.auditSummary = {
    violationCount: (employee.auditSummary?.violationCount ?? 0) + 1,
    resetCount: employee.auditSummary?.resetCount ?? 0,
  };
  simulation.scoreChange = { before, after, crossedEscalationThreshold: before >= data.escalationThreshold && after < data.escalationThreshold };
  violation.scoreChange = { before, after };
  if (simulation.scoreChange.crossedEscalationThreshold) {
    const recipients = data.notificationRecipients?.filter((recipient) => {
      if (recipient.role === "Human Resources (HR)") return recipient.scope.type === "global";
      return (recipient.scope.type === "zone" && recipient.scope.zoneId === violation.zoneId)
        || (recipient.scope.type === "department" && recipient.scope.departmentId === employee.departmentId);
    }) ?? [];
    recipients.forEach((recipient) => appendNotificationSimulationLog(data, recipient, "sent", violation.id, violation.detectedAt ?? "2026-09-09T10:00:00+07:00"));
  }
}

function calculateOverview(data: DemoData): OverviewData {
  const escalationThreshold = data.safetySettings?.escalationThreshold ?? data.escalationThreshold;
  return {
    activeCameras: data.cameras.filter((camera) => camera.status === "online").length,
    totalCameras: data.cameras.length,
    activeViolations: data.violations.filter((violation) => violation.status === "confirmed").length,
    ppeCompliance: data.compliance.totalObservations === 0
      ? 0
      : Math.round((data.compliance.compliantObservations / data.compliance.totalObservations) * 100),
    employeesBelowEscalationThreshold: data.employees.filter(
      (employee) => employee.safetyScore < escalationThreshold,
    ).length,
  };
}

function withViolationHistory(data: DemoData, zone: HazardousZone): HazardousZoneWithViolationHistory {
  return {
    ...clone(zone),
    hasViolationHistory: data.violations.some((violation) => violation.zoneId === zone.id),
  };
}

export function createMockSawService({
  initialData,
  scenario = "ready",
  storage = typeof window === "undefined" ? null : window.localStorage,
}: MockServiceOptions = {}): SawApplicationCapabilities {
  let inMemoryData: DemoData | undefined;
  const persist = (data: DemoData) => {
    inMemoryData = clone(data);
    storage?.setItem(storageKey, JSON.stringify(data));
  };

  const readData = (): DemoData => {
    const persisted = storage?.getItem(storageKey);
    if (persisted) {
      const data = normalizeData(JSON.parse(persisted) as DemoData);
      inMemoryData = clone(data);
      return data;
    }
    if (inMemoryData) return clone(inMemoryData);

    const data = normalizeData(initialData ?? seedData);
    persist(data);
    return data;
  };

  return {
    async getOverview() {
      if (scenario === "loading") return new Promise<null>(() => undefined);
      if (scenario === "error") throw new Error("SAW demo data could not be loaded.");
      if (scenario === "empty") return null;
      return calculateOverview(readData());
    },
    async resetDemoData() {
      const data = normalizeData(seedData);
      persist(data);
      return calculateOverview(data);
    },
    async getComplianceReport() {
      if (scenario === "loading") return new Promise<ComplianceReportData>(() => undefined);
      if (scenario === "error") throw new Error("Report PPE Compliance tidak dapat dimuat.");

      const data = readData();
      return {
        observations: scenario === "empty" ? [] : clone(data.complianceReportObservations ?? []),
        zones: clone(data.hazardousZones ?? []),
        employees: clone(data.employees),
        escalationThreshold: data.escalationThreshold,
      };
    },
    async getCameras(scope = "all") {
      if (scenario === "loading") return new Promise<Camera[]>(() => undefined);
      if (scenario === "error") throw new Error("Camera Sources could not be loaded.");
      if (scenario === "empty") return [];

      const cameras = readData().cameras;
      return clone(typeof scope === "object"
        ? cameras.filter((camera) => camera.supervisorArea === scope.area)
        : cameras);
    },
    async updateCameraMetadata(id, metadata) {
      const data = readData();
      const camera = data.cameras.find((item) => item.id === id);
      if (!camera) throw new Error("Camera Source was not found.");

      camera.name = metadata.name.trim();
      camera.location = metadata.location.trim();
      persist(data);
      return clone(camera);
    },
    async getHazardousZone() {
      if (scenario === "loading") return new Promise<HazardousZoneWithViolationHistory[]>(() => undefined);
      if (scenario === "error") throw new Error("Hazardous Zones could not be loaded.");
      if (scenario === "empty") return [];
      const data = readData();
      return (data.hazardousZones ?? []).map((zone) => withViolationHistory(data, zone));
    },
    async saveHazardousZone(zone) {
      if (scenario === "error") throw new Error("Hazardous Zone could not be saved.");
      if (!zone.name.trim()) throw new Error("Hazardous Zone name is required.");
      if (!zone.requiredCanonicalPpeClasses.length) throw new Error("Select at least one Canonical PPE Class.");
      if (!zone.supervisorAreas.length) throw new Error("Select at least one Area Supervisor.");

      const { x, y, width, height } = zone.bounds;
      if (![x, y, width, height].every((value) => Number.isFinite(value)) || x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > 1 || y + height > 1) {
        throw new Error("Hazardous Zone coordinates must be between 0 and 1.");
      }

      const data = readData();
      if (!data.cameras.some((camera) => camera.id === zone.cameraId)) throw new Error("Camera Source was not found.");

      const zones = data.hazardousZones ?? [];
      const id = zone.id ?? `ZON-${String(zones.length + 1).padStart(2, "0")}`;
      const saved: HazardousZone = { ...clone(zone), id, name: zone.name.trim() };
      const existingIndex = zones.findIndex((item) => item.id === id);
      const previousCameraId = existingIndex === -1 ? undefined : zones[existingIndex].cameraId;
      if (existingIndex === -1) zones.push(saved);
      else zones[existingIndex] = saved;
      data.hazardousZones = zones;

      if (previousCameraId && previousCameraId !== saved.cameraId) {
        const previousCamera = data.cameras.find((camera) => camera.id === previousCameraId);
        if (previousCamera) previousCamera.zoneIds = previousCamera.zoneIds.filter((zoneId) => zoneId !== id);
      }
      const camera = data.cameras.find((item) => item.id === saved.cameraId)!;
      if (!camera.zoneIds.includes(id)) camera.zoneIds.push(id);
      persist(data);
      return withViolationHistory(data, saved);
    },
    async deactivateHazardousZone(id) {
      if (scenario === "error") throw new Error("Hazardous Zone tidak dapat diperbarui.");
      const data = readData();
      const zone = data.hazardousZones?.find((item) => item.id === id);
      if (!zone) throw new Error("Hazardous Zone was not found.");

      zone.active = false;
      persist(data);
      return withViolationHistory(data, zone);
    },
    async deleteHazardousZone(id) {
      if (scenario === "error") throw new Error("Hazardous Zone tidak dapat dihapus.");
      const data = readData();
      const zones = data.hazardousZones ?? [];
      if (!zones.some((zone) => zone.id === id)) throw new Error("Hazardous Zone was not found.");
      if (data.violations.some((violation) => violation.zoneId === id)) {
        throw new Error("Hazardous Zone dengan riwayat Violation tidak dapat dihapus permanen.");
      }

      data.hazardousZones = zones.filter((zone) => zone.id !== id);
      data.zones = data.zones.filter((zoneId) => zoneId !== id);
      data.cameras.forEach((camera) => {
        camera.zoneIds = camera.zoneIds.filter((zoneId) => zoneId !== id);
      });
      persist(data);
    },
    async getViolationHistory() {
      if (scenario === "loading") return new Promise<ViolationRecord[]>(() => undefined);
      if (scenario === "error") throw new Error("History Violation tidak dapat dimuat.");
      if (scenario === "empty") return [];
      return clone(readData().violations);
    },
    async getEmployeeDirectory(scope = "all") {
      if (scenario === "loading") return new Promise<EmployeeDirectoryData>(() => undefined);
      if (scenario === "error") throw new Error("Direktori Employee tidak dapat dimuat.");
      if (scenario === "empty") return { employees: [], escalationThreshold: readData().escalationThreshold };

      const data = readData();
      const employees = typeof scope === "object"
        ? data.employees.filter((employee) => (employee.supervisorArea ?? employee.departmentId) === scope.area)
        : data.employees;
      return { employees: clone(employees), escalationThreshold: data.escalationThreshold };
    },
    async getSafetyScoreAudit(employeeId) {
      const data = readData();
      return {
        periods: clone(data.scorePeriods?.filter((period) => period.employeeId === employeeId) ?? []),
        ledger: clone(data.safetyScoreLedger?.filter((entry) => entry.employeeId === employeeId) ?? []),
        resetLogs: clone(data.safetyScoreResetLogs?.filter((log) => log.employeeId === employeeId) ?? []),
      };
    },
    async resetSafetyScore(request) {
      const note = request.note?.trim();
      if (!safetyScoreResetReasons.includes(request.reason)) throw new Error("Invalid Score Reset reason.");
      if (request.reason === "Other" && !note) throw new Error("A note is required for the Other reason.");

      const data = readData();
      const employee = data.employees.find((item) => item.id === request.employeeId);
      if (!employee) throw new Error("Employee was not found.");

      const timestamp = new Date().toISOString();
      const scoreBefore = employee.safetyScore;
      const scoreAfter = data.safetySettings?.initialScore ?? defaultSafetySettings.initialScore;
      const sequence = (data.scorePeriods?.length ?? 0) + 1;
      const periodId = `PER-${String(sequence).padStart(4, "0")}`;
      const ledgerEntryId = `LED-${String(sequence).padStart(4, "0")}`;
      const resetLogId = `RSL-${String(sequence).padStart(4, "0")}`;
      const closedPeriod: SafetyScorePeriod = {
        id: periodId,
        employeeId: employee.id,
        startedAt: employee.safetyScorePeriodStartedAt ?? timestamp,
        closedAt: timestamp,
        finalScoreBeforeReset: scoreBefore,
        totalViolations: employee.auditSummary?.violationCount ?? 0,
        violationsByCanonicalPpeClass: {},
        trigger: "Manual",
        resetReason: request.reason,
        ...(note ? { note } : {}),
        closedBy: request.actor,
      };
      const ledgerEntry: SafetyScoreLedgerEntry = {
        id: ledgerEntryId,
        employeeId: employee.id,
        periodId,
        scoreBefore,
        scoreAfter,
        recordedAt: timestamp,
        actor: request.actor,
      };
      const resetLog: SafetyScoreResetLog = {
        id: resetLogId,
        employeeId: employee.id,
        periodId,
        ledgerEntryId,
        trigger: "Manual",
        reason: request.reason,
        ...(note ? { note } : {}),
        actor: request.actor,
        occurredAt: timestamp,
      };

      employee.safetyScore = scoreAfter;
      employee.lastAuditAt = timestamp;
      employee.safetyScorePeriodStartedAt = timestamp;
      employee.auditSummary = {
        violationCount: employee.auditSummary?.violationCount ?? 0,
        resetCount: (employee.auditSummary?.resetCount ?? 0) + 1,
      };
      data.scorePeriods?.push(closedPeriod);
      data.safetyScoreLedger?.push(ledgerEntry);
      data.safetyScoreResetLogs?.push(resetLog);
      persist(data);

      return {
        employee: clone(employee),
        closedPeriod: clone(closedPeriod),
        ledgerEntry: clone(ledgerEntry),
        resetLog: clone(resetLog),
      };
    },
    async getSafetySettings() {
      if (scenario === "loading") return new Promise<SafetySettings>(() => undefined);
      if (scenario === "error") throw new Error("Parameters keselamatan tidak dapat dimuat.");
      return clone(readData().safetySettings ?? defaultSafetySettings);
    },
    async updateSafetySettings(settings) {
      if (scenario === "error") throw new Error("Parameters keselamatan tidak dapat disimpan.");

      const data = readData();
      const nextSettings = normalizeSafetySettings(settings);
      data.safetySettings = nextSettings;
      data.escalationThreshold = nextSettings.escalationThreshold;
      persist(data);
      return clone(nextSettings);
    },
    async getCanonicalPpeClassConfiguration() {
      if (scenario === "loading") return new Promise<CanonicalPpeClassConfiguration>(() => undefined);
      if (scenario === "error") throw new Error("Configuration Canonical PPE Class tidak dapat dimuat.");
      return clone(readData().canonicalPpeClassConfiguration ?? defaultCanonicalPpeClassConfiguration);
    },
    async updateCanonicalPpeClassConfiguration(configuration) {
      if (scenario === "error") throw new Error("Configuration Canonical PPE Class tidak dapat disimpan.");

      const duplicateIndex = configuration.mappings.find((mapping, index) =>
        configuration.mappings.some((candidate, candidateIndex) => candidateIndex !== index && candidate.yoloIndex === mapping.yoloIndex),
      );
      if (duplicateIndex) throw new Error(`Indeks YOLO ${duplicateIndex.yoloIndex} sudah digunakan.`);

      const data = readData();
      data.canonicalPpeClassConfiguration = normalizeCanonicalPpeClassConfiguration(configuration);
      persist(data);
      return clone(data.canonicalPpeClassConfiguration);
    },
    async getNotificationRecipients() {
      if (scenario === "loading") return new Promise<NotificationRecipient[]>(() => undefined);
      if (scenario === "error") throw new Error("Configuration notifikasi tidak dapat dimuat.");
      return clone(readData().notificationRecipients ?? []);
    },
    async saveNotificationRecipient(input) {
      if (scenario === "error") throw new Error("Penerima notifikasi tidak dapat disimpan.");
      const name = input.name.trim();
      const scope = input.scope;
      if (!name) throw new Error("Recipient name is required.");
      if (input.role === "Human Resources (HR)" && scope.type !== "global") throw new Error("A Human Resources (HR) recipient must use global scope.");
      if (input.role === "Area Supervisor" && scope.type === "global") throw new Error("An Area Supervisor must be assigned to a Hazardous Zone or department.");

      const data = readData();
      if (scope.type === "zone" && !data.hazardousZones?.some((zone) => zone.id === scope.zoneId)) {
        throw new Error("Hazardous Zone was not found.");
      }
      if (scope.type === "department" && !data.departments.includes(scope.departmentId)) {
        throw new Error("Department was not found.");
      }
      const recipient: NotificationRecipient = {
        id: nextNotificationRecipientId(data.notificationRecipients ?? []),
        name,
        role: input.role,
        maskedChatId: maskChatId(input.chatId),
        scope: clone(scope),
      };
      data.notificationRecipients?.push(recipient);
      persist(data);
      return clone(recipient);
    },
    async deleteNotificationRecipient(id) {
      if (scenario === "error") throw new Error("Penerima notifikasi tidak dapat dihapus.");
      const data = readData();
      const recipient = data.notificationRecipients?.find((item) => item.id === id);
      if (!recipient) throw new Error("Penerima notifikasi tidak ditemukan.");
      data.notificationRecipients = data.notificationRecipients?.filter((item) => item.id !== id);
      persist(data);
    },
    async getNotificationSimulationLogs() {
      if (scenario === "loading") return new Promise<NotificationSimulationLog[]>(() => undefined);
      if (scenario === "error") throw new Error("Log notifikasi tidak dapat dimuat.");
      return clone(readData().notificationLogs ?? []);
    },
    async simulateNotification(recipientId, deliveryStatus) {
      if (scenario === "error") throw new Error("Uji notifikasi tidak dapat dijalankan.");
      const data = readData();
      const recipient = data.notificationRecipients?.find((item) => item.id === recipientId);
      if (!recipient) throw new Error("Penerima notifikasi tidak ditemukan.");
      const violationId = data.violations[0]?.id;
      if (!violationId) throw new Error("No Violation Event untuk simulasi.");
      const log = appendNotificationSimulationLog(data, recipient, deliveryStatus, violationId, "2026-09-09T10:15:00+07:00");
      persist(data);
      return clone(log);
    },
    async getMonitoringSimulation() {
      if (scenario === "error") throw new Error("Simulator Violation Episode tidak dapat dimuat.");
      return clone(readData().monitoringSimulation ?? createMonitoringSimulation("normal"));
    },
    async selectMonitoringScenario(nextScenario) {
      const data = readData();
      const episodeNumber = data.violations.filter((violation) => violation.episodeId?.startsWith("EPS-SIM-")).length + 1;
      const simulation = createMonitoringSimulation(nextScenario, episodeNumber);
      data.monitoringSimulation = simulation;
      persist(data);
      return clone(simulation);
    },
    async processMonitoringFrame(frame) {
      const data = readData();
      const simulation = data.monitoringSimulation ?? createMonitoringSimulation("normal");
      simulation.confidence = frame.confidence;
      const minimumConfidence = data.safetySettings?.minimumConfidence ?? defaultSafetySettings.minimumConfidence;
      if (frame.confidence < minimumConfidence || simulation.state !== "episode") {
        data.monitoringSimulation = simulation;
        persist(data);
        return clone(simulation);
      }

      if (simulation.episodeStatus === "candidate") {
        if (frame.isCompliant) simulation.state = "normal";
        else {
          simulation.confirmationElapsedSeconds += frame.elapsedSeconds;
          if (simulation.confirmationElapsedSeconds >= (data.safetySettings?.confirmThresholdSeconds ?? defaultSafetySettings.confirmThresholdSeconds)) {
            simulation.episodeStatus = "confirmed";
            confirmMonitoringSimulation(data, simulation);
          }
        }
      } else if (simulation.episodeStatus === "confirmed") {
        if (frame.isCompliant) {
          simulation.episodeStatus = "clearing";
          simulation.clearingElapsedSeconds = 0;
          const event = data.violations.find((violation) => violation.id === simulation.eventId);
          if (event) {
            event.status = "clearing";
            event.updatedAt = "2026-09-09T10:00:01+07:00";
            event.timeline?.push({ status: "clearing", occurredAt: event.updatedAt, description: "Violation Episode entered Clearing." });
          }
        }
      } else if (simulation.episodeStatus === "clearing") {
        if (!frame.isCompliant) {
          simulation.episodeStatus = "confirmed";
          const event = data.violations.find((violation) => violation.id === simulation.eventId);
          if (event) {
            event.status = "confirmed";
            event.updatedAt = "2026-09-09T10:00:02+07:00";
            event.timeline?.push({ status: "confirmed", occurredAt: event.updatedAt, description: "PPE became non-compliant again; the Violation Episode returned to Violation." });
          }
        }
        else {
          simulation.clearingElapsedSeconds += frame.elapsedSeconds;
          if (simulation.clearingElapsedSeconds >= (data.safetySettings?.clearThresholdSeconds ?? defaultSafetySettings.clearThresholdSeconds)) {
            simulation.episodeStatus = "cleared";
            const event = data.violations.find((violation) => violation.id === simulation.eventId);
            if (event) {
              event.status = "cleared";
              event.updatedAt = "2026-09-09T10:00:03+07:00";
              event.timeline?.push({ status: "cleared", occurredAt: event.updatedAt, description: "Violation Episode Cleared." });
            }
          }
        }
      }
      data.monitoringSimulation = simulation;
      persist(data);
      return clone(simulation);
    },
  };
}
