import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryProvider } from "../../../providers/QueryProvider";
import {
  useScoreResetQuery,
  useScoreResetAuditQuery,
  useResetSafetyScoreMutation,
} from "../useScoreResetQuery";
import { createMockSawService } from "../../../services/saw-service";

describe("State Management - useScoreResetQuery", () => {
  it("fetches score reset initial data (directory and settings) successfully", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(() => useScoreResetQuery({ service }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.directory).toBeDefined();
    expect(result.current.directory?.employees.length).toBeGreaterThan(0);
    expect(result.current.settings).toBeDefined();
    expect(result.current.settings?.initialScore).toBe(100);
  });

  it("fetches score reset audit when employeeId is provided", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(
      () => useScoreResetAuditQuery({ employeeId: "EMP-01", service }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.audit).toBeDefined();
    expect(result.current.audit?.periods).toBeDefined();
    expect(result.current.audit?.ledger).toBeDefined();
    expect(result.current.audit?.resetLogs).toBeDefined();
  });

  it("resets safety score via mutation and updates cache", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(
      () => ({
        data: useScoreResetQuery({ service }),
        audit: useScoreResetAuditQuery({ employeeId: "EMP-01", service }),
        mutation: useResetSafetyScoreMutation({ service }),
      }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.data.isLoading).toBe(false));
    await waitFor(() => expect(result.current.audit.isLoading).toBe(false));

    const resetResult = await result.current.mutation.mutateAsync({
      employeeId: "EMP-01",
      reason: "InvestigationClosed",
      actor: "Admin/Safety Officer",
    });

    expect(resetResult.employee.safetyScore).toBe(100);

    await waitFor(() =>
      expect(
        result.current.data.directory?.employees.find((e) => e.id === "EMP-01")
          ?.safetyScore,
      ).toBe(100),
    );
  });

  it("handles error scenario correctly", async () => {
    const service = createMockSawService({ scenario: "error", storage: null });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(() => useScoreResetQuery({ service }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe(
      "Employee Directory could not be loaded.",
    );
  });
});
