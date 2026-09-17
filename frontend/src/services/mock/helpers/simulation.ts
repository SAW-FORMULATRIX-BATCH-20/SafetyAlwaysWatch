import type {
  DemoData,
  MonitoringScenario,
  MonitoringSimulation,
  NotificationRecipient,
  NotificationSimulationLog,
  ViolationRecord,
} from "../../../types";
import { clone } from "./clone";

export function createMonitoringSimulation(
  scenario: MonitoringScenario,
  episodeNumber = 1
): MonitoringSimulation {
  const episodeId = `EPS-SIM-${String(episodeNumber).padStart(2, "0")}`;
  switch (scenario) {
    case "missing-ppe":
      return {
        scenario,
        cameraId: "CAM-01",
        state: "episode",
        episodeId,
        episodeStatus: "candidate",
        confidence: 0.96,
        identity: "employee",
        employeeId: "EMP-01",
        identityLabel: "Employee Production 01",
        missingCanonicalPpeClasses: ["Safety Vest"],
        confirmationElapsedSeconds: 0,
        clearingElapsedSeconds: 0,
      };
    case "unidentified":
      return {
        scenario,
        cameraId: "CAM-01",
        state: "episode",
        episodeId,
        episodeStatus: "candidate",
        confidence: 0.96,
        identity: "unidentified",
        identityLabel: "Unknown",
        missingCanonicalPpeClasses: ["Safety Vest"],
        confirmationElapsedSeconds: 0,
        clearingElapsedSeconds: 0,
      };
    case "camera-offline":
      return {
        scenario,
        cameraId: "CAM-02",
        state: "offline",
        episodeStatus: "cleared",
        confidence: 0,
        identity: "unidentified",
        identityLabel: "Unknown",
        missingCanonicalPpeClasses: [],
        confirmationElapsedSeconds: 0,
        clearingElapsedSeconds: 0,
      };
    case "score-escalation":
      return {
        scenario,
        cameraId: "CAM-01",
        state: "episode",
        episodeId,
        episodeStatus: "candidate",
        confidence: 0.96,
        identity: "employee",
        employeeId: "EMP-12",
        identityLabel: "Employee Maintenance 04",
        missingCanonicalPpeClasses: ["Safety Helmet"],
        confirmationElapsedSeconds: 0,
        clearingElapsedSeconds: 0,
      };
    default:
      return {
        scenario,
        cameraId: "CAM-01",
        state: "normal",
        episodeStatus: "cleared",
        confidence: 0.96,
        identity: "employee",
        employeeId: "EMP-01",
        identityLabel: "Employee Production 01",
        missingCanonicalPpeClasses: [],
        confirmationElapsedSeconds: 0,
        clearingElapsedSeconds: 0,
      };
  }
}

export function deductionFor(data: DemoData, canonicalPpeClasses: string[]): number {
  return canonicalPpeClasses.reduce((total, ppeClass) => {
    return (
      total +
      (data.safetySettings?.deductions.find((item) => item.canonicalPpeClass === ppeClass)
        ?.points ?? 0)
    );
  }, 0);
}

export function appendNotificationSimulationLog(
  data: DemoData,
  recipient: NotificationRecipient,
  deliveryStatus: "sent" | "failed",
  violationId: string,
  occurredAt: string
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
      ...(violation.notificationRecipients ?? []).filter(
        (item) => item.name !== recipient.name || item.role !== recipient.role
      ),
      { name: recipient.name, role: recipient.role, deliveryStatus },
    ];
  }
  return log;
}

export function confirmMonitoringSimulation(
  data: DemoData,
  simulation: MonitoringSimulation
): void {
  if (simulation.eventId) return;

  const sequence =
    data.violations.filter((violation) => violation.id.startsWith("VIO-SIM-")).length + 1;
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
      {
        status: "candidate",
        occurredAt: "2026-09-09T09:59:55+07:00",
        description: "Missing PPE signal entered verification.",
      },
      {
        status: "confirmed",
        occurredAt: "2026-09-09T10:00:00+07:00",
        description: "Violation Event recorded.",
      },
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
  simulation.scoreChange = {
    before,
    after,
    crossedEscalationThreshold:
      before >= data.escalationThreshold && after < data.escalationThreshold,
  };
  violation.scoreChange = { before, after };
  if (simulation.scoreChange.crossedEscalationThreshold) {
    const recipients =
      data.notificationRecipients?.filter((recipient) => {
        if (recipient.role === "Human Resources (HR)")
          return recipient.scope.type === "global";
        return (
          (recipient.scope.type === "zone" && recipient.scope.zoneId === violation.zoneId) ||
          (recipient.scope.type === "department" &&
            recipient.scope.departmentId === employee.departmentId)
        );
      }) ?? [];
    recipients.forEach((recipient) =>
      appendNotificationSimulationLog(
        data,
        recipient,
        "sent",
        violation.id,
        violation.detectedAt ?? "2026-09-09T10:00:00+07:00"
      )
    );
  }
}
