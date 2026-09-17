import { describe, expect, it } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryProvider } from "../../../providers/QueryProvider";
import {
  useLiveMonitoringQuery,
  useSelectMonitoringScenarioMutation,
  useProcessMonitoringFrameMutation,
} from "../useLiveMonitoringQuery";
import { createMockSawService } from "../../../services/saw-service";

describe("State Management - useLiveMonitoringQuery", () => {
  it("fetches cameras, zones, simulation, and settings via useLiveMonitoringQuery", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(() => useLiveMonitoringQuery({ service }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.cameras).toBeDefined();
    expect(result.current.cameras!.length).toBeGreaterThan(0);
    expect(result.current.zones).toBeDefined();
    expect(result.current.zones!.length).toBeGreaterThan(0);
    expect(result.current.simulation).toBeDefined();
    expect(result.current.settings).toBeDefined();
  });

  it("selects monitoring scenario via useSelectMonitoringScenarioMutation", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(
      () => useSelectMonitoringScenarioMutation({ service }),
      { wrapper },
    );

    let nextSimulation: unknown;
    await act(async () => {
      nextSimulation = await result.current.mutateAsync("missing-ppe");
    });

    expect(nextSimulation).toBeDefined();
    expect((nextSimulation as { state: string }).state).toBe("episode");
  });

  it("processes monitoring frame via useProcessMonitoringFrameMutation", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    await service.selectMonitoringScenario("missing-ppe");

    const { result } = renderHook(
      () => useProcessMonitoringFrameMutation({ service }),
      { wrapper },
    );

    let processed: unknown;
    await act(async () => {
      processed = await result.current.mutateAsync({
        confidence: 0.96,
        isCompliant: false,
        elapsedSeconds: 5,
      });
    });

    expect(processed).toBeDefined();
    expect((processed as { episodeStatus: string }).episodeStatus).toBe("confirmed");
  });

  it("reports error when service fails", async () => {
    const service = createMockSawService({ scenario: "error", storage: null });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(() => useLiveMonitoringQuery({ service }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
