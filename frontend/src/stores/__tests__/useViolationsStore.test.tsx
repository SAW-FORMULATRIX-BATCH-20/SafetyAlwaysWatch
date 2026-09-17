import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useViolationsStore } from "../useViolationsStore";

describe("State Management - useViolationsStore", () => {
  beforeEach(() => {
    act(() => {
      useViolationsStore.getState().reset();
    });
  });

  it("initializes with default filter and pagination values", () => {
    const { result } = renderHook(() => useViolationsStore());

    expect(result.current.query).toBe("");
    expect(result.current.zoneId).toBe("all");
    expect(result.current.cameraId).toBe("all");
    expect(result.current.employeeId).toBe("all");
    expect(result.current.department).toBe("all");
    expect(result.current.status).toBe("all");
    expect(result.current.startDate).toBe("");
    expect(result.current.endDate).toBe("");
    expect(result.current.sort).toBe("oldest");
    expect(result.current.page).toBe(1);
    expect(result.current.selectedId).toBeUndefined();
  });

  it("updates individual filter values and resets page/selectedId", () => {
    const { result } = renderHook(() => useViolationsStore());

    act(() => {
      result.current.setPage(3);
      result.current.setSelectedId("VIO-01");
    });

    expect(result.current.page).toBe(3);
    expect(result.current.selectedId).toBe("VIO-01");

    act(() => {
      result.current.setQuery("Hardhat");
    });

    expect(result.current.query).toBe("Hardhat");
    expect(result.current.page).toBe(1);
    expect(result.current.selectedId).toBeUndefined();

    act(() => {
      result.current.setZoneId("ZON-02");
      result.current.setCameraId("CAM-01");
      result.current.setEmployeeId("EMP-02");
      result.current.setDepartment("Welding");
      result.current.setStatus("confirmed");
      result.current.setStartDate("2026-09-01");
      result.current.setEndDate("2026-09-10");
      result.current.setSort("newest");
    });

    expect(result.current.zoneId).toBe("ZON-02");
    expect(result.current.cameraId).toBe("CAM-01");
    expect(result.current.employeeId).toBe("EMP-02");
    expect(result.current.department).toBe("Welding");
    expect(result.current.status).toBe("confirmed");
    expect(result.current.startDate).toBe("2026-09-01");
    expect(result.current.endDate).toBe("2026-09-10");
    expect(result.current.sort).toBe("newest");
  });

  it("clears filters back to default values", () => {
    const { result } = renderHook(() => useViolationsStore());

    act(() => {
      result.current.setQuery("Test");
      result.current.setZoneId("ZON-03");
      result.current.setPage(2);
      result.current.setSelectedId("VIO-02");
    });

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.query).toBe("");
    expect(result.current.zoneId).toBe("all");
    expect(result.current.page).toBe(1);
    expect(result.current.selectedId).toBeUndefined();
  });
});
