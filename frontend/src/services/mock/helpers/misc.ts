import type {
  DemoData,
  Employee,
  EmployeeScope,
  FaceSample,
  HazardousZone,
  HazardousZoneWithViolationHistory,
  NotificationRecipient,
  OverviewData,
} from "../../../types";
import { clone } from "./clone";

export function maskChatId(chatId: string): string {
  const normalized = chatId.replace(/\s/g, "");
  if (normalized.length < 4) {
    throw new Error("Telegram Chat ID must contain at least 4 characters.");
  }
  return `•••• ${normalized.slice(-4)}`;
}

export function nextFaceSampleId(samples: FaceSample[]): string {
  return `FSC-${String(samples.length + 1).padStart(4, "0")}`;
}

export function nextEmployeeId(employees: Employee[]): string {
  return `employee-${employees.length + 1}`;
}

export function normalizedEmployeeCode(employeeCode: string): string {
  return employeeCode.trim().toUpperCase();
}

export function nextNotificationRecipientId(recipients: NotificationRecipient[]): string {
  const highestSequence = recipients.reduce((highest, recipient) => {
    const sequence = Number(recipient.id.replace("REC-", ""));
    return Number.isInteger(sequence) ? Math.max(highest, sequence) : highest;
  }, 0);
  return `REC-${String(highestSequence + 1).padStart(2, "0")}`;
}

export function employeeMatchesScope(employee: Employee, scope: EmployeeScope): boolean {
  return (
    typeof scope !== "object" ||
    (employee.supervisorArea ?? employee.departmentId) === scope.area
  );
}

export function calculateOverview(data: DemoData): OverviewData {
  const escalationThreshold =
    data.safetySettings?.escalationThreshold ?? data.escalationThreshold;
  return {
    activeCameras: data.cameras.filter((camera) => camera.status === "online").length,
    totalCameras: data.cameras.length,
    activeViolations: data.violations.filter((violation) => violation.status === "confirmed")
      .length,
    ppeCompliance:
      data.compliance.totalObservations === 0
        ? 0
        : Math.round(
            (data.compliance.compliantObservations / data.compliance.totalObservations) * 100
          ),
    employeesBelowEscalationThreshold: data.employees.filter(
      (employee) => employee.safetyScore < escalationThreshold
    ).length,
  };
}

export function withViolationHistory(
  data: DemoData,
  zone: HazardousZone
): HazardousZoneWithViolationHistory {
  return {
    ...clone(zone),
    hasViolationHistory: data.violations.some((violation) => violation.zoneId === zone.id),
  };
}
