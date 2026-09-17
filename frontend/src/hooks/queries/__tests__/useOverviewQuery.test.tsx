import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryProvider } from "../../../providers/QueryProvider";
import { useOverviewQuery, useResetDemoDataMutation } from "../useOverviewQuery";
import { createMockSawService } from "../../../services/saw-service";

describe("State Management - TanStack Query", () => {
  it("fetches overview data via useOverviewQuery", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(() => useOverviewQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.activeCameras).toBeGreaterThanOrEqual(1);
    expect(result.current.data?.totalCameras).toBeGreaterThanOrEqual(1);
  });

  it("handles resetDemoData mutation and updates cache", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(
      () => ({
        overview: useOverviewQuery(),
        reset: useResetDemoDataMutation(),
      }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.overview.isSuccess).toBe(true));

    await result.current.reset.mutateAsync();

    await waitFor(() => expect(result.current.reset.isSuccess).toBe(true));
    expect(result.current.overview.data).toBeDefined();
  });
});
