import { useEffect, useRef } from "react";
import { animate } from "animejs";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  History,
  Info,
  RotateCcw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";

import { Button } from "../../components/ui/button";
import {
  useResetSafetyScoreMutation,
  useScoreResetAuditQuery,
  useScoreResetQuery,
  type ScoreResetService,
} from "../../hooks/queries/useScoreResetQuery";
import { cn } from "../../lib/utils";
import { EnsureQueryClient } from "../../providers/EnsureQueryClient";
import {
  safetyScoreResetReasonLabels,
  safetyScoreResetReasons,
  type Employee,
  type SafetyScoreResetReason,
} from "../../services/saw-service";
import { AccessibleDialog } from "../../shared/AccessibleDialog";
import { formatWib } from "../../shared/formatters";
import { useScoreResetStore } from "../../stores/useScoreResetStore";

export type { ScoreResetService };

const employeeName = (employee: Employee) =>
  employee.name ?? `Employee ${employee.id}`;

function ErrorToast({
  error,
  onDismiss,
}: {
  error: string;
  onDismiss: () => void;
}) {
  const toastRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let toastAnim: ReturnType<typeof animate> | undefined;
    let iconAnim: ReturnType<typeof animate> | undefined;
    if (!reducedMotion && toastRef.current) {
      toastAnim = animate(toastRef.current, {
        translateY: [24, 0],
        opacity: [0, 1],
        scale: [0.94, 1],
        duration: 360,
        ease: "outQuad",
      });
      if (iconRef.current) {
        iconAnim = animate(iconRef.current, {
          scale: [0.65, 1],
          duration: 340,
          ease: "outBack(1.5)",
        });
      }
    }

    let progressAnim: ReturnType<typeof animate> | undefined;
    if (progressRef.current) {
      progressAnim = animate(progressRef.current, {
        width: ["100%", "0%"],
        duration: 4000,
        ease: "linear",
      });
    }

    return () => {
      toastAnim?.pause();
      iconAnim?.pause();
      progressAnim?.pause();
    };
  }, []);

  return (
    <div
      ref={toastRef}
      role="alert"
      className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto sm:max-w-md z-50 overflow-hidden rounded-2xl border border-red-200/90 bg-white shadow-2xl ring-1 ring-red-500/15"
    >
      <div className="flex items-start gap-3 p-4 text-slate-900">
        <div
          ref={iconRef}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 ring-1 ring-red-200/70"
        >
          <AlertCircle className="size-5" />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-red-900">
            Validation Error
          </h4>
          <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
            {error}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0"
          aria-label="Dismiss error"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Timeline Loading Progress Bar powered by anime.js */}
      <div className="h-1 w-full bg-red-100/70 overflow-hidden">
        <div
          ref={progressRef}
          className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-red-500"
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}

export function ScoreReset({ service }: { service?: ScoreResetService }) {
  return (
    <EnsureQueryClient>
      <ScoreResetContent service={service} />
    </EnsureQueryClient>
  );
}

