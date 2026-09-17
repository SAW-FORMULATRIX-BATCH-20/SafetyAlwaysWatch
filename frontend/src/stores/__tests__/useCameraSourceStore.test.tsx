import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCameraSourceStore } from "../useCameraSourceStore";

describe("State Management - useCameraSourceStore", () => {
  beforeEach(() => {
    act(() => {
      useCameraSourceStore.getState().reset();
    });
  });

  it("initializes with default values", () => {
    const { result } = renderHook(() => useCameraSourceStore());

    expect(result.current.searchTerm).toBe("");
    expect(result.current.statusFilter).toBe("all");
    expect(result.current.selectedCameraId).toBeUndefined();
    expect(result.current.notice).toBeUndefined();
  });

  it("updates searchTerm", () => {
    const { result } = renderHook(() => useCameraSourceStore());

    act(() => {
      result.current.setSearchTerm("Production");
    });

    expect(result.current.searchTerm).toBe("Production");
  });

  it("updates statusFilter", () => {
    const { result } = renderHook(() => useCameraSourceStore());

    act(() => {
      result.current.setStatusFilter("online");
    });

    expect(result.current.statusFilter).toBe("online");

    act(() => {
      result.current.setStatusFilter("offline");
    });

    expect(result.current.statusFilter).toBe("offline");
  });

  it("updates selectedCameraId and notice", () => {
    const { result } = renderHook(() => useCameraSourceStore());

    act(() => {
      result.current.setSelectedCameraId("CAM-01");
      result.current.setNotice("Camera Source metadata updated.");
    });

    expect(result.current.selectedCameraId).toBe("CAM-01");
    expect(result.current.notice).toBe("Camera Source metadata updated.");
  });

  it("resets store back to initial values", () => {
    const { result } = renderHook(() => useCameraSourceStore());

    act(() => {
      result.current.setSearchTerm("Production");
      result.current.setStatusFilter("degraded");
      result.current.setSelectedCameraId("CAM-02");
      result.current.setNotice("Updated");
    });

    expect(result.current.searchTerm).toBe("Production");
    expect(result.current.statusFilter).toBe("degraded");
    expect(result.current.selectedCameraId).toBe("CAM-02");
    expect(result.current.notice).toBe("Updated");

    act(() => {
      result.current.reset();
    });

    expect(result.current.searchTerm).toBe("");
    expect(result.current.statusFilter).toBe("all");
    expect(result.current.selectedCameraId).toBeUndefined();
    expect(result.current.notice).toBeUndefined();
  });
});
