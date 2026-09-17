import { describe, expect, it } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryProvider } from "../../../providers/QueryProvider";
import {
  useDeactivateHazardousZoneMutation,
  useDeleteHazardousZoneMutation,
  useHazardousZonesQuery,
  useSaveHazardousZoneMutation,
} from "../useHazardousZonesQuery";
import { createMockSawService } from "../../../services/saw-service";

describe("State Management - useHazardousZonesQuery", () => {
  it("fetches cameras, zones, and configuration via useHazardousZonesQuery", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(() => useHazardousZonesQuery({ service }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.cameras).toBeDefined();
    expect(result.current.cameras!.length).toBeGreaterThan(0);
    expect(result.current.zones).toBeDefined();
    expect(result.current.zones!.length).toBeGreaterThan(0);
    expect(result.current.configuration).toBeDefined();
    expect(result.current.configuration?.mappings.length).toBeGreaterThan(0);
  });

  it("saves a hazardous zone via useSaveHazardousZoneMutation", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(
      () => useSaveHazardousZoneMutation({ service }),
      { wrapper },
    );

    let savedZone: unknown;
    await act(async () => {
      savedZone = await result.current.mutateAsync({
        name: "Test New Zone",
        cameraId: "CAM-01",
        active: true,
        bounds: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        requiredCanonicalPpeClasses: ["Safety Helmet"],
        supervisorAreas: ["Production"],
      });
    });

    expect(savedZone).toBeDefined();
    expect((savedZone as { name: string }).name).toBe("Test New Zone");

    const allZones = await service.getHazardousZone();
    expect(allZones.some((z) => z.name === "Test New Zone")).toBe(true);
  });

  it("deactivates a hazardous zone via useDeactivateHazardousZoneMutation", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(
      () => useDeactivateHazardousZoneMutation({ service }),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync("ZON-01");
    });

    const allZones = await service.getHazardousZone();
    const targetZone = allZones.find((z) => z.id === "ZON-01");
    expect(targetZone?.active).toBe(false);
  });

  it("deletes a hazardous zone without violation history via useDeleteHazardousZoneMutation", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    // First, save a new zone without violation history
    const newZone = await service.saveHazardousZone({
      name: "Temporary Zone",
      cameraId: "CAM-01",
      active: true,
      bounds: { x: 0.3, y: 0.3, width: 0.1, height: 0.1 },
      requiredCanonicalPpeClasses: ["Safety Vest"],
      supervisorAreas: ["Production"],
    });

    const { result } = renderHook(
      () => useDeleteHazardousZoneMutation({ service }),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync(newZone.id);
    });

    const allZones = await service.getHazardousZone();
    expect(allZones.some((z) => z.id === newZone.id)).toBe(false);
  });
});
