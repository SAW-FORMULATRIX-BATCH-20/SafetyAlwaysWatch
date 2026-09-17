import type {
  Camera,
  CameraMetadata,
  CameraScope,
  CanonicalPpeClassConfiguration,
  ComplianceReportData,
  Employee,
  EmployeeDirectoryData,
  EmployeeRegistrationInput,
  EmployeeScope,
  FaceEnrollmentInput,
  FaceEnrollmentPolicy,
  FaceSample,
  HazardousZoneInput,
  HazardousZoneWithViolationHistory,
  MonitoringFrame,
  MonitoringScenario,
  MonitoringSimulation,
  NotificationRecipient,
  NotificationRecipientInput,
  NotificationSimulationLog,
  OverviewData,
  SafetyScoreAudit,
  SafetyScoreResetRequest,
  SafetyScoreResetResult,
  SafetySettings,
  ViolationRecord,
} from "../../types";

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
  getEmployee(employeeId: string, scope?: EmployeeScope): Promise<Employee>;
  createEmployee(input: EmployeeRegistrationInput): Promise<Employee>;
}

export interface FaceEnrollmentCapability {
  getFaceEnrollmentPolicy(): Promise<FaceEnrollmentPolicy>;
  getFaceSamples(employeeId: string): Promise<FaceSample[]>;
  enrollFaceSample(input: FaceEnrollmentInput): Promise<FaceSample>;
  deactivateFaceSample(employeeId: string, faceSampleId: string): Promise<FaceSample>;
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
  updateCanonicalPpeClassConfiguration(
    configuration: CanonicalPpeClassConfiguration
  ): Promise<CanonicalPpeClassConfiguration>;
}

export interface NotificationCapability {
  getNotificationRecipients(): Promise<NotificationRecipient[]>;
  saveNotificationRecipient(input: NotificationRecipientInput): Promise<NotificationRecipient>;
  deleteNotificationRecipient(id: string): Promise<void>;
  getNotificationSimulationLogs(): Promise<NotificationSimulationLog[]>;
  simulateNotification(
    recipientId: string,
    deliveryStatus: "sent" | "failed"
  ): Promise<NotificationSimulationLog>;
}

export interface MonitoringCapability {
  getMonitoringSimulation(): Promise<MonitoringSimulation>;
  selectMonitoringScenario(scenario: MonitoringScenario): Promise<MonitoringSimulation>;
  processMonitoringFrame(frame: MonitoringFrame): Promise<MonitoringSimulation>;
}

/** The router composes every capability; feature screens receive only what they use. */
export type SawApplicationCapabilities = OverviewCapability &
  ComplianceReportingCapability &
  CameraSourceCapability &
  HazardousZoneCapability &
  ViolationHistoryCapability &
  EmployeeDirectoryCapability &
  FaceEnrollmentCapability &
  SafetyScoreCapability &
  SafetySettingsCapability &
  CanonicalPpeClassCapability &
  NotificationCapability &
  MonitoringCapability;