function ScoreResetContent({ service }: { service?: ScoreResetService }) {
  const {
    directory,
    settings,
    isLoading,
    error: queryError,
  } = useScoreResetQuery({ service });

  const employeeId = useScoreResetStore((state) => state.employeeId);
  const setEmployeeId = useScoreResetStore((state) => state.setEmployeeId);
  const reason = useScoreResetStore((state) => state.reason);
  const setReason = useScoreResetStore((state) => state.setReason);
  const note = useScoreResetStore((state) => state.note);
  const setNote = useScoreResetStore((state) => state.setNote);
  const step = useScoreResetStore((state) => state.step);
  const setStep = useScoreResetStore((state) => state.setStep);
  const error = useScoreResetStore((state) => state.error);
  const setError = useScoreResetStore((state) => state.setError);
  const result = useScoreResetStore((state) => state.result);
  const setResult = useScoreResetStore((state) => state.setResult);
  const resetForm = useScoreResetStore((state) => state.resetForm);
  const employeeSearch = useScoreResetStore((state) => state.employeeSearch);
  const setEmployeeSearch = useScoreResetStore((state) => state.setEmployeeSearch);
  const employeeFilter = useScoreResetStore((state) => state.employeeFilter);
  const setEmployeeFilter = useScoreResetStore((state) => state.setEmployeeFilter);

  useEffect(() => {
    return () => {
      useScoreResetStore.getState().reset();
    };
  }, []);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => {
      setError(undefined);
    }, 4000);
    return () => clearTimeout(timer);
  }, [error, setError]);

  const { audit } = useScoreResetAuditQuery({
    employeeId: employeeId || undefined,
    service,
  });

  const resetMutation = useResetSafetyScoreMutation({ service });

  const allEmployees = directory?.employees ?? [];
  const initialScore = settings?.initialScore ?? 100;
  const needsResetCount = allEmployees.filter(
    (e) => e.safetyScore < initialScore,
  ).length;
  const criticalCount = allEmployees.filter((e) => e.safetyScore < 75).length;

  const filteredEmployees = allEmployees.filter((item) => {
    const query = employeeSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      (item.name && item.name.toLowerCase().includes(query)) ||
      item.id.toLowerCase().includes(query) ||
      (item.departmentId && item.departmentId.toLowerCase().includes(query));

    const matchesFilter =
      employeeFilter === "all" ||
      (employeeFilter === "needs-reset" && item.safetyScore < initialScore) ||
      (employeeFilter === "critical" && item.safetyScore < 75);

    return (matchesSearch && matchesFilter) || item.id === employeeId;
  });

  const employee = allEmployees.find((item) => item.id === employeeId);

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
      const next = await resetMutation.mutateAsync({
        employeeId: employee.id,
        reason,
        ...(note.trim() && { note: note.trim() }),
        actor: "Admin/Safety Officer",
      });
      setResult(next);
      setStep("form");
      resetForm();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Score Reset could not be saved.",
      );
      setStep("form");
    }
  };

  if (queryError)
    return (
      <section aria-busy="true" className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 font-mono text-xs uppercase tracking-[0.16em] text-amber-800 font-semibold">
            <ShieldAlert className="size-3.5 text-amber-600" />
            Safety administration
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Score Reset
        </h1>
        <div className="rounded-2xl border border-red-200 bg-red-50/90 p-6 text-red-900 shadow-xs">
          <p className="text-sm font-medium">{queryError.message}</p>
        </div>
      </section>
    );

  if (isLoading || !directory || !settings)
    return (
      <section aria-busy="true" className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 font-mono text-xs uppercase tracking-[0.16em] text-amber-800 font-semibold">
            <ShieldAlert className="size-3.5 text-amber-600" />
            Safety administration
          </span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
          <p className="text-sm font-medium text-slate-600">Loading Score Reset…</p>
        </div>
      </section>
    );

  return (
    <section className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 font-mono text-xs uppercase tracking-[0.16em] text-amber-800 font-semibold">
            <ShieldAlert className="size-3.5 text-amber-600" />
            Safety administration
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Score Reset
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm text-slate-600 leading-relaxed">
          Close a Score Period and restore an Employee Safety Score to its
          configured initial value with an audit record.
        </p>
      </div>

      {/* Status Banner */}
      {result && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-900 shadow-xs animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Score Reset saved.</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                The score period for {employeeName(result.employee)} was closed and Safety Score restored to {result.employee.safetyScore}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setResult(undefined)}
            className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
            aria-label="Dismiss status"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Floating Error Pop-up Toast with Loading Timeline powered by anime.js */}
      {error && (
        <ErrorToast error={error} onDismiss={() => setError(undefined)} />
      )}

      {/* Main Grid: Form Card & Audit Panel */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Left Column: Form Card */}
        <section className="lg:col-span-5 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <RotateCcw className="size-5 text-amber-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Reset Parameters
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Select an employee and specify the justification for score restoration.
            </p>
          </div>

          <div className="space-y-4">
            {/* Employee Selector */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="score-reset-employee"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Employee to reset
                </label>
                <span className="text-[11px] font-mono text-slate-500">
                  {filteredEmployees.length} of {allEmployees.length} available
                </span>
              </div>

              {/* Segmented Filter Control */}
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100/90 p-1 border border-slate-200/70">
                <button
                  type="button"
                  onClick={() => setEmployeeFilter("all")}
                  className={cn(
                    "cursor-pointer flex h-7.5 items-center justify-center gap-1.5 rounded-md px-2 text-[11px] font-medium transition-all duration-150 select-none",
                    employeeFilter === "all"
                      ? "bg-white text-slate-900 shadow-2xs font-semibold ring-1 ring-slate-200/50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60",
                  )}
                >
                  <span>All</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-mono leading-none shrink-0",
                      employeeFilter === "all"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-slate-200/70 text-slate-500",
                    )}
                  >
                    {allEmployees.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setEmployeeFilter("needs-reset")}
                  className={cn(
                    "cursor-pointer flex h-7.5 items-center justify-center gap-1.5 rounded-md px-2 text-[11px] font-medium transition-all duration-150 select-none",
                    employeeFilter === "needs-reset"
                      ? "bg-white text-amber-950 shadow-2xs font-semibold ring-1 ring-amber-300/60"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60",
                  )}
                >
                  <span className="truncate">Needs Reset</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-mono font-bold leading-none shrink-0",
                      employeeFilter === "needs-reset"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-amber-100/70 text-amber-800",
                    )}
                  >
                    {needsResetCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setEmployeeFilter("critical")}
                  className={cn(
                    "cursor-pointer flex h-7.5 items-center justify-center gap-1.5 rounded-md px-2 text-[11px] font-medium transition-all duration-150 select-none",
                    employeeFilter === "critical"
                      ? "bg-white text-red-950 shadow-2xs font-semibold ring-1 ring-red-300/60"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60",
                  )}
                >
                  <span>Critical</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-mono font-bold leading-none shrink-0",
                      employeeFilter === "critical"
                        ? "bg-red-100 text-red-900"
                        : "bg-red-100/70 text-red-700",
                    )}
                  >
                    {criticalCount}
                  </span>
                </button>
              </div>

              {/* Instant Search Bar */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, ID (EMP-XX), or dept..."
                  aria-label="Filter employee list"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white pl-8.5 pr-8 py-1.5 text-xs text-slate-900 shadow-2xs placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                />
                {employeeSearch && (
                  <button
                    type="button"
                    onClick={() => setEmployeeSearch("")}
                    className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Clear employee search"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              {/* Select Dropdown */}
              <div className="relative">
                <select
                  id="score-reset-employee"
                  aria-label="Employee to reset"
                  onChange={(event) => {
                    setEmployeeId(event.target.value);
                  }}
                  value={employeeId}
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm text-slate-900 shadow-xs focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                >
                  <option value="">
                    Select Employee ({filteredEmployees.length} shown)
                  </option>
                  {filteredEmployees.map((item) => (
                    <option key={item.id} value={item.id}>
                      {employeeName(item)} · {item.id} (Score: {item.safetyScore})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              </div>

              {filteredEmployees.length === 0 && (
                <div className="flex items-center justify-between rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">
                  <p>No employees match your search.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setEmployeeSearch("");
                      setEmployeeFilter("all");
                    }}
                    className="font-semibold underline hover:text-amber-950 cursor-pointer"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            {/* Employee Card Preview */}
            {employee && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-800 font-semibold text-xs">
                    {employee.name ? employee.name.charAt(0) : "E"}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{employeeName(employee)}</div>
                    <div className="text-slate-500 font-mono text-[11px]">
                      {employee.id} · {employee.departmentId ?? "General"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">
                      Current Score
                    </span>
                    <span
                      className={cn(
                        "font-bold text-sm",
                        employee.safetyScore >= 90
                          ? "text-emerald-700"
                          : employee.safetyScore >= 75
                          ? "text-amber-700"
                          : "text-red-700",
                      )}
                    >
                      {employee.safetyScore}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmployeeId("")}
                    className="cursor-pointer inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-2xs hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    title="Change employee"
                    aria-label="Clear selected employee"
                  >
                    <X className="size-3 text-slate-400" />
                    <span>Change</span>
                  </button>
                </div>
              </div>
            )}

            {/* Reason Selector */}
            <div className="space-y-1.5">
              <label
                htmlFor="score-reset-reason"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Score Reset reason
              </label>
              <div className="relative">
                <select
                  id="score-reset-reason"
                  aria-label="Score Reset reason"
                  onChange={(event) =>
                    setReason(event.target.value as SafetyScoreResetReason | "")
                  }
                  value={reason}
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm text-slate-900 shadow-xs focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                >
                  <option value="">Select reason</option>
                  {safetyScoreResetReasons.map((item) => (
                    <option key={item} value={item}>
                      {safetyScoreResetReasonLabels[item]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              </div>
            </div>

            {/* Reason Note (if reason === "Other") */}
            {reason === "Other" && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label
                  htmlFor="score-reset-note"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Reason note
                </label>
                <input
                  id="score-reset-note"
                  aria-label="Reason note"
                  placeholder="Enter detailed reason for the score reset..."
                  onChange={(event) => setNote(event.target.value)}
                  value={note}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
            )}

            {/* Restored Score Info Callout */}
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
              <Info className="size-4 text-amber-700 shrink-0" />
              <p>The restored Safety Score will be {settings.initialScore}.</p>
            </div>

            {/* Inline Error Callout (Near Action Button) */}
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl bg-red-50/90 border border-red-200/80 px-3.5 py-2.5 text-xs text-red-800 animate-in fade-in duration-150">
                <AlertCircle className="size-4 text-red-600 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={review}
              className={cn(
                "group relative w-full h-10 sm:h-10.5 overflow-hidden rounded-xl font-semibold text-sm shadow-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer",
                "bg-gradient-to-r from-amber-400 via-amber-400 to-amber-300 text-slate-950",
                "hover:from-amber-300 hover:to-amber-400 hover:shadow-sm hover:shadow-amber-500/20 active:scale-[0.99]",
                "focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 border border-amber-500/30",
              )}
            >
              <RotateCcw className="size-3.5 text-slate-950 transition-transform duration-300 group-hover:-rotate-45" />
              <span>Review Score Reset</span>
              <ArrowRight className="size-3.5 text-slate-900 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          </div>
        </section>

        {/* Right Column: Live Audit History & Score Period Summary */}
        <section className="lg:col-span-7 space-y-6">
          {!employeeId ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 p-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-3">
                <History className="size-6 text-slate-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                No Employee Selected
              </h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
                Select an employee from the dropdown on the left to inspect their score periods, violation ledger, and reset audit log.
              </p>
            </div>
          ) : !audit ? (
            <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12">
              <p className="text-xs font-medium text-slate-500">Loading audit history…</p>
            </div>
          ) : (
            <section aria-label="Score Reset audit" className="space-y-6 animate-in fade-in duration-200">
              {/* Score Period Summary Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-amber-600" />
                    <h2 className="text-base font-bold text-slate-900">
                      Score Period summary
                    </h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600 font-medium">
                    {audit.periods.length} {audit.periods.length === 1 ? "Period" : "Periods"}
                  </span>
                </div>

                {audit.periods.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    No score periods closed yet for this employee.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {audit.periods.map((period) => (
                      <article
                        key={period.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-mono font-bold text-slate-800">
                            Score Period: {period.id}
                          </p>
                          <span className="inline-flex items-center rounded-md bg-amber-100/70 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                            {period.totalViolations} Violations
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-200/50">
                          <p>Started: {formatWib(period.startedAt)}</p>
                          <p>Closed: {formatWib(period.closedAt)}</p>
                          <p>Configured Initial Safety Score: {settings.initialScore}</p>
                          <p>Final Safety Score before Score Reset: {period.finalScoreBeforeReset}</p>
                          <p>Total Violations: {period.totalViolations}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              {/* Safety Score Ledger Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <History className="size-4 text-amber-600" />
                    <h2 className="text-base font-bold text-slate-900">
                      Safety Score ledger
                    </h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600 font-medium">
                    {audit.ledger.length} {audit.ledger.length === 1 ? "Entry" : "Entries"}
                  </span>
                </div>

                {audit.ledger.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    No ledger transitions recorded.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {audit.ledger.map((entry) => (
                      <article
                        key={entry.id}
                        className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center justify-center rounded-full bg-slate-100 size-6 text-slate-600 text-xs">
                            #
                          </span>
                          <div>
                            <p className="font-semibold text-slate-900">
                              Safety Score: {entry.scoreBefore} → {entry.scoreAfter}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Recorded: {formatWib(entry.recordedAt)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[11px] font-bold font-mono",
                            entry.scoreAfter >= entry.scoreBefore
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800",
                          )}
                        >
                          {entry.scoreAfter >= entry.scoreBefore
                            ? `+${entry.scoreAfter - entry.scoreBefore}`
                            : `${entry.scoreAfter - entry.scoreBefore}`}
                        </span>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              {/* Score Reset Log Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-amber-600" />
                    <h2 className="text-base font-bold text-slate-900">
                      Score Reset log
                    </h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600 font-medium">
                    {audit.resetLogs.length} {audit.resetLogs.length === 1 ? "Log" : "Logs"}
                  </span>
                </div>

                {audit.resetLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    No reset logs found for this employee.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {audit.resetLogs.map((log) => (
                      <article
                        key={log.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                            Trigger: {log.trigger}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Recorded: {formatWib(log.occurredAt)}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800">
                          Reason: {safetyScoreResetReasonLabels[log.reason]}
                        </p>
                        <div className="flex items-center gap-4 text-slate-600 text-[11px]">
                          <p>Actor: {log.actor}</p>
                          <p>Note: {log.note ?? "No note"}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </section>
      </div>

      {/* Review Dialog */}
      {step === "review" && employee && reason && (
        <AccessibleDialog
          label="Review Score Reset"
          onDismiss={() => setStep("form")}
        >
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 ring-1 ring-amber-200/60">
                  <RotateCcw className="size-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Review Score Reset</h2>
                  <p className="text-xs text-slate-500">
                    Verify the reset target and justification before final confirmation.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep("form")}
                className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="Close dialog"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-3.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Employee
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">{employeeName(employee)}</span>
                    <span className="font-mono text-[11px] text-slate-500">{employee.id} · {employee.departmentId ?? "General"}</span>
                  </div>
                </div>

                <div className="h-px bg-slate-200/70" />

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Score Transition
                  </span>
                  <span className="font-mono font-bold text-base text-amber-700">
                    {employee.safetyScore} → {settings.initialScore}
                  </span>
                </div>

                <div className="h-px bg-slate-200/70" />

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Justification
                  </span>
                  <span className="font-medium text-slate-800">
                    {safetyScoreResetReasonLabels[reason]}
                  </span>
                </div>

                {note && (
                  <>
                    <div className="h-px bg-slate-200/70" />
                    <div className="text-xs space-y-1">
                      <span className="font-semibold text-slate-500 uppercase tracking-wider block">Note:</span>
                      <p className="text-slate-800 italic bg-white p-2.5 rounded-lg border border-slate-200">
                        {note}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 bg-slate-50/50 px-6 py-4 border-t border-slate-100">
              <Button
                onClick={() => setStep("form")}
                variant="outline"
                className="cursor-pointer h-10 px-5 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium text-xs shadow-2xs transition-colors"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep("confirm")}
                className="cursor-pointer h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs hover:shadow-sm transition-all flex items-center gap-2 group"
              >
                <span>Continue to confirmation</span>
                <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </div>
        </AccessibleDialog>
      )}

      {/* Confirm Dialog */}
      {step === "confirm" && (
        <AccessibleDialog
          label="Confirm Score Reset"
          onDismiss={() => setStep("form")}
        >
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-amber-50/60 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 ring-1 ring-amber-300/60">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Confirm Score Reset</h2>
                  <p className="text-xs text-amber-800 font-medium mt-0.5">
                    Irreversible administrative safety action
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep("form")}
                className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors"
                aria-label="Close dialog"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950 space-y-2">
                <p className="font-semibold text-amber-900">
                  This closes the Score Period and records the audit result.
                </p>
                <p className="text-xs text-amber-800/90 leading-relaxed">
                  The employee's current score period will be finalized, safety score restored to{" "}
                  <span className="font-bold font-mono">{settings.initialScore}</span>, and an immutable audit log created.
                </p>
              </div>

              {employee && (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs">
                  <div className="text-slate-600">
                    Target Employee: <span className="font-semibold text-slate-900">{employeeName(employee)}</span> ({employee.id})
                  </div>
                  <div className="font-mono font-bold text-amber-800">
                    {employee.safetyScore} → {settings.initialScore}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 bg-slate-50/50 px-6 py-4 border-t border-slate-100">
              <Button
                onClick={() => setStep("form")}
                variant="outline"
                className="cursor-pointer h-10 px-5 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium text-xs shadow-2xs transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={() => void confirm()}
                className="cursor-pointer h-10 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-sm hover:shadow-md hover:shadow-amber-500/25 active:scale-[0.99] transition-all flex items-center gap-2"
              >
                <Check className="size-4 text-slate-950 stroke-[2.5]" />
                <span>Confirm Score Reset</span>
              </Button>
            </div>
          </div>
        </AccessibleDialog>
      )}
    </section>
  );
}
