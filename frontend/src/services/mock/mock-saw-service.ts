import {
  EmployeeCapabilityError,
  FaceEnrollmentError,
  safetyScoreResetReasons,
  type Camera,
  type CameraScope,
  type CanonicalPpeClassConfiguration,
  type ComplianceReportData,
  type DemoData,
  type Employee,
  type EmployeeDirectoryData,
  type EmployeeScope,
  type FaceSample,
  type HazardousZone,
  type HazardousZoneWithViolationHistory,
  type MonitoringSimulation,
  type NotificationRecipient,
  type NotificationSimulationLog,
  type OverviewData,
  type SafetyScoreLedgerEntry,
  type SafetyScorePeriod,
  type SafetyScoreResetLog,
  type SafetySettings,
  type ServiceScenario,
  type ViolationRecord,
} from "../../types";
import type { SawApplicationCapabilities } from "../contracts";
import {
  defaultCanonicalPpeClassConfiguration,
  defaultFaceEnrollmentPolicy,
  defaultSafetySettings,
} from "./data/default-settings";
import { seedData, storageKey } from "./data/seed-data";
import { clone } from "./helpers/clone";
import { validateAndComputeZoneBounds } from "./helpers/geometry";
import {
  calculateOverview,
  employeeMatchesScope,
  maskChatId,
  nextEmployeeId,
  nextFaceSampleId,
  nextNotificationRecipientId,
  normalizedEmployeeCode,
  withViolationHistory,
} from "./helpers/misc";
import {
  normalizeCanonicalPpeClassConfiguration,
  normalizeData,
  normalizeSafetySettings,
  synchronizeEmployeeFaceEnrollment,
} from "./helpers/normalizers";
import {
  appendNotificationSimulationLog,
  confirmMonitoringSimulation,
  createMonitoringSimulation,
} from "./helpers/simulation";

