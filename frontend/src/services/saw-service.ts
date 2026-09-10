export type ServiceScenario = "ready" | "loading" | "empty" | "error";

export type CameraStatus = "online" | "degraded" | "offline";

export type SafetyDeduction = {
  canonicalApdClass: string;
  points: number;
};

export type ApdComplianceCategory = "compliance" | "violation";

export type CanonicalApdClassMapping = {
  id: string;
  yoloIndex: number;
  rawLabel: string;
  canonicalApdClass: string;
  complianceCategory: ApdComplianceCategory;
  active: boolean;
};

export type OnnxModelMetadata = {
  fileName: string;
  sizeBytes: number;
  mimeType: string;
};

export type CanonicalApdClassConfiguration = {
  mappings: CanonicalApdClassMapping[];
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
    { canonicalApdClass: "Helm Keselamatan", points: 10 },
    { canonicalApdClass: "Rompi Keselamatan", points: 8 },
    { canonicalApdClass: "Sepatu Keselamatan", points: 12 },
    { canonicalApdClass: "Pelindung Pendengaran", points: 6 },
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

export type ZonaBerbahaya = {
  id: string;
  name: string;
  cameraId: string;
  active: boolean;
  bounds: NormalizedZoneBounds;
  requiredCanonicalApdClasses: string[];
  supervisorAreas: string[];
};

export type ZonaBerbahayaWithViolationHistory = ZonaBerbahaya & {
  hasViolationHistory: boolean;
};

export type ZonaBerbahayaInput = Omit<ZonaBerbahaya, "id"> & { id?: string };
export type ViolationTimelineEntry = {
  status: EpisodeStatus;
  occurredAt: string;
  description: string;
};

export type ViolationNotificationRecipient = {
  name: string;
  role: "HRD" | "Supervisor Area";
  deliveryStatus: "sent" | "failed" | "pending";
};

export type NotificationRecipientRole = "HRD" | "Supervisor Area";

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
  missingCanonicalApdClasses?: string[];
  confidence?: number;
  detectedAt?: string;
  updatedAt?: string;
  scoreChange?: { before: number; after: number };
  notificationRecipients?: ViolationNotificationRecipient[];
  timeline?: ViolationTimelineEntry[];
};

export type MonitoringScenario = "normal" | "missing-apd" | "unidentified" | "camera-offline" | "score-escalation";
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
  missingCanonicalApdClasses: string[];
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
  "TeguranBriefingDiberikan",
  "TrainingSelesai",
  "InvestigasiDitutup",
  "PerbaikanFisikZona",
  "Lainnya",
] as const;

export type SafetyScoreResetReason = (typeof safetyScoreResetReasons)[number];

export const safetyScoreResetReasonLabels: Record<SafetyScoreResetReason, string> = {
  TeguranBriefingDiberikan: "Teguran dan briefing telah diberikan",
  TrainingSelesai: "Pelatihan telah selesai",
  InvestigasiDitutup: "Investigasi telah ditutup",
  PerbaikanFisikZona: "Perbaikan fisik Zona Berbahaya telah selesai",
  Lainnya: "Lainnya",
};

export type SafetyScorePeriod = {
  id: string;
  employeeId: string;
  startedAt: string;
  closedAt: string;
  finalScoreBeforeReset: number;
  totalViolations: number;
  violationsByCanonicalApdClass: Record<string, number>;
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
  canonicalApdClassConfiguration?: CanonicalApdClassConfiguration;
  scorePeriods?: SafetyScorePeriod[];
  safetyScoreLedger?: SafetyScoreLedgerEntry[];
  safetyScoreResetLogs?: SafetyScoreResetLog[];
  violations: ViolationRecord[];
  zones: string[];
  zonaBerbahaya?: ZonaBerbahaya[];
  monitoringSimulation?: MonitoringSimulation;
  notificationRecipients?: NotificationRecipient[];
  notificationLogs?: NotificationSimulationLog[];
};

export type OverviewData = {
  activeCameras: number;
  activeViolations: number;
  apdCompliance: number;
  employeesBelowEscalationThreshold: number;
  totalCameras: number;
};

