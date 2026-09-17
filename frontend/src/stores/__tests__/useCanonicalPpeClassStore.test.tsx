import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCanonicalPpeClassStore } from "../useCanonicalPpeClassStore";

describe("State Management - useCanonicalPpeClassStore", () => {
  beforeEach(() => {
    act(() => {
      useCanonicalPpeClassStore.getState().reset();
    });
  });

  it("initializes with default values", () => {
    const { result } = renderHook(() => useCanonicalPpeClassStore());

    expect(result.current.draft).toBeUndefined();
    expect(result.current.notice).toBeUndefined();
    expect(result.current.searchQuery).toBe("");
    expect(result.current.categoryFilter).toBe("all");
    expect(result.current.statusFilter).toBe("all");
  });

  it("sets and updates draft", () => {
    const { result } = renderHook(() => useCanonicalPpeClassStore());

    act(() => {
      result.current.setDraft({
        yoloIndex: "0",
        rawLabel: "helmet",
        canonicalPpeClass: "Safety Helmet",
        complianceCategory: "compliance",
        active: true,
      });
    });

    expect(result.current.draft?.rawLabel).toBe("helmet");
    expect(result.current.draft?.canonicalPpeClass).toBe("Safety Helmet");

    act(() => {
      result.current.updateDraft("rawLabel", "safety-helmet-custom");
    });

    expect(result.current.draft?.rawLabel).toBe("safety-helmet-custom");
  });

  it("sets notice message", () => {
    const { result } = renderHook(() => useCanonicalPpeClassStore());

    act(() => {
      result.current.setNotice("Mapping saved successfully.");
    });

    expect(result.current.notice).toBe("Mapping saved successfully.");
  });

  it("handles search and filter state changes", () => {
    const { result } = renderHook(() => useCanonicalPpeClassStore());

    act(() => {
      result.current.setSearchQuery("vest");
      result.current.setCategoryFilter("compliance");
      result.current.setStatusFilter("active");
    });

    expect(result.current.searchQuery).toBe("vest");
    expect(result.current.categoryFilter).toBe("compliance");
    expect(result.current.statusFilter).toBe("active");

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.searchQuery).toBe("");
    expect(result.current.categoryFilter).toBe("all");
    expect(result.current.statusFilter).toBe("all");
  });

  it("resets store back to initial values", () => {
    const { result } = renderHook(() => useCanonicalPpeClassStore());

    act(() => {
      result.current.setDraft({
        yoloIndex: "1",
        rawLabel: "vest",
        canonicalPpeClass: "Safety Vest",
        complianceCategory: "compliance",
        active: true,
      });
      result.current.setNotice("Saved");
      result.current.setSearchQuery("test");
      result.current.setCategoryFilter("violation");
      result.current.setStatusFilter("inactive");
    });

    expect(result.current.draft).toBeDefined();
    expect(result.current.notice).toBe("Saved");

    act(() => {
      result.current.reset();
    });

    expect(result.current.draft).toBeUndefined();
    expect(result.current.notice).toBeUndefined();
    expect(result.current.searchQuery).toBe("");
    expect(result.current.categoryFilter).toBe("all");
    expect(result.current.statusFilter).toBe("all");
  });
});
