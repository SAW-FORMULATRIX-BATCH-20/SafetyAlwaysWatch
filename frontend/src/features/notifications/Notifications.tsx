import { useEffect, useState } from "react";

import type { Persona } from "../../application/personas";
import { Button } from "../../components/ui/button";
import type {
  EmployeeDirectoryData,
  HazardousZone,
  NotificationRecipient,
  NotificationRecipientRole,
  NotificationRecipientScope,
  NotificationSimulationLog,
} from "../../services/saw-service";
import { formatWib } from "../../shared/formatters";

type NotificationsService = {
  getEmployeeDirectory(): Promise<EmployeeDirectoryData>;
  getHazardousZone(): Promise<HazardousZone[]>;
  getNotificationRecipients(): Promise<NotificationRecipient[]>;
  getNotificationSimulationLogs(): Promise<NotificationSimulationLog[]>;
  saveNotificationRecipient(input: {
    name: string;
    chatId: string;
    role: NotificationRecipientRole;
    scope: NotificationRecipientScope;
  }): Promise<NotificationRecipient>;
  deleteNotificationRecipient(id: string): Promise<void>;
  simulateNotification(
    id: string,
    status: "sent" | "failed",
  ): Promise<NotificationSimulationLog>;
};
function scopeLabel(recipient: NotificationRecipient, zones: HazardousZone[]) {
  const scope = recipient.scope;
  if (scope.type === "global") return "Global";
  if (scope.type === "zone") {
    const zoneName =
      zones.find((zone) => zone.id === scope.zoneId)?.name ?? scope.zoneId;
    return `Hazardous Zone: ${zoneName}`;
  }
  return `Department: ${scope.departmentId}`;
}

