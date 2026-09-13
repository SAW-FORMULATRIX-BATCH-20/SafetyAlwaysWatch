import { useEffect, useState } from "react";

import { Button } from "../../components/ui/button";
import { AccessibleDialog } from "../../shared/AccessibleDialog";
import { formatWib } from "../../shared/formatters";
import {
  safetyScoreResetReasonLabels,
  safetyScoreResetReasons,
  type Employee,
  type EmployeeDirectoryData,
  type SafetyScoreAudit,
  type SafetyScoreResetReason,
  type SafetyScoreResetResult,
  type SafetySettings,
} from "../../services/saw-service";

type ScoreResetService = {
  getEmployeeDirectory(): Promise<EmployeeDirectoryData>;
  getSafetySettings(): Promise<SafetySettings>;
  getSafetyScoreAudit(employeeId: string): Promise<SafetyScoreAudit>;
  resetSafetyScore(request: {
    employeeId: string;
    reason: SafetyScoreResetReason;
    note?: string;
    actor: string;
  }): Promise<SafetyScoreResetResult>;
};
const employeeName = (employee: Employee) =>
  employee.name ?? `Employee ${employee.id}`;

export function ScoreReset({ service }: { service: ScoreResetService }) {
  const [directory, setDirectory] = useState<EmployeeDirectoryData>();
  const [settings, setSettings] = useState<SafetySettings>();
  const [employeeId, setEmployeeId] = useState("");
  const [reason, setReason] = useState<SafetyScoreResetReason | "">("");
  const [note, setNote] = useState("");
  const [audit, setAudit] = useState<SafetyScoreAudit>();
  const [result, setResult] = useState<SafetyScoreResetResult>();
  const [error, setError] = useState<string>();
  const [step, setStep] = useState<"form" | "review" | "confirm">("form");
  useEffect(() => {
    let active = true;
    Promise.all([service.getEmployeeDirectory(), service.getSafetySettings()])
      .then(([nextDirectory, nextSettings]) => {
        if (active) {
          setDirectory(nextDirectory);
          setSettings(nextSettings);
        }
      })
      .catch((value: unknown) => {
        if (active)
          setError(
            value instanceof Error
              ? value.message
              : "Score Reset could not be loaded.",
          );
      });
    return () => {
      active = false;
    };
  }, [service]);
  useEffect(() => {
    let active = true;
    if (!employeeId) return undefined;
    service
      .getSafetyScoreAudit(employeeId)
      .then((value) => {
        if (active) setAudit(value);
      })
      .catch((value: unknown) => {
        if (active)
          setError(
            value instanceof Error
              ? value.message
              : "Score Reset audit could not be loaded.",
          );
      });
    return () => {
      active = false;
    };
  }, [employeeId, service]);
  const employee = directory?.employees.find((item) => item.id === employeeId);
  const review = () => {
    if (!employee) return setError("Select an Employee to reset.");
    if (!reason) return setError("Select a Score Reset reason.");
    if (reason === "Other" && !note.trim())
      return setError("A note is required for the Other reason.");
    setError(undefined);
    setStep("review");
  };
  const confirm = async () => {
    if (!employee || !reason) return;
    try {
      const next = await service.resetSafetyScore({
        employeeId: employee.id,
        reason,
        ...(note.trim() && { note: note.trim() }),
        actor: "Admin/Safety Officer",
      });
      setResult(next);
      setAudit(await service.getSafetyScoreAudit(employee.id));
      setDirectory(
        (current) =>
          current && {
            ...current,
            employees: current.employees.map((item) =>
              item.id === employee.id ? next.employee : item,
            ),
          },
      );
      setStep("form");
      setReason("");
      setNote("");
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Score Reset could not be saved.",
      );
      setStep("form");
    }
  };
  if (!directory || !settings)
    return (
      <section aria-busy="true">
        <h1>Score Reset</h1>
        <p>{error ?? "Loading Score Reset…"}</p>
      </section>
    );
  return (
    <section>
      <p>Safety administration</p>
      <h1>Score Reset</h1>
      <p>
        Close a Score Period and restore an Employee Safety Score to its
        configured initial value with an audit record.
      </p>
      <label>
        Employee to reset
        <select
          aria-label="Employee to reset"
          onChange={(event) => {
            setEmployeeId(event.target.value);
            setAudit(undefined);
            setResult(undefined);
          }}
          value={employeeId}
        >
          <option value="">Select Employee</option>
          {directory.employees.map((item) => (
            <option key={item.id} value={item.id}>
              {employeeName(item)} · {item.id}
            </option>
          ))}
        </select>
      </label>
      <label>
        Score Reset reason
        <select
          aria-label="Score Reset reason"
          onChange={(event) =>
            setReason(event.target.value as SafetyScoreResetReason | "")
          }
          value={reason}
        >
          <option value="">Select reason</option>
          {safetyScoreResetReasons.map((item) => (
            <option key={item} value={item}>
              {safetyScoreResetReasonLabels[item]}
            </option>
          ))}
        </select>
      </label>
      {reason === "Other" && (
        <label>
          Reason note
          <input
            aria-label="Reason note"
            onChange={(event) => setNote(event.target.value)}
            value={note}
          />
        </label>
      )}
      <p>The restored Safety Score will be {settings.initialScore}.</p>
      {error && <p role="alert">{error}</p>}
      {result && <p role="status">Score Reset saved.</p>}
      <Button onClick={review}>Review Score Reset</Button>
      {audit && (
        <section aria-label="Score Reset audit">
          <h2>Score Period summary</h2>
          {audit.periods.map((period) => (
            <article key={period.id}>
              <p>Score Period: {period.id}</p>
              <p>Started: {formatWib(period.startedAt)}</p>
              <p>Closed: {formatWib(period.closedAt)}</p>
              <p>
                Configured Initial Safety Score: {settings.initialScore}
              </p>
              <p>
                Final Safety Score before Score Reset: {period.finalScoreBeforeReset}
              </p>
              <p>Total Violations: {period.totalViolations}</p>
            </article>
          ))}
          <h2>Safety Score ledger</h2>
          {audit.ledger.map((entry) => (
            <article key={entry.id}>
              <p>Safety Score: {entry.scoreBefore} → {entry.scoreAfter}</p>
              <p>Recorded: {formatWib(entry.recordedAt)}</p>
            </article>
          ))}
          <h2>Score Reset log</h2>
          {audit.resetLogs.map((log) => (
            <article key={log.id}>
              <p>Trigger: {log.trigger}</p>
              <p>Reason: {safetyScoreResetReasonLabels[log.reason]}</p>
              <p>Actor: {log.actor}</p>
              <p>Note: {log.note ?? "No note"}</p>
              <p>Recorded: {formatWib(log.occurredAt)}</p>
            </article>
          ))}
        </section>
      )}
      {step === "review" && employee && reason && (
        <AccessibleDialog
          label="Review Score Reset"
          onDismiss={() => setStep("form")}
        >
          <div>
            <h2>Review Score Reset</h2>
            <p>{employeeName(employee)}</p>
            <p>
              {employee.safetyScore} → {settings.initialScore}
            </p>
            <p>{safetyScoreResetReasonLabels[reason]}</p>
            <Button onClick={() => setStep("form")} variant="outline">
              Back
            </Button>
            <Button onClick={() => setStep("confirm")}>
              Continue to confirmation
            </Button>
          </div>
        </AccessibleDialog>
      )}
      {step === "confirm" && (
        <AccessibleDialog
          label="Confirm Score Reset"
          onDismiss={() => setStep("form")}
        >
          <div>
            <h2>Confirm Score Reset</h2>
            <p>This closes the Score Period and records the audit result.</p>
            <Button onClick={() => setStep("form")} variant="outline">
              Cancel
            </Button>
            <Button onClick={() => void confirm()}>Confirm Score Reset</Button>
          </div>
        </AccessibleDialog>
      )}
    </section>
  );
}
