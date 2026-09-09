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

export type DangerZone = {
  id: string;
  name: string;
  cameraId: string;
  active: boolean;
  bounds: NormalizedZoneBounds;
  requiredCanonicalApdClasses: string[];
  supervisorAreas: string[];
};

export type DangerZoneInput = Omit<DangerZone, "id"> & { id?: string };
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
  violations: Array<{ id: string; status: "confirmed" | "cleared" }>;
  zones: string[];
  dangerZones?: DangerZone[];
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
  getDangerZones(): Promise<DangerZone[]>;
  saveDangerZone(zone: DangerZoneInput): Promise<DangerZone>;
  getEmployeeDirectory(scope?: EmployeeScope): Promise<EmployeeDirectoryData>;
  getSafetyScoreAudit(employeeId: string): Promise<SafetyScoreAudit>;
  resetSafetyScore(request: SafetyScoreResetRequest): Promise<SafetyScoreResetResult>;
  getSafetySettings(): Promise<SafetySettings>;
  updateSafetySettings(settings: SafetySettings): Promise<SafetySettings>;
  getCanonicalApdClassConfiguration(): Promise<CanonicalApdClassConfiguration>;
  updateCanonicalApdClassConfiguration(configuration: CanonicalApdClassConfiguration): Promise<CanonicalApdClassConfiguration>;
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

const defaultDangerZones: DangerZone[] = [
  { id: "ZON-01", name: "Zona Gerbang Utama", cameraId: "CAM-01", active: true, bounds: { x: 0.12, y: 0.18, width: 0.3, height: 0.52 }, requiredCanonicalApdClasses: ["Helm Keselamatan", "Rompi Keselamatan"], supervisorAreas: ["Produksi"] },
  { id: "ZON-02", name: "Zona Mesin Press", cameraId: "CAM-01", active: true, bounds: { x: 0.58, y: 0.2, width: 0.25, height: 0.43 }, requiredCanonicalApdClasses: ["Helm Keselamatan"], supervisorAreas: ["Produksi"] },
  { id: "ZON-03", name: "Zona Bongkar Gudang", cameraId: "CAM-02", active: true, bounds: { x: 0.16, y: 0.32, width: 0.26, height: 0.38 }, requiredCanonicalApdClasses: ["Helm Keselamatan", "Masker"], supervisorAreas: ["Gudang"] },
  { id: "ZON-04", name: "Zona Rak Bahan", cameraId: "CAM-02", active: false, bounds: { x: 0.55, y: 0.2, width: 0.28, height: 0.48 }, requiredCanonicalApdClasses: ["Rompi Keselamatan"], supervisorAreas: ["Gudang"] },
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
    { id: "VIO-01", status: "confirmed" },
    { id: "VIO-02", status: "cleared" },
  ],
  compliance: { compliantObservations: 83, totalObservations: 100 },
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
  data.dangerZones = data.dangerZones ?? clone(defaultDangerZones);
  data.escalationThreshold = data.safetySettings.escalationThreshold;
  return data;
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

export function createMockSawService({
  initialData,
  scenario = "ready",
  storage = typeof window === "undefined" ? null : window.localStorage,
}: MockServiceOptions = {}): SawService {
  const persist = (data: DemoData) => storage?.setItem(storageKey, JSON.stringify(data));

  const readData = (): DemoData => {
    const persisted = storage?.getItem(storageKey);
    if (persisted) return normalizeData(JSON.parse(persisted) as DemoData);

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
    async getDangerZones() {
      if (scenario === "loading") return new Promise<DangerZone[]>(() => undefined);
      if (scenario === "error") throw new Error("Zona Berbahaya tidak dapat dimuat.");
      if (scenario === "empty") return [];
      return clone(readData().dangerZones ?? []);
    },
    async saveDangerZone(zone) {
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

      const zones = data.dangerZones ?? [];
      const id = zone.id ?? `ZON-${String(zones.length + 1).padStart(2, "0")}`;
      const saved: DangerZone = { ...clone(zone), id, name: zone.name.trim() };
      const existingIndex = zones.findIndex((item) => item.id === id);
      const previousCameraId = existingIndex === -1 ? undefined : zones[existingIndex].cameraId;
      if (existingIndex === -1) zones.push(saved);
      else zones[existingIndex] = saved;
      data.dangerZones = zones;

      if (previousCameraId && previousCameraId !== saved.cameraId) {
        const previousCamera = data.cameras.find((camera) => camera.id === previousCameraId);
        if (previousCamera) previousCamera.zoneIds = previousCamera.zoneIds.filter((zoneId) => zoneId !== id);
      }
      const camera = data.cameras.find((item) => item.id === saved.cameraId)!;
      if (!camera.zoneIds.includes(id)) camera.zoneIds.push(id);
      persist(data);
      return clone(saved);
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
  };
}
