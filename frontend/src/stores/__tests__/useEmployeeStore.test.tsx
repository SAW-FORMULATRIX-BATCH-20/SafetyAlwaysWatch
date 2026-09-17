import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEmployeeStore } from "../useEmployeeStore";

describe("State Management - useEmployeeStore", () => {
  beforeEach(() => {
    act(() => {
      useEmployeeStore.getState().clearFilters();
    });
  });

  it("initializes with default filter and pagination values", () => {
    const { result } = renderHook(() => useEmployeeStore());

    expect(result.current.query).toBe("");
    expect(result.current.department).toBe("all");
    expect(result.current.status).toBe("all");
    expect(result.current.sort).toBe("name-asc");
    expect(result.current.page).toBe(1);
  });

  it("updates search query and resets page to 1", () => {
    const { result } = renderHook(() => useEmployeeStore());

    act(() => {
      result.current.setPage(3);
    });
    expect(result.current.page).toBe(3);

    act(() => {
      result.current.setQuery("John");
    });
    expect(result.current.query).toBe("John");
    expect(result.current.page).toBe(1);
  });

  it("updates department filter and resets page to 1", () => {
    const { result } = renderHook(() => useEmployeeStore());

    act(() => {
      result.current.setPage(2);
      result.current.setDepartment("Warehouse");
    });

    expect(result.current.department).toBe("Warehouse");
    expect(result.current.page).toBe(1);
  });

  it("updates safety score status filter and sort option", () => {
    const { result } = renderHook(() => useEmployeeStore());

    act(() => {
      result.current.setStatus("critical");
      result.current.setSort("score-desc");
    });

    expect(result.current.status).toBe("critical");
    expect(result.current.sort).toBe("score-desc");
  });

  it("supports functional and direct page updates", () => {
    const { result } = renderHook(() => useEmployeeStore());

    act(() => {
      result.current.setPage((prev) => prev + 2);
    });
    expect(result.current.page).toBe(3);

    act(() => {
      result.current.resetPage();
    });
    expect(result.current.page).toBe(1);
  });

  it("clears all filters and resets page with clearFilters", () => {
    const { result } = renderHook(() => useEmployeeStore());

    act(() => {
      result.current.setQuery("Jane");
      result.current.setDepartment("Production");
      result.current.setStatus("warning");
      result.current.setSort("score-asc");
      result.current.setPage(4);
    });

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.query).toBe("");
    expect(result.current.department).toBe("all");
    expect(result.current.status).toBe("all");
    expect(result.current.sort).toBe("name-asc");
    expect(result.current.page).toBe(1);
  });
});