export type MockServiceOptions = {
  initialData?: DemoData;
  scenario?: ServiceScenario;
  storage?: Storage | null;
};

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
    async getOverview(): Promise<OverviewData | null> {
      if (scenario === "loading") return new Promise<null>(() => undefined);
      if (scenario === "error") throw new Error("SAW demo data could not be loaded.");
      if (scenario === "empty") return null;
      return calculateOverview(readData());
    },

    async resetDemoData(): Promise<OverviewData> {
      const data = normalizeData(seedData);
      persist(data);
      return calculateOverview(data);
    },

    async getComplianceReport(): Promise<ComplianceReportData> {
      if (scenario === "loading") return new Promise<ComplianceReportData>(() => undefined);
      if (scenario === "error") throw new Error("Report PPE Compliance tidak dapat dimuat.");

      const data = readData();
      return {
        observations:
          scenario === "empty" ? [] : clone(data.complianceReportObservations ?? []),
        zones: clone(data.hazardousZones ?? []),
        employees: clone(data.employees),
        escalationThreshold: data.escalationThreshold,
      };
    },

    async getCameras(scope: CameraScope = "all"): Promise<Camera[]> {
      if (scenario === "loading") return new Promise<Camera[]>(() => undefined);
      if (scenario === "error") throw new Error("Camera Sources could not be loaded.");
      if (scenario === "empty") return [];

      const cameras = readData().cameras;
      return clone(
        typeof scope === "object"
          ? cameras.filter((camera) => camera.supervisorArea === scope.area)
          : cameras
      );
    },

    async updateCameraMetadata(id, metadata): Promise<Camera> {
      const data = readData();
      const camera = data.cameras.find((item) => item.id === id);
      if (!camera) throw new Error("Camera Source was not found.");

      camera.name = metadata.name.trim();
      camera.location = metadata.location.trim();
      persist(data);
      return clone(camera);
    },

    async getHazardousZone(): Promise<HazardousZoneWithViolationHistory[]> {
      if (scenario === "loading") {
        return new Promise<HazardousZoneWithViolationHistory[]>(() => undefined);
      }
      if (scenario === "error") throw new Error("Hazardous Zones could not be loaded.");
      if (scenario === "empty") return [];
      const data = readData();
      return (data.hazardousZones ?? []).map((zone) => withViolationHistory(data, zone));
    },

    async saveHazardousZone(zone): Promise<HazardousZoneWithViolationHistory> {
      if (scenario === "error") throw new Error("Hazardous Zone could not be saved.");
      if (!zone.name.trim()) throw new Error("Hazardous Zone name is required.");
      if (!zone.requiredCanonicalPpeClasses.length) {
        throw new Error("Select at least one Canonical PPE Class.");
      }
      if (!zone.supervisorAreas.length) {
        throw new Error("Select at least one Area Supervisor.");
      }

      validateAndComputeZoneBounds(zone);

      const data = readData();
      if (!data.cameras.some((camera) => camera.id === zone.cameraId)) {
        throw new Error("Camera Source was not found.");
      }

      const zones = data.hazardousZones ?? [];
      const id = zone.id ?? `ZON-${String(zones.length + 1).padStart(2, "0")}`;
      const saved: HazardousZone = { ...clone(zone), id, name: zone.name.trim() };
      const existingIndex = zones.findIndex((item) => item.id === id);
      const previousCameraId =
        existingIndex === -1 ? undefined : zones[existingIndex].cameraId;
      if (existingIndex === -1) zones.push(saved);
      else zones[existingIndex] = saved;
      data.hazardousZones = zones;

      if (previousCameraId && previousCameraId !== saved.cameraId) {
        const previousCamera = data.cameras.find((camera) => camera.id === previousCameraId);
        if (previousCamera) {
          previousCamera.zoneIds = previousCamera.zoneIds.filter(
            (zoneId) => zoneId !== id
          );
        }
      }
      const camera = data.cameras.find((item) => item.id === saved.cameraId)!;
      if (!camera.zoneIds.includes(id)) camera.zoneIds.push(id);
      persist(data);
      return withViolationHistory(data, saved);
    },

    async deactivateHazardousZone(id): Promise<HazardousZoneWithViolationHistory> {
      if (scenario === "error") throw new Error("Hazardous Zone could not be updated.");
      const data = readData();
      const zone = data.hazardousZones?.find((item) => item.id === id);
      if (!zone) throw new Error("Hazardous Zone was not found.");

      zone.active = false;
      persist(data);
      return withViolationHistory(data, zone);
    },

    async deleteHazardousZone(id): Promise<void> {
      if (scenario === "error") throw new Error("Hazardous Zone could not be deleted.");
      const data = readData();
      const zones = data.hazardousZones ?? [];
      if (!zones.some((zone) => zone.id === id)) {
        throw new Error("Hazardous Zone was not found.");
      }
      if (data.violations.some((violation) => violation.zoneId === id)) {
        throw new Error("A Hazardous Zone with Violation History cannot be permanently deleted.");
      }

      data.hazardousZones = zones.filter((zone) => zone.id !== id);
      data.zones = data.zones.filter((zoneId) => zoneId !== id);
      data.cameras.forEach((camera) => {
        camera.zoneIds = camera.zoneIds.filter((zoneId) => zoneId !== id);
      });
      persist(data);
    },

    async getViolationHistory(): Promise<ViolationRecord[]> {
      if (scenario === "loading") return new Promise<ViolationRecord[]>(() => undefined);
      if (scenario === "error") throw new Error("History Violation tidak dapat dimuat.");
      if (scenario === "empty") return [];
      return clone(readData().violations);
    },

    async getEmployeeDirectory(
      scope: EmployeeScope = "all"
    ): Promise<EmployeeDirectoryData> {
      if (scenario === "loading") return new Promise<EmployeeDirectoryData>(() => undefined);
      if (scenario === "error") throw new Error("Employee Directory could not be loaded.");
      if (scenario === "empty") {
        return { employees: [], escalationThreshold: readData().escalationThreshold };
      }

      const data = readData();
      const employees = data.employees.filter((employee) =>
        employeeMatchesScope(employee, scope)
      );
      return { employees: clone(employees), escalationThreshold: data.escalationThreshold };
    },

    async getEmployee(employeeId: string, scope: EmployeeScope = "all"): Promise<Employee> {
      const employee = readData().employees.find((item) => item.id === employeeId);
      if (!employee || !employeeMatchesScope(employee, scope)) {
        throw new EmployeeCapabilityError("employee_not_found");
      }
      return clone(employee);
    },

    async createEmployee(input): Promise<Employee> {
      if (scenario === "error") {
        throw new Error("Employee registration could not be completed.");
      }

      const employeeCode = normalizedEmployeeCode(input.employeeCode);
      const name = input.fullName.trim();
      const departmentId = input.department.trim();
      if (
        !/^[A-Z0-9-]{1,50}$/.test(employeeCode) ||
        !name ||
        name.length > 200 ||
        !departmentId ||
        departmentId.length > 100
      ) {
        throw new EmployeeCapabilityError("employee_validation_failed");
      }

      const data = readData();
      if (
        data.employees.some(
          (employee) =>
            normalizedEmployeeCode(employee.employeeCode ?? employee.id) === employeeCode
        )
      ) {
        throw new EmployeeCapabilityError("employee_code_conflict");
      }
      const supervisor = input.supervisorId
        ? data.employees.find((employee) => employee.id === input.supervisorId)
        : undefined;
      if (input.supervisorId && (!supervisor || supervisor.status !== "active")) {
        throw new EmployeeCapabilityError("employee_not_found");
      }

      const employee: Employee = {
        id: nextEmployeeId(data.employees),
        employeeCode,
        name,
        departmentId,
        ...(input.supervisorId ? { supervisorId: input.supervisorId } : {}),
        status: "active",
        safetyScore:
          data.safetySettings?.initialScore ?? defaultSafetySettings.initialScore,
        faceSampleCount: 0,
        enrollmentStatus: "not-enrolled",
        safetyScorePeriodStartedAt: new Date().toISOString(),
        auditSummary: { violationCount: 0, resetCount: 0 },
      };
      data.employees.push(employee);
      if (!data.departments.includes(departmentId)) data.departments.push(departmentId);
      persist(data);
      return clone(employee);
    },

    async getFaceEnrollmentPolicy() {
      return clone(defaultFaceEnrollmentPolicy);
    },

    async getFaceSamples(employeeId): Promise<FaceSample[]> {
      const data = readData();
      if (!data.employees.some((employee) => employee.id === employeeId)) {
        throw new FaceEnrollmentError("employee_not_found");
      }
      return clone(
        data.faceSamples?.filter((sample) => sample.employeeId === employeeId) ?? []
      );
    },

    async enrollFaceSample(input): Promise<FaceSample> {
      const data = readData();
      const employee = data.employees.find((item) => item.id === input.employeeId);
      if (!employee) throw new FaceEnrollmentError("employee_not_found");
      if (
        !defaultFaceEnrollmentPolicy.acceptedMediaTypes.includes(
          input.image.type as "image/jpeg" | "image/png"
        )
      ) {
        throw new FaceEnrollmentError("unsupported_media_type");
      }
      if (input.image.size > defaultFaceEnrollmentPolicy.maximumFileSizeBytes) {
        throw new FaceEnrollmentError("file_too_large");
      }
      const samples = data.faceSamples ?? [];
      if (
        samples.filter((sample) => sample.employeeId === input.employeeId && sample.active)
          .length >= defaultFaceEnrollmentPolicy.maximumActiveSamples
      ) {
        throw new FaceEnrollmentError("active_sample_limit");
      }
      if (input.demoOutcome !== "success") throw new FaceEnrollmentError(input.demoOutcome);

      const sample: FaceSample = {
        id: nextFaceSampleId(samples),
        employeeId: input.employeeId,
        active: true,
        enrolledAt: new Date().toISOString(),
        enrolledBy: input.actor,
        qualityScore: 0.92,
      };
      samples.push(sample);
      data.faceSamples = samples;
      synchronizeEmployeeFaceEnrollment(data);
      persist(data);
      return clone(sample);
    },

    async deactivateFaceSample(employeeId, faceSampleId): Promise<FaceSample> {
      const data = readData();
      if (!data.employees.some((employee) => employee.id === employeeId)) {
        throw new FaceEnrollmentError("employee_not_found");
      }
      const sample = data.faceSamples?.find(
        (item) => item.id === faceSampleId && item.employeeId === employeeId
      );
      if (!sample) throw new FaceEnrollmentError("face_sample_not_found");
      sample.active = false;
      synchronizeEmployeeFaceEnrollment(data);
      persist(data);
      return clone(sample);
    },

    async getSafetyScoreAudit(employeeId) {
      const data = readData();
      return {
        periods: clone(
          data.scorePeriods?.filter((period) => period.employeeId === employeeId) ?? []
        ),
        ledger: clone(
          data.safetyScoreLedger?.filter((entry) => entry.employeeId === employeeId) ?? []
        ),
        resetLogs: clone(
          data.safetyScoreResetLogs?.filter((log) => log.employeeId === employeeId) ?? []
        ),
      };
    },

    async resetSafetyScore(request) {
      const note = request.note?.trim();
      if (!safetyScoreResetReasons.includes(request.reason)) {
        throw new Error("Invalid Score Reset reason.");
      }
      if (request.reason === "Other" && !note) {
        throw new Error("A note is required for the Other reason.");
      }

      const data = readData();
      const employee = data.employees.find((item) => item.id === request.employeeId);
      if (!employee) throw new Error("Employee was not found.");

      const timestamp = new Date().toISOString();
      const scoreBefore = employee.safetyScore;
      const scoreAfter =
        data.safetySettings?.initialScore ?? defaultSafetySettings.initialScore;
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

    async getSafetySettings(): Promise<SafetySettings> {
      if (scenario === "loading") return new Promise<SafetySettings>(() => undefined);
      if (scenario === "error") throw new Error("Safety Parameters could not be loaded.");
      return clone(readData().safetySettings ?? defaultSafetySettings);
    },

    async updateSafetySettings(settings): Promise<SafetySettings> {
      if (scenario === "error") throw new Error("Safety Parameters could not be saved.");

      const data = readData();
      const nextSettings = normalizeSafetySettings(settings);
      data.safetySettings = nextSettings;
      data.escalationThreshold = nextSettings.escalationThreshold;
      persist(data);
      return clone(nextSettings);
    },

    async getCanonicalPpeClassConfiguration(): Promise<CanonicalPpeClassConfiguration> {
      if (scenario === "loading") {
        return new Promise<CanonicalPpeClassConfiguration>(() => undefined);
      }
      if (scenario === "error") {
        throw new Error("Canonical PPE Class configuration could not be loaded.");
      }
      return clone(
        readData().canonicalPpeClassConfiguration ?? defaultCanonicalPpeClassConfiguration
      );
    },

    async updateCanonicalPpeClassConfiguration(configuration): Promise<CanonicalPpeClassConfiguration> {
      if (scenario === "error") {
        throw new Error("Canonical PPE Class configuration could not be saved.");
      }

      const duplicateIndex = configuration.mappings.find((mapping, index) =>
        configuration.mappings.some(
          (candidate, candidateIndex) =>
            candidateIndex !== index && candidate.yoloIndex === mapping.yoloIndex
        )
      );
      if (duplicateIndex) {
        throw new Error(`YOLO index ${duplicateIndex.yoloIndex} is already in use.`);
      }

      const data = readData();
      data.canonicalPpeClassConfiguration =
        normalizeCanonicalPpeClassConfiguration(configuration);
      persist(data);
      return clone(data.canonicalPpeClassConfiguration);
    },

    async getNotificationRecipients(): Promise<NotificationRecipient[]> {
      if (scenario === "loading") return new Promise<NotificationRecipient[]>(() => undefined);
      if (scenario === "error") throw new Error("Notification configuration could not be loaded.");
      return clone(readData().notificationRecipients ?? []);
    },

    async saveNotificationRecipient(input): Promise<NotificationRecipient> {
      if (scenario === "error") throw new Error("Notification recipient could not be saved.");
      const name = input.name.trim();
      const scope = input.scope;
      if (!name) throw new Error("Recipient name is required.");
      if (input.role === "Human Resources (HR)" && scope.type !== "global") {
        throw new Error("A Human Resources (HR) recipient must use global scope.");
      }
      if (input.role === "Area Supervisor" && scope.type === "global") {
        throw new Error(
          "An Area Supervisor must be assigned to a Hazardous Zone or department."
        );
      }

      const data = readData();
      if (
        scope.type === "zone" &&
        !data.hazardousZones?.some((zone) => zone.id === scope.zoneId)
      ) {
        throw new Error("Hazardous Zone was not found.");
      }
      if (
        scope.type === "department" &&
        !data.departments.includes(scope.departmentId)
      ) {
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

    async deleteNotificationRecipient(id): Promise<void> {
      if (scenario === "error") throw new Error("Notification recipient could not be deleted.");
      const data = readData();
      const recipient = data.notificationRecipients?.find((item) => item.id === id);
      if (!recipient) throw new Error("Notification recipient was not found.");
      data.notificationRecipients = data.notificationRecipients?.filter(
        (item) => item.id !== id
      );
      persist(data);
    },

    async getNotificationSimulationLogs(): Promise<NotificationSimulationLog[]> {
      if (scenario === "loading") {
        return new Promise<NotificationSimulationLog[]>(() => undefined);
      }
      if (scenario === "error") {
        throw new Error("Notification simulation log could not be loaded.");
      }
      return clone(readData().notificationLogs ?? []);
    },

    async simulateNotification(recipientId, deliveryStatus): Promise<NotificationSimulationLog> {
      if (scenario === "error") throw new Error("Notification simulation could not run.");
      const data = readData();
      const recipient = data.notificationRecipients?.find((item) => item.id === recipientId);
      if (!recipient) throw new Error("Notification recipient was not found.");
      const violationId = data.violations[0]?.id;
      if (!violationId) throw new Error("No Violation Event is available for simulation.");
      const log = appendNotificationSimulationLog(
        data,
        recipient,
        deliveryStatus,
        violationId,
        "2026-09-09T10:15:00+07:00"
      );
      persist(data);
      return clone(log);
    },

    async getMonitoringSimulation(): Promise<MonitoringSimulation> {
      if (scenario === "error") {
        throw new Error("Simulator Violation Episode tidak dapat dimuat.");
      }
      return clone(readData().monitoringSimulation ?? createMonitoringSimulation("normal"));
    },

    async selectMonitoringScenario(nextScenario): Promise<MonitoringSimulation> {
      const data = readData();
      const episodeNumber =
        data.violations.filter((violation) => violation.episodeId?.startsWith("EPS-SIM-"))
          .length + 1;
      const simulation = createMonitoringSimulation(nextScenario, episodeNumber);
      data.monitoringSimulation = simulation;
      persist(data);
      return clone(simulation);
    },

    async processMonitoringFrame(frame): Promise<MonitoringSimulation> {
      const data = readData();
      const simulation =
        data.monitoringSimulation ?? createMonitoringSimulation("normal");
      simulation.confidence = frame.confidence;
      const minimumConfidence =
        data.safetySettings?.minimumConfidence ??
        defaultSafetySettings.minimumConfidence;
      if (frame.confidence < minimumConfidence || simulation.state !== "episode") {
        data.monitoringSimulation = simulation;
        persist(data);
        return clone(simulation);
      }

      if (simulation.episodeStatus === "candidate") {
        if (frame.isCompliant) simulation.state = "normal";
        else {
          simulation.confirmationElapsedSeconds += frame.elapsedSeconds;
          if (
            simulation.confirmationElapsedSeconds >=
            (data.safetySettings?.confirmThresholdSeconds ??
              defaultSafetySettings.confirmThresholdSeconds)
          ) {
            simulation.episodeStatus = "confirmed";
            confirmMonitoringSimulation(data, simulation);
          }
        }
      } else if (simulation.episodeStatus === "confirmed") {
        if (frame.isCompliant) {
          simulation.episodeStatus = "clearing";
          simulation.clearingElapsedSeconds = 0;
          const event = data.violations.find(
            (violation) => violation.id === simulation.eventId
          );
          if (event) {
            event.status = "clearing";
            event.updatedAt = "2026-09-09T10:00:01+07:00";
            event.timeline?.push({
              status: "clearing",
              occurredAt: event.updatedAt,
              description: "Violation Episode entered Clearing.",
            });
          }
        }
      } else if (simulation.episodeStatus === "clearing") {
        if (!frame.isCompliant) {
          simulation.episodeStatus = "confirmed";
          const event = data.violations.find(
            (violation) => violation.id === simulation.eventId
          );
          if (event) {
            event.status = "confirmed";
            event.updatedAt = "2026-09-09T10:00:02+07:00";
            event.timeline?.push({
              status: "confirmed",
              occurredAt: event.updatedAt,
              description:
                "PPE became non-compliant again; the Violation Episode returned to Violation.",
            });
          }
        } else {
          simulation.clearingElapsedSeconds += frame.elapsedSeconds;
          if (
            simulation.clearingElapsedSeconds >=
            (data.safetySettings?.clearThresholdSeconds ??
              defaultSafetySettings.clearThresholdSeconds)
          ) {
            simulation.episodeStatus = "cleared";
            const event = data.violations.find(
              (violation) => violation.id === simulation.eventId
            );
            if (event) {
              event.status = "cleared";
              event.updatedAt = "2026-09-09T10:00:03+07:00";
              event.timeline?.push({
                status: "cleared",
                occurredAt: event.updatedAt,
                description: "Violation Episode Cleared.",
              });
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
