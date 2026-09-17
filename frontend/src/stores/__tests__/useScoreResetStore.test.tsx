import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScoreResetStore } from "../useScoreResetStore";

describe("State Management - useScoreResetStore", () => {
  beforeEach(() => {
    act(() => {
      useScoreResetStore.getState().reset();
    });
  });

  it("initializes with default values", () => {
    const { result } = renderHook(() => useScoreResetStore());

    expect(result.current.employeeId).toBe("");
    expect(result.current.reason).toBe("");
    expect(result.current.note).toBe("");
    expect(result.current.step).toBe("form");
    expect(result.current.error).toBeUndefined();
    expect(result.current.result).toBeUndefined();
    expect(result.current.employeeSearch).toBe("");
    expect(result.current.employeeFilter).toBe("all");
  });

  it("updates employeeId and clears result and error", () => {
    const { result } = renderHook(() => useScoreResetStore());

    act(() => {
      result.current.setError("Previous error");
      result.current.setEmployeeId("EMP-01");
    });

    expect(result.current.employeeId).toBe("EMP-01");
    expect(result.current.error).toBeUndefined();
  });

  it("updates reason, note, step, error, and result", () => {
    const { result } = renderHook(() => useScoreResetStore());

    act(() => {
      result.current.setReason("Other");
      result.current.setNote("Audit note");
      result.current.setStep("review");
      result.current.setError("Sample error");
    });

    expect(result.current.reason).toBe("Other");
    expect(result.current.note).toBe("Audit note");
    expect(result.current.step).toBe("review");
    expect(result.current.error).toBe("Sample error");
  });

  it("updates employeeSearch and employeeFilter", () => {
    const { result } = renderHook(() => useScoreResetStore());

    act(() => {
      result.current.setEmployeeSearch("Ahmad");
      result.current.setEmployeeFilter("needs-reset");
    });

    expect(result.current.employeeSearch).toBe("Ahmad");
    expect(result.current.employeeFilter).toBe("needs-reset");
  });

  it("resets form fields via resetForm", () => {
    const { result } = renderHook(() => useScoreResetStore());

    act(() => {
      result.current.setEmployeeId("EMP-01");
      result.current.setReason("InvestigationClosed");
      result.current.setNote("Note");
      result.current.setStep("confirm");
      result.current.resetForm();
    });

    expect(result.current.employeeId).toBe("EMP-01");
    expect(result.current.reason).toBe("");
    expect(result.current.note).toBe("");
    expect(result.current.step).toBe("form");
  });

  it("resets entire store via reset", () => {
    const { result } = renderHook(() => useScoreResetStore());

    act(() => {
      result.current.setEmployeeId("EMP-01");
      result.current.setReason("InvestigationClosed");
      result.current.setNote("Note");
      result.current.setStep("confirm");
      result.current.setError("Error");
      result.current.setEmployeeSearch("Ahmad");
      result.current.setEmployeeFilter("critical");
      result.current.reset();
    });

    expect(result.current.employeeId).toBe("");
    expect(result.current.reason).toBe("");
    expect(result.current.note).toBe("");
    expect(result.current.step).toBe("form");
    expect(result.current.error).toBeUndefined();
    expect(result.current.employeeSearch).toBe("");
    expect(result.current.employeeFilter).toBe("all");
  });
});