export interface SawService {
  getOverview(): Promise<OverviewData | null>;
  resetDemoData(): Promise<OverviewData>;
  getCameras(scope?: CameraScope): Promise<Camera[]>;
  updateCameraMetadata(id: string, metadata: CameraMetadata): Promise<Camera>;
  getZonaBerbahaya(): Promise<ZonaBerbahayaWithViolationHistory[]>;
  saveZonaBerbahaya(zone: ZonaBerbahayaInput): Promise<ZonaBerbahayaWithViolationHistory>;
  deactivateZonaBerbahaya(id: string): Promise<ZonaBerbahayaWithViolationHistory>;
  deleteZonaBerbahaya(id: string): Promise<void>;
  getViolationHistory(): Promise<ViolationRecord[]>;
  getEmployeeDirectory(scope?: EmployeeScope): Promise<EmployeeDirectoryData>;
  getSafetyScoreAudit(employeeId: string): Promise<SafetyScoreAudit>;
  resetSafetyScore(request: SafetyScoreResetRequest): Promise<SafetyScoreResetResult>;
  getSafetySettings(): Promise<SafetySettings>;
  updateSafetySettings(settings: SafetySettings): Promise<SafetySettings>;
  getCanonicalApdClassConfiguration(): Promise<CanonicalApdClassConfiguration>;
  updateCanonicalApdClassConfiguration(configuration: CanonicalApdClassConfiguration): Promise<CanonicalApdClassConfiguration>;
  getNotificationRecipients(): Promise<NotificationRecipient[]>;
  saveNotificationRecipient(input: NotificationRecipientInput): Promise<NotificationRecipient>;
  deleteNotificationRecipient(id: string): Promise<void>;
  getNotificationSimulationLogs(): Promise<NotificationSimulationLog[]>;
  simulateNotification(recipientId: string, deliveryStatus: "sent" | "failed"): Promise<NotificationSimulationLog>;
  getMonitoringSimulation(): Promise<MonitoringSimulation>;
  selectMonitoringScenario(scenario: MonitoringScenario): Promise<MonitoringSimulation>;
  processMonitoringFrame(frame: MonitoringFrame): Promise<MonitoringSimulation>;
}

type MockServiceOptions = {
  initialData?: DemoData;
  scenario?: ServiceScenario;
  storage?: Storage | null;
};

const storageKey = "saw-demo-data";

const defaultCanonicalApdClassConfiguration: CanonicalApdClassConfiguration = {
  mappings: [
    { id: "APD-01", yoloIndex: 0, rawLabel: "helmet", canonicalApdClass: "Helm Keselamatan", complianceCategory: "compliance", active: true },
    { id: "APD-02", yoloIndex: 1, rawLabel: "hardhat", canonicalApdClass: "Helm Keselamatan", complianceCategory: "compliance", active: true },
    { id: "APD-03", yoloIndex: 2, rawLabel: "mask", canonicalApdClass: "Masker", complianceCategory: "compliance", active: true },
    { id: "APD-04", yoloIndex: 3, rawLabel: "Masker", canonicalApdClass: "Masker", complianceCategory: "compliance", active: true },
    { id: "APD-05", yoloIndex: 4, rawLabel: "no_vest", canonicalApdClass: "Rompi Keselamatan", complianceCategory: "violation", active: true },
  ],
  modelFileMetadata: {
    fileName: "saw-apd-demo.onnx",
    sizeBytes: 2048000,
    mimeType: "application/octet-stream",
  },
};

const defaultZonaBerbahaya: ZonaBerbahaya[] = [
  { id: "ZON-01", name: "Zona Gerbang Utama", cameraId: "CAM-01", active: true, bounds: { x: 0.12, y: 0.18, width: 0.3, height: 0.52 }, requiredCanonicalApdClasses: ["Helm Keselamatan", "Rompi Keselamatan"], supervisorAreas: ["Produksi"] },
  { id: "ZON-02", name: "Zona Mesin Press", cameraId: "CAM-01", active: true, bounds: { x: 0.58, y: 0.2, width: 0.25, height: 0.43 }, requiredCanonicalApdClasses: ["Helm Keselamatan"], supervisorAreas: ["Produksi"] },
  { id: "ZON-03", name: "Zona Bongkar Gudang", cameraId: "CAM-02", active: true, bounds: { x: 0.16, y: 0.32, width: 0.26, height: 0.38 }, requiredCanonicalApdClasses: ["Helm Keselamatan", "Masker"], supervisorAreas: ["Gudang"] },
  { id: "ZON-04", name: "Zona Rak Bahan", cameraId: "CAM-02", active: false, bounds: { x: 0.55, y: 0.2, width: 0.28, height: 0.48 }, requiredCanonicalApdClasses: ["Rompi Keselamatan"], supervisorAreas: ["Gudang"] },
];

