import { animate } from "animejs";
import { useEffect, useRef, useState } from "react";

import { Button } from "../../components/ui/button";
import type { OverviewCapability, OverviewData } from "../../services/saw-service";
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

  return <strong className="mt-3 block text-3xl font-semibold tracking-tight text-slate-950">{displayedValue}{suffix}</strong>;
}

export function Overview({ service }: { service: OverviewCapability }) {
  const [overview, setOverview] = useState<OverviewData | null>();
  const [error, setError] = useState<string>();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    service.getOverview().then((nextOverview) => {
      if (active) setOverview(nextOverview);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "SAW demo data could not be loaded.");
    });
    return () => { active = false; };
  }, [refreshKey, service]);

  const retryLoad = () => {
    setError(undefined);
    setOverview(undefined);
    setRefreshKey((key) => key + 1);
  };

  const resetDemoData = async () => {
    setOverview(await service.resetDemoData());
    setConfirmingReset(false);
  };

  if (error) return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Overview</h1><div className="mt-6 border border-red-200 bg-red-50 p-6"><p className="font-medium text-red-900">SAW demo data could not be loaded</p><p className="mt-1 text-sm text-red-800">{error}</p><Button className="mt-4" onClick={retryLoad} variant="outline">Try again</Button></div></section>;
  if (overview === undefined) return <section aria-busy="true" aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Overview</h1><p className="mt-6 text-slate-600">Loading safety overview…</p></section>;
  if (overview === null) return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Overview</h1><div className="mt-6 border border-dashed border-slate-300 bg-white p-6"><p className="font-medium">No demo data</p><p className="mt-1 text-sm text-slate-600">Add SAW data to view the safety summary.</p></div></section>;

  return <section>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Operational overview</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Overview</h1><p className="mt-2 text-sm text-slate-600">Current SAW safety condition.</p></div>
      <Button onClick={() => setConfirmingReset(true)} variant="outline">Reset demo data</Button>
    </div>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Active Camera Sources</p><Metric suffix={` / ${overview.totalCameras}`} value={overview.activeCameras} /></article>
      <article className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Active Violations</p><Metric value={overview.activeViolations} /></article>
      <article className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Today's PPE Compliance</p><Metric suffix="%" value={overview.ppeCompliance} /></article>
      <article className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Employees below the Escalation Threshold</p><Metric value={overview.employeesBelowEscalationThreshold} /></article>
    </div>
    {confirmingReset && <AccessibleDialog label="Reset demo data?" onDismiss={() => setConfirmingReset(false)}><div className="w-full max-w-md bg-white p-6 shadow-xl"><h2 className="text-xl font-semibold">Reset demo data?</h2><p className="mt-2 text-sm leading-6 text-slate-600">All demo changes will be restored to the initial seed.</p><div className="mt-6 flex justify-end gap-3"><Button data-dialog-initial-focus onClick={() => setConfirmingReset(false)} variant="outline">Cancel</Button><Button onClick={() => void resetDemoData()}>Reset demo data</Button></div></div></AccessibleDialog>}
  </section>;
}
