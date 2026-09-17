import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useComplianceReportStore } from "../useComplianceReportStore";

describe("State Management - useComplianceReportStore", () => {
  beforeEach(() => {
    act(() => {
      useComplianceReportStore.getState().reset();
    });
  });

  it("initializes with default filter values", () => {
    const { result } = renderHook(() => useComplianceReportStore());

    expect(result.current.zoneId).toBe("all");
    expect(result.current.departmentId).toBe("all");
    expect(result.current.employeeId).toBe("all");
    expect(result.current.fromDate).toBe("");
    expect(result.current.toDate).toBe("");
  });

  it("updates individual filter values", () => {
    const { result } = renderHook(() => useComplianceReportStore());

    act(() => {
      result.current.setZoneId("ZON-01");
      result.current.setDepartmentId("Warehouse");
      result.current.setEmployeeId("EMP-01");
      result.current.setFromDate("2026-09-01");
      result.current.setToDate("2026-09-10");
    });

    expect(result.current.zoneId).toBe("ZON-01");
    expect(result.current.departmentId).toBe("Warehouse");
    expect(result.current.employeeId).toBe("EMP-01");
    expect(result.current.fromDate).toBe("2026-09-01");
    expect(result.current.toDate).toBe("2026-09-10");
  });

  it("clears filters back to default values", () => {
    const { result } = renderHook(() => useComplianceReportStore());

    act(() => {
      result.current.setZoneId("ZON-02");
      result.current.setDepartmentId("Logistics");
      result.current.setEmployeeId("EMP-05");
      result.current.setFromDate("2026-09-05");
      result.current.setToDate("2026-09-06");
    });

    expect(result.current.zoneId).toBe("ZON-02");

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.zoneId).toBe("all");
    expect(result.current.departmentId).toBe("all");
    expect(result.current.employeeId).toBe("all");
    expect(result.current.fromDate).toBe("");
    expect(result.current.toDate).toBe("");
  });

  it("resets store back to initial values via reset()", () => {
    const { result } = renderHook(() => useComplianceReportStore());

    act(() => {
      result.current.setZoneId("ZON-03");
      result.current.setDepartmentId("Fabrication");
    });

    expect(result.current.zoneId).toBe("ZON-03");

    act(() => {
      result.current.reset();
    });

    expect(result.current.zoneId).toBe("all");
    expect(result.current.departmentId).toBe("all");
  });
});
