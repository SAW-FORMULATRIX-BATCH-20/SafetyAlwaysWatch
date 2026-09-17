import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHazardousZoneStore } from "../useHazardousZoneStore";

describe("State Management - useHazardousZoneStore", () => {
  beforeEach(() => {
    act(() => {
      useHazardousZoneStore.getState().reset();
    });
  });

  it("initializes with default camera and filter values", () => {
    const { result } = renderHook(() => useHazardousZoneStore());

    expect(result.current.selectedCameraId).toBeUndefined();
    expect(result.current.zoneStatusFilter).toBe("all");
  });

  it("updates selectedCameraId", () => {
    const { result } = renderHook(() => useHazardousZoneStore());

    act(() => {
      result.current.setSelectedCameraId("CAM-01");
    });

    expect(result.current.selectedCameraId).toBe("CAM-01");
  });

  it("updates zoneStatusFilter", () => {
    const { result } = renderHook(() => useHazardousZoneStore());

    act(() => {
      result.current.setZoneStatusFilter("active");
    });

    expect(result.current.zoneStatusFilter).toBe("active");

    act(() => {
      result.current.setZoneStatusFilter("inactive");
    });

    expect(result.current.zoneStatusFilter).toBe("inactive");
  });

  it("resets store back to initial values", () => {
    const { result } = renderHook(() => useHazardousZoneStore());

    act(() => {
      result.current.setSelectedCameraId("CAM-02");
      result.current.setZoneStatusFilter("active");
    });

    expect(result.current.selectedCameraId).toBe("CAM-02");
    expect(result.current.zoneStatusFilter).toBe("active");

    act(() => {
      result.current.reset();
    });

    expect(result.current.selectedCameraId).toBeUndefined();
    expect(result.current.zoneStatusFilter).toBe("all");
  });
});
