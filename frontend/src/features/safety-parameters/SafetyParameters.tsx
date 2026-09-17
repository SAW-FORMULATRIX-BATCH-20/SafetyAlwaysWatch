import { useEffect, useRef, type SubmitEvent } from "react";
import { animate } from "animejs";
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock3,
  Gauge,
  Info,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Timer,
  X,
} from "lucide-react";

import { Button } from "../../components/ui/button";
import {
  useSafetyParametersQuery,
  useUpdateSafetyParametersMutation,
  type SafetyParametersService,
} from "../../hooks/queries/useSafetyParametersQuery";
import { EnsureQueryClient } from "../../providers/EnsureQueryClient";
import type { SafetySettings } from "../../services/saw-service";
import {
  cloneSafetySettings,
  useSafetyParametersStore,
} from "../../stores/useSafetyParametersStore";

export type { SafetyParametersService };

function validate(settings: SafetySettings) {
  if (
    !Number.isFinite(settings.initialScore) ||
    settings.initialScore < 0 ||
    settings.initialScore > 100
  )
    return "Initial Safety Score must be between 0 and 100.";
  if (
    !Number.isFinite(settings.escalationThreshold) ||
    settings.escalationThreshold < 0 ||
    settings.escalationThreshold > 100
  )
    return "Escalation Threshold must be between 0 and 100.";
  if (settings.escalationThreshold >= settings.initialScore)
    return "Escalation Threshold must be lower than Initial Safety Score.";
  if (
    settings.deductions.some(
      (deduction) =>
        !Number.isFinite(deduction.points) ||
        deduction.points < 1 ||
        deduction.points > 100,
    )
  )
    return "Each PPE deduction must be between 1 and 100 points.";
  if (
    !Number.isFinite(settings.confirmThresholdSeconds) ||
    settings.confirmThresholdSeconds < 1 ||
    settings.confirmThresholdSeconds > 60
  )
    return "Confirmation Threshold must be between 1 and 60 seconds.";
  if (
    !Number.isFinite(settings.clearThresholdSeconds) ||
    settings.clearThresholdSeconds < 1 ||
    settings.clearThresholdSeconds > 60
  )
    return "Clearing Threshold must be between 1 and 60 seconds.";
  if (settings.clearThresholdSeconds >= settings.confirmThresholdSeconds)
    return "Clearing Threshold must be lower than Confirmation Threshold.";
  if (
    !Number.isFinite(settings.minimumConfidence) ||
    settings.minimumConfidence < 0 ||
    settings.minimumConfidence > 1
  )
    return "Minimum Detection Confidence must be between 0 and 1.";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(settings.resetTime))
    return "Score Reset schedule must use a valid HH:MM time.";
  if (
    !Number.isFinite(settings.recapLeadMinutes) ||
    settings.recapLeadMinutes < 0 ||
    settings.recapLeadMinutes > 1440
  )
    return "Recap lead time must be between 0 and 1440 minutes.";
}

function NoticeToast({
  notice,
  onDismiss,
}: {
  notice: string;
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
        translateY: [-20, 0],
        opacity: [0, 1],
        scale: [0.95, 1],
        duration: 350,
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
      role="status"
      className="fixed top-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto sm:max-w-md z-50 overflow-hidden rounded-2xl border border-emerald-200/90 bg-white shadow-2xl ring-1 ring-emerald-500/15"
    >
      <div className="flex items-start gap-3 p-4 text-slate-900">
        <div
          ref={iconRef}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200/70"
        >
          <CheckCircle2 className="size-5" />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
            Configuration Status
          </h4>
          <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
            {notice}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Progress countdown bar powered by anime.js */}
      <div className="h-1 w-full bg-emerald-100/70 overflow-hidden">
        <div
          ref={progressRef}
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500"
        />
      </div>
    </div>
  );
}

export interface SafetyParametersProps {
  service?: SafetyParametersService;
}

