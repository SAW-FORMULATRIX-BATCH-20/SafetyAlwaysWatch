import { useEffect, useState, type FormEvent } from "react";

import { Button } from "../../components/ui/button";
import type { SafetySettings } from "../../services/saw-service";

type SafetyParametersService = {
  getSafetySettings(): Promise<SafetySettings>;
  updateSafetySettings(settings: SafetySettings): Promise<SafetySettings>;
};

const cloneSafetySettings = (settings: SafetySettings): SafetySettings => ({
  ...settings,
  deductions: settings.deductions.map((deduction) => ({ ...deduction })),
});

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

export function SafetyParameters({
  service,
}: {
  service: SafetyParametersService;
}) {
  const [saved, setSaved] = useState<SafetySettings>();
  const [draft, setDraft] = useState<SafetySettings>();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    service
      .getSafetySettings()
      .then((settings) => {
        if (active) {
          setSaved(settings);
          setDraft(cloneSafetySettings(settings));
        }
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "Safety Parameters could not be loaded.",
          );
      });
    return () => {
      active = false;
    };
  }, [service]);

  const update = <
    Field extends keyof Omit<SafetySettings, "deductions" | "timeZone">,
  >(
    field: Field,
    value: string,
  ) => {
    setDraft((current) =>
      current
        ? { ...current, [field]: field === "resetTime" ? value : Number(value) }
        : current,
    );
    setError(undefined);
    setNotice(undefined);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const validationError = validate(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(undefined);
    setNotice(undefined);
    try {
      const settings = await service.updateSafetySettings(draft);
      setSaved(settings);
      setDraft(cloneSafetySettings(settings));
      setNotice("Safety Parameters saved.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Safety Parameters could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };
  if (!draft)
    return (
      <section aria-busy="true">
        <h1>Safety Parameters</h1>
        <p>{error ?? "Loading Safety Parameters…"}</p>
      </section>
    );

  return (
    <section aria-labelledby="safety-parameters-title">
      <p>Administration · policy configuration</p>
      <h1 id="safety-parameters-title">Safety Parameters</h1>
      <p>
        Configure Safety Score, Violation Episode timing, Detection Confidence,
        and Score Reset scheduling.
      </p>
      <form noValidate onSubmit={(event) => void submit(event)}>
        <fieldset>
          <legend>Safety Score</legend>
          <label>
            Initial Safety Score
            <input
              aria-label="Initial Safety Score"
              max="100"
              min="0"
              onChange={(event) => update("initialScore", event.target.value)}
              type="number"
              value={draft.initialScore}
            />
          </label>
          <label>
            Escalation Threshold
            <input
              aria-label="Escalation Threshold"
              max="100"
              min="0"
              onChange={(event) =>
                update("escalationThreshold", event.target.value)
              }
              type="number"
              value={draft.escalationThreshold}
            />
          </label>
          {draft.deductions.map((deduction) => (
            <label key={deduction.canonicalPpeClass}>
              Deduction for {deduction.canonicalPpeClass}
              <input
                aria-label={`Deduction for ${deduction.canonicalPpeClass}`}
                max="100"
                min="1"
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          deductions: current.deductions.map((item) =>
                            item.canonicalPpeClass ===
                            deduction.canonicalPpeClass
                              ? { ...item, points: Number(event.target.value) }
                              : item,
                          ),
                        }
                      : current,
                  )
                }
                type="number"
                value={deduction.points}
              />
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Violation Episode timing and detection</legend>
          <label>
            Confirmation Threshold
            <input
              aria-label="Confirmation Threshold"
              max="60"
              min="1"
              onChange={(event) =>
                update("confirmThresholdSeconds", event.target.value)
              }
              type="number"
              value={draft.confirmThresholdSeconds}
            />
          </label>
          <label>
            Clearing Threshold
            <input
              aria-label="Clearing Threshold"
              max="60"
              min="1"
              onChange={(event) =>
                update("clearThresholdSeconds", event.target.value)
              }
              type="number"
              value={draft.clearThresholdSeconds}
            />
          </label>
          <label>
            Minimum Detection Confidence
            <input
              aria-label="Minimum Detection Confidence"
              max="1"
              min="0"
              onChange={(event) =>
                update("minimumConfidence", event.target.value)
              }
              step="0.01"
              type="number"
              value={draft.minimumConfidence}
            />
          </label>
        </fieldset>
        <fieldset>
          <legend>Score Reset schedule</legend>
          <label>
            Score Reset schedule
            <input
              aria-label="Score Reset schedule"
              onChange={(event) => update("resetTime", event.target.value)}
              type="time"
              value={draft.resetTime}
            />
          </label>
          <label>
            Recap lead time
            <input
              aria-label="Recap lead time"
              max="1440"
              min="0"
              onChange={(event) =>
                update("recapLeadMinutes", event.target.value)
              }
              type="number"
              value={draft.recapLeadMinutes}
            />
          </label>
          <p>Time zone: Asia/Jakarta (WIB)</p>
        </fieldset>
        {error && <p role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
        <Button
          disabled={saving}
          onClick={() => {
            if (saved) {
              setDraft(cloneSafetySettings(saved));
              setError(undefined);
              setNotice("Safety Parameter changes cancelled.");
            }
          }}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
        <Button disabled={saving} type="submit">
          {saving ? "Saving…" : "Save Safety Parameters"}
        </Button>
      </form>
    </section>
  );
}
