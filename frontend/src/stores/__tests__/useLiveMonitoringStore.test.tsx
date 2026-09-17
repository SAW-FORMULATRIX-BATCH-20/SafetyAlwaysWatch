import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLiveMonitoringStore } from "../useLiveMonitoringStore";

describe("State Management - useLiveMonitoringStore", () => {
  beforeEach(() => {
    act(() => {
      useLiveMonitoringStore.getState().reset();
    });
  });

  it("initializes with default values", () => {
    const { result } = renderHook(() => useLiveMonitoringStore());

    expect(result.current.selectedCameraId).toBeUndefined();
    expect(result.current.notificationFeed).toBeUndefined();
    expect(result.current.viewMode).toBe("single");
    expect(result.current.showSimulator).toBe(true);
  });

  it("updates selectedCameraId", () => {
    const { result } = renderHook(() => useLiveMonitoringStore());

    act(() => {
      result.current.setSelectedCameraId("CAM-01");
    });

    expect(result.current.selectedCameraId).toBe("CAM-01");
  });

  it("updates notificationFeed", () => {
    const { result } = renderHook(() => useLiveMonitoringStore());

    act(() => {
      result.current.setNotificationFeed("Violation Event EVT-01: 2 simulated recipients recorded.");
    });

    expect(result.current.notificationFeed).toBe(
      "Violation Event EVT-01: 2 simulated recipients recorded."
    );
  });

  it("updates viewMode between single and grid", () => {
    const { result } = renderHook(() => useLiveMonitoringStore());

    expect(result.current.viewMode).toBe("single");

    act(() => {
      result.current.setViewMode("grid");
    });

    expect(result.current.viewMode).toBe("grid");

    act(() => {
      result.current.setViewMode("single");
    });

    expect(result.current.viewMode).toBe("single");
  });

  it("toggles and updates showSimulator state", () => {
    const { result } = renderHook(() => useLiveMonitoringStore());

    expect(result.current.showSimulator).toBe(true);

    act(() => {
      result.current.setShowSimulator(false);
    });

    expect(result.current.showSimulator).toBe(false);

    act(() => {
      result.current.toggleSimulator();
    });

    expect(result.current.showSimulator).toBe(true);
  });

  it("resets store back to initial values", () => {
    const { result } = renderHook(() => useLiveMonitoringStore());

    act(() => {
      result.current.setSelectedCameraId("CAM-02");
      result.current.setNotificationFeed("Test feed");
      result.current.setViewMode("grid");
      result.current.setShowSimulator(false);
    });

    expect(result.current.selectedCameraId).toBe("CAM-02");
    expect(result.current.notificationFeed).toBe("Test feed");
    expect(result.current.viewMode).toBe("grid");
    expect(result.current.showSimulator).toBe(false);

    act(() => {
      result.current.reset();
    });

    expect(result.current.selectedCameraId).toBeUndefined();
    expect(result.current.notificationFeed).toBeUndefined();
    expect(result.current.viewMode).toBe("single");
    expect(result.current.showSimulator).toBe(true);
  });
});
