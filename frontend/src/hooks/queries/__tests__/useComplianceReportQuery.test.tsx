import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryProvider } from "../../../providers/QueryProvider";
import { useComplianceReportQuery } from "../useComplianceReportQuery";
import { createMockSawService } from "../../../services/saw-service";

describe("State Management - useComplianceReportQuery", () => {
  it("fetches compliance report data successfully", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(() => useComplianceReportQuery({ service }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.report).toBeDefined();
    expect(result.current.report?.observations.length).toBeGreaterThan(0);
    expect(result.current.report?.zones.length).toBeGreaterThan(0);
    expect(result.current.report?.employees.length).toBeGreaterThan(0);
  });

  it("handles error scenario correctly", async () => {
    const service = createMockSawService({ scenario: "error", storage: null });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(() => useComplianceReportQuery({ service }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Report PPE Compliance tidak dapat dimuat.");
  });
});