const defaultNotificationRecipients: NotificationRecipient[] = [
  { id: "REC-01", name: "HRD Operasional", role: "HRD", maskedChatId: "•••• 4821", scope: { type: "global" } },
  { id: "REC-02", name: "Supervisor Produksi", role: "Supervisor Area", maskedChatId: "•••• 7310", scope: { type: "zone", zoneId: "ZON-01" } },
  { id: "REC-03", name: "Supervisor Pemeliharaan", role: "Supervisor Area", maskedChatId: "•••• 9452", scope: { type: "department", departmentId: "Pemeliharaan" } },
];

const seedData: DemoData = {
  cameras: [
    {
      id: "CAM-01",
      name: "Gerbang Produksi",
      location: "Lini Produksi Utama",
      zoneIds: ["ZON-01", "ZON-02"],
      status: "online",
      lastUpdatedAt: "2026-09-08T08:15:00+07:00",
      supervisorArea: "Produksi",
    },
    {
      id: "CAM-02",
      name: "Gudang Bahan Baku",
      location: "Gudang Bahan Baku",
      zoneIds: ["ZON-03", "ZON-04"],
      status: "offline",
      lastUpdatedAt: "2026-09-08T07:48:00+07:00",
      supervisorArea: "Gudang",
    },
  ],
  zones: ["ZON-01", "ZON-02", "ZON-03", "ZON-04"],
  departments: ["Produksi", "Gudang", "Pemeliharaan"],
  employees: [
    { id: "EMP-01", name: "Karyawan Produksi 01", departmentId: "Produksi", supervisorArea: "Produksi", safetyScore: 92, enrollmentStatus: "enrolled", lastAuditAt: "2026-09-07T09:20:00+07:00", auditSummary: { violationCount: 0, resetCount: 1 } },
    { id: "EMP-02", name: "Karyawan Produksi 02", departmentId: "Produksi", supervisorArea: "Produksi", safetyScore: 84, enrollmentStatus: "enrolled", lastAuditAt: "2026-09-06T14:10:00+07:00", auditSummary: { violationCount: 1, resetCount: 0 } },
    { id: "EMP-03", name: "Karyawan Produksi 03", departmentId: "Produksi", supervisorArea: "Produksi", safetyScore: 58, enrollmentStatus: "pending", lastAuditAt: "2026-09-05T11:40:00+07:00", auditSummary: { violationCount: 3, resetCount: 0 } },
    { id: "EMP-04", name: "Karyawan Produksi 04", departmentId: "Produksi", supervisorArea: "Produksi", safetyScore: 77, enrollmentStatus: "enrolled", lastAuditAt: "2026-09-04T08:15:00+07:00", auditSummary: { violationCount: 1, resetCount: 0 } },
    { id: "EMP-05", name: "Karyawan Gudang 01", departmentId: "Gudang", supervisorArea: "Gudang", safetyScore: 68, enrollmentStatus: "enrolled", lastAuditAt: "2026-09-06T10:05:00+07:00", auditSummary: { violationCount: 2, resetCount: 1 } },
    { id: "EMP-06", name: "Karyawan Gudang 02", departmentId: "Gudang", supervisorArea: "Gudang", safetyScore: 96, enrollmentStatus: "enrolled", lastAuditAt: "2026-09-07T15:25:00+07:00", auditSummary: { violationCount: 0, resetCount: 0 } },
    { id: "EMP-07", name: "Karyawan Gudang 03", departmentId: "Gudang", supervisorArea: "Gudang", safetyScore: 55, enrollmentStatus: "not-enrolled", lastAuditAt: "2026-09-03T13:45:00+07:00", auditSummary: { violationCount: 4, resetCount: 0 } },
    { id: "EMP-08", name: "Karyawan Gudang 04", departmentId: "Gudang", supervisorArea: "Gudang", safetyScore: 73, enrollmentStatus: "enrolled", lastAuditAt: "2026-09-02T09:50:00+07:00", auditSummary: { violationCount: 1, resetCount: 0 } },
    { id: "EMP-09", name: "Karyawan Pemeliharaan 01", departmentId: "Pemeliharaan", supervisorArea: "Pemeliharaan", safetyScore: 88, enrollmentStatus: "enrolled", lastAuditAt: "2026-09-01T16:30:00+07:00", auditSummary: { violationCount: 0, resetCount: 1 } },
    { id: "EMP-10", name: "Karyawan Pemeliharaan 02", departmentId: "Pemeliharaan", supervisorArea: "Pemeliharaan", safetyScore: 90, enrollmentStatus: "enrolled", lastAuditAt: "2026-09-01T11:10:00+07:00", auditSummary: { violationCount: 0, resetCount: 0 } },
    { id: "EMP-11", name: "Karyawan Pemeliharaan 03", departmentId: "Pemeliharaan", supervisorArea: "Pemeliharaan", safetyScore: 79, enrollmentStatus: "pending", lastAuditAt: "2026-08-31T10:00:00+07:00", auditSummary: { violationCount: 1, resetCount: 0 } },
    { id: "EMP-12", name: "Karyawan Pemeliharaan 04", departmentId: "Pemeliharaan", supervisorArea: "Pemeliharaan", safetyScore: 65, enrollmentStatus: "enrolled", lastAuditAt: "2026-08-30T08:40:00+07:00", auditSummary: { violationCount: 2, resetCount: 0 } },
  ],
  escalationThreshold: 60,
  violations: [
    {
      id: "VIO-01", status: "cleared", zoneId: "ZON-01", cameraId: "CAM-01", episodeId: "EPS-001", employeeId: "EMP-02", missingCanonicalApdClasses: ["Rompi Keselamatan"], confidence: 0.96, detectedAt: "2026-09-01T08:10:00+07:00", updatedAt: "2026-09-01T08:20:00+07:00", scoreChange: { before: 92, after: 84 }, notificationRecipients: [{ name: "Supervisor Produksi", role: "Supervisor Area", deliveryStatus: "sent" }], timeline: [{ status: "candidate", occurredAt: "2026-09-01T08:10:00+07:00", description: "Sinyal APD hilang memasuki verifikasi." }, { status: "confirmed", occurredAt: "2026-09-01T08:10:05+07:00", description: "Peristiwa Pelanggaran dicatat dan Skor Keselamatan dikurangi." }, { status: "clearing", occurredAt: "2026-09-01T08:19:00+07:00", description: "Episode Pelanggaran memasuki Memulihkan." }, { status: "cleared", occurredAt: "2026-09-01T08:20:00+07:00", description: "Episode Pelanggaran Selesai dan tetap tersedia dalam riwayat." }],
    },
    {
      id: "VIO-02", status: "confirmed", zoneId: "ZON-04", cameraId: "CAM-02", episodeId: "EPS-002", missingCanonicalApdClasses: ["Masker"], confidence: 0.91, detectedAt: "2026-09-02T09:40:00+07:00", updatedAt: "2026-09-02T09:40:05+07:00", notificationRecipients: [{ name: "HRD Operasional", role: "HRD", deliveryStatus: "pending" }], timeline: [{ status: "candidate", occurredAt: "2026-09-02T09:40:00+07:00", description: "Orang Terdeteksi tidak dapat dicocokkan dengan Karyawan." }, { status: "confirmed", occurredAt: "2026-09-02T09:40:05+07:00", description: "Peristiwa Pelanggaran untuk Tidak Dikenali dicatat." }],
    },
    {
      id: "VIO-03", status: "cleared", zoneId: "ZON-03", cameraId: "CAM-02", episodeId: "EPS-003", employeeId: "EMP-05", missingCanonicalApdClasses: ["Helm Keselamatan"], confidence: 0.89, detectedAt: "2026-09-03T10:05:00+07:00", updatedAt: "2026-09-03T10:08:00+07:00", scoreChange: { before: 78, after: 68 }, notificationRecipients: [{ name: "Supervisor Gudang", role: "Supervisor Area", deliveryStatus: "sent" }], timeline: [{ status: "confirmed", occurredAt: "2026-09-03T10:05:05+07:00", description: "Peristiwa Pelanggaran dikonfirmasi." }, { status: "cleared", occurredAt: "2026-09-03T10:08:00+07:00", description: "Episode Pelanggaran Selesai." }],
    },
    {
      id: "VIO-04", status: "cleared", zoneId: "ZON-03", cameraId: "CAM-02", episodeId: "EPS-004", employeeId: "EMP-03", missingCanonicalApdClasses: ["Helm Keselamatan", "Rompi Keselamatan"], confidence: 0.94, detectedAt: "2026-09-04T11:20:00+07:00", updatedAt: "2026-09-04T11:30:00+07:00", scoreChange: { before: 76, after: 58 }, notificationRecipients: [{ name: "HRD Operasional", role: "HRD", deliveryStatus: "sent" }], timeline: [{ status: "confirmed", occurredAt: "2026-09-04T11:20:05+07:00", description: "Peristiwa Pelanggaran dikonfirmasi." }, { status: "cleared", occurredAt: "2026-09-04T11:30:00+07:00", description: "Episode Pelanggaran Selesai." }],
    },
    {
      id: "VIO-05", status: "cleared", zoneId: "ZON-01", cameraId: "CAM-01", episodeId: "EPS-005", employeeId: "EMP-07", missingCanonicalApdClasses: ["Rompi Keselamatan"], confidence: 0.87, detectedAt: "2026-09-05T13:45:00+07:00", updatedAt: "2026-09-05T13:53:00+07:00", scoreChange: { before: 63, after: 55 }, notificationRecipients: [{ name: "Supervisor Gudang", role: "Supervisor Area", deliveryStatus: "failed" }], timeline: [{ status: "confirmed", occurredAt: "2026-09-05T13:45:05+07:00", description: "Peristiwa Pelanggaran dikonfirmasi." }, { status: "cleared", occurredAt: "2026-09-05T13:53:00+07:00", description: "Episode Pelanggaran Selesai." }],
    },
  ],
  compliance: { compliantObservations: 83, totalObservations: 100 },
  notificationRecipients: defaultNotificationRecipients,
  notificationLogs: [
    { id: "NTF-01", recipientId: "REC-02", recipientName: "Supervisor Produksi", recipientRole: "Supervisor Area", deliveryStatus: "sent", violationId: "VIO-01", occurredAt: "2026-09-01T08:10:05+07:00" },
    { id: "NTF-02", recipientId: "REC-03", recipientName: "Supervisor Pemeliharaan", recipientRole: "Supervisor Area", deliveryStatus: "failed", violationId: "VIO-05", occurredAt: "2026-09-05T13:45:05+07:00" },
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

function normalizeCanonicalApdClassConfiguration(
  configuration?: CanonicalApdClassConfiguration,
): CanonicalApdClassConfiguration {
  return clone(configuration ?? defaultCanonicalApdClassConfiguration);
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
  data.canonicalApdClassConfiguration = normalizeCanonicalApdClassConfiguration(data.canonicalApdClassConfiguration);
  data.scorePeriods = data.scorePeriods ?? [];
  data.safetyScoreLedger = data.safetyScoreLedger ?? [];
  data.safetyScoreResetLogs = data.safetyScoreResetLogs ?? [];
  data.zonaBerbahaya = data.zonaBerbahaya ?? clone(defaultZonaBerbahaya);
  data.notificationRecipients = data.notificationRecipients ?? clone(defaultNotificationRecipients);
  data.notificationLogs = data.notificationLogs ?? [];
  data.monitoringSimulation = data.monitoringSimulation?.state
    ? data.monitoringSimulation
    : createMonitoringSimulation("normal");
  data.escalationThreshold = data.safetySettings.escalationThreshold;
  return data;
}

function createMonitoringSimulation(scenario: MonitoringScenario, episodeNumber = 1): MonitoringSimulation {
  const episodeId = `EPS-SIM-${String(episodeNumber).padStart(2, "0")}`;
  switch (scenario) {
    case "missing-apd":
      return { scenario, cameraId: "CAM-01", state: "episode", episodeId, episodeStatus: "candidate", confidence: 0.96, identity: "employee", employeeId: "EMP-01", identityLabel: "Karyawan Produksi 01", missingCanonicalApdClasses: ["Rompi Keselamatan"], confirmationElapsedSeconds: 0, clearingElapsedSeconds: 0 };
    case "unidentified":
      return { scenario, cameraId: "CAM-01", state: "episode", episodeId, episodeStatus: "candidate", confidence: 0.96, identity: "unidentified", identityLabel: "Tidak Dikenali", missingCanonicalApdClasses: ["Rompi Keselamatan"], confirmationElapsedSeconds: 0, clearingElapsedSeconds: 0 };
    case "camera-offline":
      return { scenario, cameraId: "CAM-02", state: "offline", episodeStatus: "cleared", confidence: 0, identity: "unidentified", identityLabel: "Tidak Dikenali", missingCanonicalApdClasses: [], confirmationElapsedSeconds: 0, clearingElapsedSeconds: 0 };
    case "score-escalation":
      return { scenario, cameraId: "CAM-01", state: "episode", episodeId, episodeStatus: "candidate", confidence: 0.96, identity: "employee", employeeId: "EMP-12", identityLabel: "Karyawan Pemeliharaan 04", missingCanonicalApdClasses: ["Helm Keselamatan"], confirmationElapsedSeconds: 0, clearingElapsedSeconds: 0 };
    default:
      return { scenario, cameraId: "CAM-01", state: "normal", episodeStatus: "cleared", confidence: 0.96, identity: "employee", employeeId: "EMP-01", identityLabel: "Karyawan Produksi 01", missingCanonicalApdClasses: [], confirmationElapsedSeconds: 0, clearingElapsedSeconds: 0 };
  }
}

function deductionFor(data: DemoData, canonicalApdClasses: string[]) {
  return canonicalApdClasses.reduce((total, apdClass) => {
    return total + (data.safetySettings?.deductions.find((item) => item.canonicalApdClass === apdClass)?.points ?? 0);
  }, 0);
}

function maskChatId(chatId: string) {
  const normalized = chatId.replace(/\s/g, "");
  if (normalized.length < 4) throw new Error("Chat ID Telegram harus berisi minimal 4 karakter.");
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
    missingCanonicalApdClasses: clone(simulation.missingCanonicalApdClasses),
    confidence: simulation.confidence,
    detectedAt: "2026-09-09T10:00:00+07:00",
    updatedAt: "2026-09-09T10:00:00+07:00",
    notificationRecipients: [],
    timeline: [
      { status: "candidate", occurredAt: "2026-09-09T09:59:55+07:00", description: "Sinyal APD hilang memasuki verifikasi." },
      { status: "confirmed", occurredAt: "2026-09-09T10:00:00+07:00", description: "Peristiwa Pelanggaran dicatat." },
    ],
  };
  data.violations.push(violation);

  if (!simulation.employeeId) return;
  const employee = data.employees.find((item) => item.id === simulation.employeeId);
  if (!employee) return;
  const deduction = deductionFor(data, simulation.missingCanonicalApdClasses);
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
      if (recipient.role === "HRD") return recipient.scope.type === "global";
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
    apdCompliance: data.compliance.totalObservations === 0
      ? 0
      : Math.round((data.compliance.compliantObservations / data.compliance.totalObservations) * 100),
    employeesBelowEscalationThreshold: data.employees.filter(
      (employee) => employee.safetyScore < escalationThreshold,
    ).length,
  };
}

