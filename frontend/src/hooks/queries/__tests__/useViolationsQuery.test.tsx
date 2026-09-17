import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryProvider } from "../../../providers/QueryProvider";
import { useViolationsQuery } from "../useViolationsQuery";
import { createMockSawService } from "../../../services/saw-service";

describe("State Management - useViolationsQuery", () => {
  it("fetches violation history data successfully", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(() => useViolationsQuery({ service }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBeDefined();
    expect(result.current.violations).toBeDefined();
    expect(result.current.violations?.length).toBeGreaterThan(0);
    expect(result.current.cameras?.length).toBeGreaterThan(0);
    expect(result.current.zones?.length).toBeGreaterThan(0);
    expect(result.current.employees?.length).toBeGreaterThan(0);
  });

  it("handles error scenario correctly", async () => {
    const service = createMockSawService({ scenario: "error", storage: null });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(() => useViolationsQuery({ service }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("History Violation tidak dapat dimuat.");
  });
});