function SafetyParametersContent({ service }: SafetyParametersProps) {
  const {
    settings,
    error: queryError,
  } = useSafetyParametersQuery({ service });
  const updateMutation = useUpdateSafetyParametersMutation({ service });

  const draft = useSafetyParametersStore((state) => state.draft);
  const error = useSafetyParametersStore((state) => state.error);
  const notice = useSafetyParametersStore((state) => state.notice);
  const setDraft = useSafetyParametersStore((state) => state.setDraft);
  const updateField = useSafetyParametersStore((state) => state.updateField);
  const updateDeduction = useSafetyParametersStore(
    (state) => state.updateDeduction,
  );
  const setError = useSafetyParametersStore((state) => state.setError);
  const setNotice = useSafetyParametersStore((state) => state.setNotice);

  useEffect(() => {
    return () => {
      useSafetyParametersStore.getState().reset();
    };
  }, []);

  useEffect(() => {
    if (settings && !draft) {
      setDraft(settings);
    }
  }, [settings, draft, setDraft]);

  useEffect(() => {
    if (queryError) {
      setError(
        queryError instanceof Error
          ? queryError.message
          : "Safety Parameters could not be loaded.",
      );
    }
  }, [queryError, setError]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => {
      setNotice(undefined);
    }, 4000);
    return () => clearTimeout(timer);
  }, [notice, setNotice]);

  const saving = updateMutation.isPending;

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft) return;
    const validationError = validate(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(undefined);
    setNotice(undefined);
    try {
      const updated = await updateMutation.mutateAsync(draft);
      setDraft(updated);
      setNotice("Safety Parameters saved.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Safety Parameters could not be saved.",
      );
    }
  };

  if (!draft)
    return (
      <section
        aria-busy="true"
        aria-live="polite"
        className="space-y-6"
      >
        <div className="border-b border-slate-200/80 pb-5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-900 border border-amber-500/20">
            Administration · policy configuration
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-2">
            Safety Parameters
          </h1>
        </div>
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
          <div className="size-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">
            {error ?? "Loading Safety Parameters…"}
          </p>
        </div>
      </section>
    );

  const escalationPct = Math.min(
    100,
    Math.max(0, draft.escalationThreshold),
  );
  const initialPct = Math.min(100, Math.max(0, draft.initialScore));

  return (
    <section aria-labelledby="safety-parameters-title" className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200/80 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-900 border border-amber-500/20">
                <Sliders className="size-3 text-amber-600" />
                Administration · policy configuration
              </span>
            </div>
            <h1
              id="safety-parameters-title"
              className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-2"
            >
              Safety Parameters
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
              Configure Safety Score, Violation Episode timing, Detection
              Confidence, and Score Reset scheduling across all monitored
              cameras.
            </p>
          </div>

          {/* KPI Mini-badges */}
          <div className="flex flex-wrap items-center gap-2.5 sm:self-start">
            <div className="rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 shadow-2xs">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Initial Score
              </span>
              <span className="text-sm font-mono font-bold text-slate-900">
                {draft.initialScore} pts
              </span>
            </div>
            <div className="rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 shadow-2xs">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Escalation Alert
              </span>
              <span className="text-sm font-mono font-bold text-amber-800">
                &lt; {draft.escalationThreshold} pts
              </span>
            </div>
            <div className="rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 shadow-2xs">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Daily Reset
              </span>
              <span className="text-sm font-mono font-bold text-slate-800">
                {draft.resetTime} WIB
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error & Success Feedback Alerts */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 shadow-sm text-sm text-red-900 animate-in fade-in slide-in-from-top-1"
        >
          <AlertTriangle className="size-5 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-red-950">Configuration Validation Error</p>
            <p className="mt-0.5 text-xs text-red-800 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Toast Notification powered by anime.js */}
      {notice && (
        <NoticeToast notice={notice} onDismiss={() => setNotice(undefined)} />
      )}

      {/* Main Settings Form */}
      <form noValidate onSubmit={(event) => void submit(event)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Safety Score & Escalation Threshold */}
          <fieldset className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5 h-full flex flex-col justify-between">
            <legend className="sr-only">Safety Score</legend>
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-800">
                <Gauge className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Safety Score &amp; Thresholds
                </h2>
                <p className="text-xs text-slate-500">
                  Baseline points and automatic escalation triggers
                </p>
              </div>
            </div>

            {/* Visual Gauge Bar */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="flex items-center gap-1.5 text-red-700">
                  <span className="size-2 rounded-full bg-red-500" />
                  Escalation Zone (0 - {draft.escalationThreshold} pts)
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Safe Operating Zone ({draft.escalationThreshold} - {draft.initialScore} pts)
                </span>
              </div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-300"
                  style={{ width: `${escalationPct}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 bg-emerald-500 transition-all duration-300"
                  style={{
                    left: `${escalationPct}%`,
                    width: `${Math.max(0, initialPct - escalationPct)}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-xs font-semibold text-slate-700 space-y-1.5">
                <span>Initial Safety Score</span>
                <div className="relative">
                  <input
                    aria-label="Initial Safety Score"
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 pr-14 text-sm font-mono text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs"
                    max="100"
                    min="0"
                    onChange={(event) =>
                      updateField("initialScore", event.target.value)
                    }
                    type="number"
                    value={draft.initialScore}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-medium text-slate-400">
                    pts
                  </span>
                </div>
                <span className="block text-[11px] font-normal text-slate-500">
                  Default score assigned to workers on reset.
                </span>
              </label>

              <label className="block text-xs font-semibold text-slate-700 space-y-1.5">
                <span>Escalation Threshold</span>
                <div className="relative">
                  <input
                    aria-label="Escalation Threshold"
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 pr-14 text-sm font-mono text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs"
                    max="100"
                    min="0"
                    onChange={(event) =>
                      updateField("escalationThreshold", event.target.value)
                    }
                    type="number"
                    value={draft.escalationThreshold}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-medium text-slate-400">
                    pts
                  </span>
                </div>
                <span className="block text-[11px] font-normal text-slate-500">
                  Scores below this raise escalation alarms.
                </span>
              </label>
            </div>

            {/* Deductions Sub-card inside Score Card */}
            <div className="pt-3 border-t border-slate-100 space-y-3 flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-4 text-amber-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    PPE Penalty Deductions
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {draft.deductions.length} classes defined
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 content-start">
                {draft.deductions.map((deduction) => (
                  <div
                    key={deduction.canonicalPpeClass}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 hover:bg-white hover:border-slate-300 transition-all shadow-2xs flex flex-col justify-between"
                  >
                    <label className="block text-xs font-semibold text-slate-800 space-y-1.5 h-full flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-800 leading-snug">
                          Deduction for {deduction.canonicalPpeClass}
                        </span>
                        <span className="inline-flex items-center rounded-md bg-red-50 border border-red-200 px-1.5 py-0.5 text-[10px] font-mono font-bold text-red-700 shrink-0">
                          -{deduction.points} pts
                        </span>
                      </div>
                      <div className="relative mt-auto pt-1">
                        <input
                          aria-label={`Deduction for ${deduction.canonicalPpeClass}`}
                          className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 pr-12 text-sm font-mono text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                          max="100"
                          min="1"
                          onChange={(event) =>
                            updateDeduction(
                              deduction.canonicalPpeClass,
                              Number(event.target.value),
                            )
                          }
                          type="number"
                          value={deduction.points}
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-400">
                          pts
                        </span>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </fieldset>

          {/* Card 2: Violation Episode Timing & Confidence & Score Reset Schedule */}
          <div className="flex flex-col gap-6 h-full justify-between">
            {/* Episode Timing and Detection */}
            <fieldset className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5 flex-1 flex flex-col justify-between">
              <legend className="sr-only">
                Violation Episode timing and detection
              </legend>
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-800">
                  <Timer className="size-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Episode Timing & Detection
                  </h2>
                  <p className="text-xs text-slate-500">
                    Incident confirmation, clearing thresholds, and AI sensitivity
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block text-xs font-semibold text-slate-700 space-y-1.5">
                  <span>Confirmation Threshold</span>
                  <div className="relative">
                    <input
                      aria-label="Confirmation Threshold"
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 pr-14 text-sm font-mono text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs"
                      max="60"
                      min="1"
                      onChange={(event) =>
                        updateField("confirmThresholdSeconds", event.target.value)
                      }
                      type="number"
                      value={draft.confirmThresholdSeconds}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-medium text-slate-400">
                      sec
                    </span>
                  </div>
                  <span className="block text-[11px] font-normal text-slate-500">
                    Continuous duration required to confirm violation.
                  </span>
                </label>

                <label className="block text-xs font-semibold text-slate-700 space-y-1.5">
                  <span>Clearing Threshold</span>
                  <div className="relative">
                    <input
                      aria-label="Clearing Threshold"
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 pr-14 text-sm font-mono text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs"
                      max="60"
                      min="1"
                      onChange={(event) =>
                        updateField("clearThresholdSeconds", event.target.value)
                      }
                      type="number"
                      value={draft.clearThresholdSeconds}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-medium text-slate-400">
                      sec
                    </span>
                  </div>
                  <span className="block text-[11px] font-normal text-slate-500">
                    Compliant duration required to clear incident.
                  </span>
                </label>
              </div>

              {/* Minimum Confidence */}
              <label className="block text-xs font-semibold text-slate-700 space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span>Minimum Detection Confidence</span>
                  <span className="rounded-md bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-xs font-mono font-bold text-amber-800">
                    {(draft.minimumConfidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <div className="relative">
                  <input
                    aria-label="Minimum Detection Confidence"
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 pr-14 text-sm font-mono text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs"
                    max="1"
                    min="0"
                    onChange={(event) =>
                      updateField("minimumConfidence", event.target.value)
                    }
                    step="0.01"
                    type="number"
                    value={draft.minimumConfidence}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-medium text-slate-400">
                    0.0 - 1.0
                  </span>
                </div>
                <span className="block text-[11px] font-normal text-slate-500">
                  Detections below this probability threshold are filtered out.
                </span>
              </label>
            </fieldset>

            {/* Score Reset Schedule Card */}
            <fieldset className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
              <legend className="sr-only">Score Reset schedule</legend>
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-800">
                  <Calendar className="size-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Score Reset Schedule
                  </h2>
                  <p className="text-xs text-slate-500">
                    Automated daily score restoration timing
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block text-xs font-semibold text-slate-700 space-y-1.5">
                  <span>Score Reset schedule</span>
                  <div className="relative">
                    <input
                      aria-label="Score Reset schedule"
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-mono text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs"
                      onChange={(event) =>
                        updateField("resetTime", event.target.value)
                      }
                      type="time"
                      value={draft.resetTime}
                    />
                  </div>
                  <span className="block text-[11px] font-normal text-slate-500">
                    Daily recurring score reset time.
                  </span>
                </label>

                <label className="block text-xs font-semibold text-slate-700 space-y-1.5">
                  <span>Recap lead time</span>
                  <div className="relative">
                    <input
                      aria-label="Recap lead time"
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 pr-14 text-sm font-mono text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all shadow-2xs"
                      max="1440"
                      min="0"
                      onChange={(event) =>
                        updateField("recapLeadMinutes", event.target.value)
                      }
                      type="number"
                      value={draft.recapLeadMinutes}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-medium text-slate-400">
                      mins
                    </span>
                  </div>
                  <span className="block text-[11px] font-normal text-slate-500">
                    Lead time before score reset for recap generation.
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 rounded-xl px-3.5 py-2.5 border border-slate-200/70">
                <Clock3 className="size-4 text-slate-400 shrink-0" />
                <p>Time zone: Asia/Jakarta (WIB)</p>
              </div>
            </fieldset>
          </div>
        </div>

        {/* Action Footer Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0">
            <Info className="size-3.5 text-amber-600 shrink-0" />
            <span className="truncate">
              Changes directly impact all camera feeds &amp; active violation scoring.
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
            <Button
              disabled={saving}
              onClick={() => {
                if (settings) {
                  setDraft(cloneSafetySettings(settings));
                  setError(undefined);
                  setNotice("Safety Parameter changes cancelled.");
                }
              }}
              type="button"
              variant="outline"
              className="cursor-pointer h-9 px-4 rounded-xl border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-medium text-xs shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="size-3.5" />
              <span>Cancel</span>
            </Button>
            <Button
              aria-label={saving ? "Saving…" : "Save Safety Parameters"}
              disabled={saving}
              type="submit"
              className="cursor-pointer h-9 px-4 sm:px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-xs hover:shadow-sm active:scale-[0.99] transition-all flex items-center gap-1.5 shrink-0"
            >
              {saving ? (
                <>
                  <span className="size-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <Check className="size-3.5 stroke-[2.5]" />
                  <span>Save</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}

export function SafetyParameters(props: SafetyParametersProps) {
  return (
    <EnsureQueryClient>
      <SafetyParametersContent {...props} />
    </EnsureQueryClient>
  );
}
