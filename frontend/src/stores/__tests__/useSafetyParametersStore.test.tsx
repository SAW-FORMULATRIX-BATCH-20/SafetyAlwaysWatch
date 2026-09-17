import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSafetyParametersStore } from "../useSafetyParametersStore";
import type { SafetySettings } from "../../services/saw-service";

const mockSettings: SafetySettings = {
  initialScore: 100,
  escalationThreshold: 60,
  deductions: [
    { canonicalPpeClass: "Safety Helmet", points: 10 },
    { canonicalPpeClass: "Safety Vest", points: 5 },
  ],
  confirmThresholdSeconds: 5,
  clearThresholdSeconds: 2,
  minimumConfidence: 0.8,
  resetTime: "06:00",
  recapLeadMinutes: 30,
  timeZone: "Asia/Jakarta",
};

describe("State Management - useSafetyParametersStore", () => {
  beforeEach(() => {
    act(() => {
      useSafetyParametersStore.getState().reset();
    });
  });

  it("initializes with default empty values", () => {
    const { result } = renderHook(() => useSafetyParametersStore());

    expect(result.current.draft).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(result.current.notice).toBeUndefined();
  });

  it("sets draft and deep-clones deduction items", () => {
    const { result } = renderHook(() => useSafetyParametersStore());

    act(() => {
      result.current.setDraft(mockSettings);
    });

    expect(result.current.draft).toEqual(mockSettings);
    expect(result.current.draft?.deductions).not.toBe(mockSettings.deductions);
    expect(result.current.draft?.deductions[0]).not.toBe(mockSettings.deductions[0]);
  });

  it("updates scalar fields and clears error & notice", () => {
    const { result } = renderHook(() => useSafetyParametersStore());

    act(() => {
      result.current.setDraft(mockSettings);
      result.current.setError("Existing error");
      result.current.setNotice("Existing notice");
    });

    expect(result.current.error).toBe("Existing error");
    expect(result.current.notice).toBe("Existing notice");

    act(() => {
      result.current.updateField("initialScore", "90");
    });

    expect(result.current.draft?.initialScore).toBe(90);
    expect(result.current.error).toBeUndefined();
    expect(result.current.notice).toBeUndefined();

    act(() => {
      result.current.updateField("resetTime", "08:30");
    });

    expect(result.current.draft?.resetTime).toBe("08:30");
  });

  it("updates specific deduction points and clears error & notice", () => {
    const { result } = renderHook(() => useSafetyParametersStore());

    act(() => {
      result.current.setDraft(mockSettings);
      result.current.setError("An error");
      result.current.updateDeduction("Safety Helmet", 15);
    });

    const updatedHelmet = result.current.draft?.deductions.find(
      (d) => d.canonicalPpeClass === "Safety Helmet",
    );
    const untouchedVest = result.current.draft?.deductions.find(
      (d) => d.canonicalPpeClass === "Safety Vest",
    );

    expect(updatedHelmet?.points).toBe(15);
    expect(untouchedVest?.points).toBe(5);
    expect(result.current.error).toBeUndefined();
  });

  it("manages error and notice independently", () => {
    const { result } = renderHook(() => useSafetyParametersStore());

    act(() => {
      result.current.setError("Validation error");
    });
    expect(result.current.error).toBe("Validation error");

    act(() => {
      result.current.setNotice("Settings saved.");
    });
    expect(result.current.notice).toBe("Settings saved.");
  });

  it("resets store back to initial empty state", () => {
    const { result } = renderHook(() => useSafetyParametersStore());

    act(() => {
      result.current.setDraft(mockSettings);
      result.current.setError("Error");
      result.current.setNotice("Notice");
    });

    expect(result.current.draft).toBeDefined();

    act(() => {
      result.current.reset();
    });

    expect(result.current.draft).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(result.current.notice).toBeUndefined();
  });
});