function withViolationHistory(data: DemoData, zone: ZonaBerbahaya): ZonaBerbahayaWithViolationHistory {
  return {
    ...clone(zone),
    hasViolationHistory: data.violations.some((violation) => violation.zoneId === zone.id),
  };
}

export function createMockSawService({
  initialData,
  scenario = "ready",
  storage = typeof window === "undefined" ? null : window.localStorage,
}: MockServiceOptions = {}): SawService {
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
      if (scenario === "error") throw new Error("Data demo SAW tidak dapat dimuat.");
      if (scenario === "empty") return null;
      return calculateOverview(readData());
    },
    async resetDemoData() {
      const data = normalizeData(seedData);
      persist(data);
      return calculateOverview(data);
    },
    async getCameras(scope = "all") {
      if (scenario === "loading") return new Promise<Camera[]>(() => undefined);
      if (scenario === "error") throw new Error("Sumber Kamera tidak dapat dimuat.");
      if (scenario === "empty") return [];

      const cameras = readData().cameras;
      return clone(typeof scope === "object"
        ? cameras.filter((camera) => camera.supervisorArea === scope.area)
        : cameras);
    },
    async updateCameraMetadata(id, metadata) {
      const data = readData();
      const camera = data.cameras.find((item) => item.id === id);
      if (!camera) throw new Error("Sumber Kamera tidak ditemukan.");

      camera.name = metadata.name.trim();
      camera.location = metadata.location.trim();
      persist(data);
      return clone(camera);
    },
    async getZonaBerbahaya() {
      if (scenario === "loading") return new Promise<ZonaBerbahayaWithViolationHistory[]>(() => undefined);
      if (scenario === "error") throw new Error("Zona Berbahaya tidak dapat dimuat.");
      if (scenario === "empty") return [];
      const data = readData();
      return (data.zonaBerbahaya ?? []).map((zone) => withViolationHistory(data, zone));
    },
    async saveZonaBerbahaya(zone) {
      if (scenario === "error") throw new Error("Zona Berbahaya tidak dapat disimpan.");
      if (!zone.name.trim()) throw new Error("Nama Zona Berbahaya wajib diisi.");
      if (!zone.requiredCanonicalApdClasses.length) throw new Error("Pilih minimal satu Kelas APD Kanonis.");
      if (!zone.supervisorAreas.length) throw new Error("Pilih minimal satu Supervisor Area.");

      const { x, y, width, height } = zone.bounds;
      if (![x, y, width, height].every((value) => Number.isFinite(value)) || x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > 1 || y + height > 1) {
        throw new Error("Koordinat Zona Berbahaya harus berada dalam rentang 0 sampai 1.");
      }

      const data = readData();
      if (!data.cameras.some((camera) => camera.id === zone.cameraId)) throw new Error("Sumber Kamera tidak ditemukan.");

      const zones = data.zonaBerbahaya ?? [];
      const id = zone.id ?? `ZON-${String(zones.length + 1).padStart(2, "0")}`;
      const saved: ZonaBerbahaya = { ...clone(zone), id, name: zone.name.trim() };
      const existingIndex = zones.findIndex((item) => item.id === id);
      const previousCameraId = existingIndex === -1 ? undefined : zones[existingIndex].cameraId;
      if (existingIndex === -1) zones.push(saved);
      else zones[existingIndex] = saved;
      data.zonaBerbahaya = zones;

      if (previousCameraId && previousCameraId !== saved.cameraId) {
        const previousCamera = data.cameras.find((camera) => camera.id === previousCameraId);
        if (previousCamera) previousCamera.zoneIds = previousCamera.zoneIds.filter((zoneId) => zoneId !== id);
      }
      const camera = data.cameras.find((item) => item.id === saved.cameraId)!;
      if (!camera.zoneIds.includes(id)) camera.zoneIds.push(id);
      persist(data);
      return withViolationHistory(data, saved);
    },
    async deactivateZonaBerbahaya(id) {
      if (scenario === "error") throw new Error("Zona Berbahaya tidak dapat diperbarui.");
      const data = readData();
      const zone = data.zonaBerbahaya?.find((item) => item.id === id);
      if (!zone) throw new Error("Zona Berbahaya tidak ditemukan.");

      zone.active = false;
      persist(data);
      return withViolationHistory(data, zone);
    },
    async deleteZonaBerbahaya(id) {
      if (scenario === "error") throw new Error("Zona Berbahaya tidak dapat dihapus.");
      const data = readData();
      const zones = data.zonaBerbahaya ?? [];
      if (!zones.some((zone) => zone.id === id)) throw new Error("Zona Berbahaya tidak ditemukan.");
      if (data.violations.some((violation) => violation.zoneId === id)) {
        throw new Error("Zona Berbahaya dengan riwayat Pelanggaran tidak dapat dihapus permanen.");
      }

      data.zonaBerbahaya = zones.filter((zone) => zone.id !== id);
      data.zones = data.zones.filter((zoneId) => zoneId !== id);
      data.cameras.forEach((camera) => {
        camera.zoneIds = camera.zoneIds.filter((zoneId) => zoneId !== id);
      });
      persist(data);
    },
    async getViolationHistory() {
      if (scenario === "loading") return new Promise<ViolationRecord[]>(() => undefined);
      if (scenario === "error") throw new Error("Riwayat Pelanggaran tidak dapat dimuat.");
      if (scenario === "empty") return [];
      return clone(readData().violations);
    },
    async getEmployeeDirectory(scope = "all") {
      if (scenario === "loading") return new Promise<EmployeeDirectoryData>(() => undefined);
      if (scenario === "error") throw new Error("Direktori Karyawan tidak dapat dimuat.");
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
      if (!safetyScoreResetReasons.includes(request.reason)) throw new Error("Alasan Reset Skor tidak valid.");
      if (request.reason === "Lainnya" && !note) throw new Error("Catatan wajib diisi untuk alasan Lainnya.");

      const data = readData();
      const employee = data.employees.find((item) => item.id === request.employeeId);
      if (!employee) throw new Error("Karyawan tidak ditemukan.");

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
        violationsByCanonicalApdClass: {},
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
      if (scenario === "error") throw new Error("Parameter keselamatan tidak dapat dimuat.");
      return clone(readData().safetySettings ?? defaultSafetySettings);
    },
    async updateSafetySettings(settings) {
      if (scenario === "error") throw new Error("Parameter keselamatan tidak dapat disimpan.");

      const data = readData();
      const nextSettings = normalizeSafetySettings(settings);
      data.safetySettings = nextSettings;
      data.escalationThreshold = nextSettings.escalationThreshold;
      persist(data);
      return clone(nextSettings);
    },
    async getCanonicalApdClassConfiguration() {
      if (scenario === "loading") return new Promise<CanonicalApdClassConfiguration>(() => undefined);
      if (scenario === "error") throw new Error("Konfigurasi Kelas APD Kanonis tidak dapat dimuat.");
      return clone(readData().canonicalApdClassConfiguration ?? defaultCanonicalApdClassConfiguration);
    },
    async updateCanonicalApdClassConfiguration(configuration) {
      if (scenario === "error") throw new Error("Konfigurasi Kelas APD Kanonis tidak dapat disimpan.");

      const duplicateIndex = configuration.mappings.find((mapping, index) =>
        configuration.mappings.some((candidate, candidateIndex) => candidateIndex !== index && candidate.yoloIndex === mapping.yoloIndex),
      );
      if (duplicateIndex) throw new Error(`Indeks YOLO ${duplicateIndex.yoloIndex} sudah digunakan.`);

      const data = readData();
      data.canonicalApdClassConfiguration = normalizeCanonicalApdClassConfiguration(configuration);
      persist(data);
      return clone(data.canonicalApdClassConfiguration);
    },
    async getNotificationRecipients() {
      if (scenario === "loading") return new Promise<NotificationRecipient[]>(() => undefined);
      if (scenario === "error") throw new Error("Konfigurasi notifikasi tidak dapat dimuat.");
      return clone(readData().notificationRecipients ?? []);
    },
    async saveNotificationRecipient(input) {
      if (scenario === "error") throw new Error("Penerima notifikasi tidak dapat disimpan.");
      const name = input.name.trim();
      const scope = input.scope;
      if (!name) throw new Error("Nama penerima wajib diisi.");
      if (input.role === "HRD" && scope.type !== "global") throw new Error("Penerima HRD harus memakai cakupan global.");
      if (input.role === "Supervisor Area" && scope.type === "global") throw new Error("Supervisor Area harus dikaitkan dengan Zona Berbahaya atau departemen.");

      const data = readData();
      if (scope.type === "zone" && !data.zonaBerbahaya?.some((zone) => zone.id === scope.zoneId)) {
        throw new Error("Zona Berbahaya tidak ditemukan.");
      }
      if (scope.type === "department" && !data.departments.includes(scope.departmentId)) {
        throw new Error("Departemen tidak ditemukan.");
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
      if (!violationId) throw new Error("Tidak ada Peristiwa Pelanggaran untuk simulasi.");
      const log = appendNotificationSimulationLog(data, recipient, deliveryStatus, violationId, "2026-09-09T10:15:00+07:00");
      persist(data);
      return clone(log);
    },
    async getMonitoringSimulation() {
      if (scenario === "error") throw new Error("Simulator Episode Pelanggaran tidak dapat dimuat.");
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
            event.timeline?.push({ status: "clearing", occurredAt: event.updatedAt, description: "Episode Pelanggaran memasuki Memulihkan." });
          }
        }
      } else if (simulation.episodeStatus === "clearing") {
        if (!frame.isCompliant) {
          simulation.episodeStatus = "confirmed";
          const event = data.violations.find((violation) => violation.id === simulation.eventId);
          if (event) {
            event.status = "confirmed";
            event.updatedAt = "2026-09-09T10:00:02+07:00";
            event.timeline?.push({ status: "confirmed", occurredAt: event.updatedAt, description: "APD kembali tidak terpenuhi; Episode Pelanggaran kembali menjadi Pelanggaran." });
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
              event.timeline?.push({ status: "cleared", occurredAt: event.updatedAt, description: "Episode Pelanggaran Selesai." });
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