export function Notifications({
  persona,
  service,
}: {
  persona: Persona;
  service: NotificationsService;
}) {
  const [recipients, setRecipients] = useState<NotificationRecipient[]>();
  const [logs, setLogs] = useState<NotificationSimulationLog[]>();
  const [zones, setZones] = useState<HazardousZone[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [chatId, setChatId] = useState("");
  const [role, setRole] = useState<NotificationRecipientRole>(
    "Human Resources (HR)",
  );
  const [scopeType, setScopeType] =
    useState<NotificationRecipientScope["type"]>("global");
  const [scopeTarget, setScopeTarget] = useState("");
  const load = () => {
    Promise.all([
      service.getNotificationRecipients(),
      service.getNotificationSimulationLogs(),
      service.getHazardousZone(),
      service.getEmployeeDirectory(),
    ])
      .then(([nextRecipients, nextLogs, nextZones, directory]) => {
        setRecipients(nextRecipients);
        setLogs(nextLogs);
        setZones(nextZones);
        setDepartments(
          [
            ...new Set(
              directory.employees.map((employee) => employee.departmentId),
            ),
          ].sort(),
        );
      })
      .catch((value: unknown) =>
        setError(
          value instanceof Error
            ? value.message
            : "Notifications could not be loaded.",
        ),
      );
  };
  useEffect(load, [service]);
  const buildNotificationRecipientScope = (): NotificationRecipientScope =>
    scopeType === "global"
      ? { type: "global" }
      : scopeType === "zone"
        ? { type: "zone", zoneId: scopeTarget }
        : { type: "department", departmentId: scopeTarget };
  const save = async () => {
    try {
      await service.saveNotificationRecipient({
        name,
        chatId,
        role,
        scope: buildNotificationRecipientScope(),
      });
      setAdding(false);
      setName("");
      setChatId("");
      setScopeTarget("");
      setNotice("Notification recipient saved. Chat ID is masked.");
      load();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Notification recipient could not be saved.",
      );
    }
  };
  const simulate = async (
    recipient: NotificationRecipient,
    status: "sent" | "failed",
  ) => {
    try {
      await service.simulateNotification(recipient.id, status);
      setNotice(`Simulation ${status} recorded for ${recipient.name}.`);
      load();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Notification simulation could not run.",
      );
    }
  };
  const removeRecipient = async (recipient: NotificationRecipient) => {
    setError(undefined);
    setNotice(undefined);
    try {
      await service.deleteNotificationRecipient(recipient.id);
      setNotice(`Notification recipient deleted: ${recipient.name}.`);
      load();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Notification recipient could not be deleted.",
      );
    }
  };
  if (!recipients || !logs)
    return (
      <section aria-busy="true">
        <h1>Notifications</h1>
        <p>{error ?? "Loading notification simulation…"}</p>
      </section>
    );
  const isAdmin = persona.role === "admin";
  return (
    <section>
      <p>Safe simulation</p>
      <h1>Notifications</h1>
      <p>
        Manage recipient mappings and inspect simulated delivery results. Raw
        Chat IDs, bot tokens, and real messages are not stored or displayed.
      </p>
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert">{error}</p>}
      {isAdmin && (
        <section>
          <h2>Simulation recipients</h2>
          <p>
            Human Resources (HR) uses global scope. An Area Supervisor must be
            assigned to a Hazardous Zone or department.
          </p>
          <Button onClick={() => setAdding(true)}>Add recipient</Button>
          {adding && (
            <div>
              <label>
                Recipient name
                <input
                  aria-label="Recipient name"
                  onChange={(event) => setName(event.target.value)}
                  value={name}
                />
              </label>
              <label>
                Chat ID
                <input
                  aria-label="Chat ID"
                  onChange={(event) => setChatId(event.target.value)}
                  value={chatId}
                />
              </label>
              <label>
                Recipient role
                <select
                  aria-label="Recipient role"
                  onChange={(event) => {
                    const value = event.target
                      .value as NotificationRecipientRole;
                    setRole(value);
                    setScopeType(
                      value === "Human Resources (HR)" ? "global" : "zone",
                    );
                    setScopeTarget("");
                  }}
                  value={role}
                >
                  <option value="Human Resources (HR)">
                    Human Resources (HR)
                  </option>
                  <option value="Area Supervisor">Area Supervisor</option>
                </select>
              </label>
              <label>
                Recipient scope
                <select
                  aria-label="Recipient scope"
                  disabled={role === "Human Resources (HR)"}
                  onChange={(event) => {
                    setScopeType(
                      event.target.value as NotificationRecipientScope["type"],
                    );
                    setScopeTarget("");
                  }}
                  value={scopeType}
                >
                  <option value="global">Global</option>
                  <option value="zone">Hazardous Zone</option>
                  <option value="department">Department</option>
                </select>
              </label>
              {scopeType === "zone" && (
                <label>
                  Target Hazardous Zone
                  <select
                    aria-label="Target Hazardous Zone"
                    onChange={(event) => setScopeTarget(event.target.value)}
                    value={scopeTarget}
                  >
                    <option value="">Select Hazardous Zone</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {scopeType === "department" && (
                <label>
                  Target department
                  <select
                    aria-label="Target department"
                    onChange={(event) => setScopeTarget(event.target.value)}
                    value={scopeTarget}
                  >
                    <option value="">Select department</option>
                    {departments.map((department) => (
                      <option key={department}>{department}</option>
                    ))}
                  </select>
                </label>
              )}
              <Button onClick={() => setAdding(false)} variant="outline">
                Cancel
              </Button>
              <Button
                disabled={
                  !name.trim() ||
                  !chatId.trim() ||
                  (scopeType !== "global" && !scopeTarget)
                }
                onClick={() => void save()}
              >
                Save recipient
              </Button>
            </div>
          )}
          <div role="list">
            {recipients.map((recipient) => (
              <article
                aria-label={recipient.name}
                key={recipient.id}
                role="listitem"
              >
                <h3>{recipient.name}</h3>
                <p>
                  {recipient.role} · {scopeLabel(recipient, zones)}
                </p>
                <p>Chat ID: {recipient.maskedChatId}</p>
                <Button onClick={() => void simulate(recipient, "sent")}>
                  Simulate sent
                </Button>
                <Button onClick={() => void simulate(recipient, "failed")}>
                  Simulate failed
                </Button>
                <Button
                  onClick={() => void removeRecipient(recipient)}
                  variant="outline"
                >
                  Delete recipient
                </Button>
              </article>
            ))}
          </div>
        </section>
      )}
      <section>
        <h2>Notification simulation log</h2>
        {logs.length === 0 ? (
          <p>No notification simulation log.</p>
        ) : (
          [...logs].reverse().map((log) => (
            <article key={log.id}>
              <p>{log.recipientName}</p>
              <p>
                {log.recipientRole} · Violation Event {log.violationId}
              </p>
              <p>{formatWib(log.occurredAt)}</p>
              <p>
                {log.deliveryStatus === "sent" ? "Sent" : "Failed"} · SIMULATION
              </p>
            </article>
          ))
        )}
      </section>
    </section>
  );
}
