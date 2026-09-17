import { animate } from "animejs";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  UserX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "../../components/ui/button";
import { useOverviewQuery, useResetDemoDataMutation } from "../../hooks/queries/useOverviewQuery";
import type { OverviewCapability } from "../../services/saw-service";
import { AccessibleDialog } from "../../shared/AccessibleDialog";

function Metric({ value, suffix = "" }: { suffix?: string; value: number }) {
  const [displayedValue, setDisplayedValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || previousValue.current === value) {
      setDisplayedValue(value);
      previousValue.current = value;
      return undefined;
    }

    const metric = { value: previousValue.current };
    const animation = animate(metric, {
      value,
      duration: 220,
      ease: "outQuad",
      onUpdate: () => setDisplayedValue(Math.round(metric.value)),
    });
    previousValue.current = value;
    return () => {
      animation.pause();
    };
  }, [value]);

  return (
    <strong className="mt-2 block text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
      {displayedValue}{suffix}
    </strong>
  );
}

export type OverviewProps = {
  service?: OverviewCapability;
};

export function Overview({ service: _service }: OverviewProps) {
  const { data: overview, isLoading, error: queryError, refetch } = useOverviewQuery();
  const resetMutation = useResetDemoDataMutation();
  const [confirmingReset, setConfirmingReset] = useState(false);

  const error = queryError?.message;

  const retryLoad = () => {
    void refetch();
  };

  const handleResetDemoData = async () => {
    await resetMutation.mutateAsync();
    setConfirmingReset(false);
  };

  if (error) {
    return (
      <section aria-live="polite">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Operational overview</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950">Overview</h1>
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle aria-hidden="true" className="size-5 text-rose-600 shrink-0" />
            <p className="font-semibold text-rose-900">SAW demo data could not be loaded</p>
          </div>
          <p className="mt-2 text-sm text-rose-800">{error}</p>
          <Button className="mt-4 gap-1.5" onClick={retryLoad} variant="outline">
            <RotateCcw aria-hidden="true" className="size-3.5" />
            Try again
          </Button>
        </div>
      </section>
    );
  }

  if (isLoading || overview === undefined) {
    return (
      <section aria-busy="true" aria-live="polite">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Operational overview</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950">Overview</h1>
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-slate-500 shadow-xs">
          <div className="size-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="text-sm font-medium">Loading safety overview…</p>
        </div>
      </section>
    );
  }

  if (overview === null) {
    return (
      <section aria-live="polite">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Operational overview</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950">Overview</h1>
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-xs">
          <ShieldAlert aria-hidden="true" className="mx-auto size-8 text-slate-400" />
          <p className="mt-2 font-semibold text-slate-800">No demo data</p>
          <p className="mt-1 text-sm text-slate-600">Add SAW data to view the safety summary.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">
            Operational overview
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950">
            Overview
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Current SAW safety condition and real-time operational status.
          </p>
        </div>
        <Button
          className="w-full sm:w-auto justify-center gap-1.5 shadow-2xs hover:border-slate-400 hover:text-slate-900"
          onClick={() => setConfirmingReset(true)}
          variant="outline"
        >
          <RotateCcw aria-hidden="true" className="size-3.5 text-slate-500" />
          Reset demo data
        </Button>
      </div>

      <div className="mt-6 sm:mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {/* Active Camera Sources */}
        <article className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md">
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Camera Sources
              </p>
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 transition-colors group-hover:bg-amber-100">
                <Camera aria-hidden="true" className="size-4.5" />
              </div>
            </div>
            <Metric suffix={` / ${overview.totalCameras}`} value={overview.activeCameras} />
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-600 border-t border-slate-100 pt-3">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Online camera feeds</span>
          </div>
        </article>

        {/* Active Violations */}
        <article className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md">
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Violations
              </p>
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 transition-colors ${
                  overview.activeViolations > 0
                    ? "bg-rose-50 text-rose-700 ring-rose-200/80 group-hover:bg-rose-100"
                    : "bg-emerald-50 text-emerald-700 ring-emerald-200/80 group-hover:bg-emerald-100"
                }`}
              >
                <ShieldAlert aria-hidden="true" className="size-4.5" />
              </div>
            </div>
            <Metric value={overview.activeViolations} />
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-medium border-t border-slate-100 pt-3">
            {overview.activeViolations > 0 ? (
              <span className="text-rose-700 flex items-center gap-1">
                <AlertTriangle aria-hidden="true" className="size-3.5 shrink-0" />
                <span>Requires safety officer review</span>
              </span>
            ) : (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 aria-hidden="true" className="size-3.5 shrink-0" />
                <span>No safety violations reported</span>
              </span>
            )}
          </div>
        </article>

        {/* Today's PPE Compliance */}
        <article className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md">
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Today's PPE Compliance
              </p>
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 transition-colors ${
                  overview.ppeCompliance >= 90
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200/80 group-hover:bg-emerald-100"
                    : "bg-amber-50 text-amber-700 ring-amber-200/80 group-hover:bg-amber-100"
                }`}
              >
                <ShieldCheck aria-hidden="true" className="size-4.5" />
              </div>
            </div>
            <Metric suffix="%" value={overview.ppeCompliance} />
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overview.ppeCompliance >= 90
                    ? "bg-emerald-500"
                    : overview.ppeCompliance >= 75
                      ? "bg-amber-500"
                      : "bg-rose-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, overview.ppeCompliance))}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              {overview.ppeCompliance >= 90 ? "Optimal compliance rate" : "Standard compliance rate"}
            </p>
          </div>
        </article>

        {/* Employees below the Escalation Threshold */}
        <article className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md">
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Employees below the Escalation Threshold
              </p>
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 transition-colors ${
                  overview.employeesBelowEscalationThreshold > 0
                    ? "bg-amber-50 text-amber-700 ring-amber-200/80 group-hover:bg-amber-100"
                    : "bg-emerald-50 text-emerald-700 ring-emerald-200/80 group-hover:bg-emerald-100"
                }`}
              >
                <UserX aria-hidden="true" className="size-4.5" />
              </div>
            </div>
            <Metric value={overview.employeesBelowEscalationThreshold} />
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-medium border-t border-slate-100 pt-3">
            {overview.employeesBelowEscalationThreshold > 0 ? (
              <span className="text-amber-700">Safety escalation pending review</span>
            ) : (
              <span className="text-emerald-700">All employees meet threshold</span>
            )}
          </div>
        </article>
      </div>

      {confirmingReset && (
        <AccessibleDialog label="Reset demo data?" onDismiss={() => setConfirmingReset(false)}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100">
            <div className="border-b border-slate-100 bg-amber-50/50 p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 ring-1 ring-amber-200/60">
                  <RotateCcw aria-hidden="true" className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">Reset demo data?</h2>
                  <p className="mt-0.5 text-xs text-amber-800 font-medium">Restore factory baseline</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                All demo changes will be restored to the initial seed.
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 bg-slate-50/50 p-4 sm:px-6">
              <Button
                className="w-full sm:w-auto justify-center"
                data-dialog-initial-focus
                onClick={() => setConfirmingReset(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                className="w-full sm:w-auto justify-center gap-2 bg-amber-400 font-semibold text-slate-950 shadow-xs hover:bg-amber-500"
                disabled={resetMutation.isPending}
                onClick={() => void handleResetDemoData()}
              >
                {resetMutation.isPending ? (
                  <>
                    <div className="size-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    <span>Resetting…</span>
                  </>
                ) : (
                  <>
                    <RotateCcw aria-hidden="true" className="size-4" />
                    <span>Reset demo data</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </AccessibleDialog>
      )}
    </section>
  );
}

