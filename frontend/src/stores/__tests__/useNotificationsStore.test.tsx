import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNotificationsStore } from "../useNotificationsStore";

describe("State Management - useNotificationsStore", () => {
  beforeEach(() => {
    act(() => {
      useNotificationsStore.getState().reset();
    });
  });

  it("initializes with default values", () => {
    const { result } = renderHook(() => useNotificationsStore());

    expect(result.current.adding).toBe(false);
    expect(result.current.name).toBe("");
    expect(result.current.chatId).toBe("");
    expect(result.current.role).toBe("Human Resources (HR)");
    expect(result.current.scopeType).toBe("global");
    expect(result.current.scopeTarget).toBe("");
    expect(result.current.notice).toBeUndefined();
    expect(result.current.error).toBeUndefined();

    // Filters and pagination defaults
    expect(result.current.recipientSearch).toBe("");
    expect(result.current.recipientRoleFilter).toBe("all");
    expect(result.current.recipientPage).toBe(1);
    expect(result.current.recipientPageSize).toBe(6);
    expect(result.current.logStatusFilter).toBe("all");
    expect(result.current.logSearch).toBe("");
  });

  it("updates adding state and input fields", () => {
    const { result } = renderHook(() => useNotificationsStore());

    act(() => {
      result.current.setAdding(true);
      result.current.setName("Operations HR");
      result.current.setChatId("998877");
    });

    expect(result.current.adding).toBe(true);
    expect(result.current.name).toBe("Operations HR");
    expect(result.current.chatId).toBe("998877");
  });

  it("automatically adjusts scopeType when role changes", () => {
    const { result } = renderHook(() => useNotificationsStore());

    act(() => {
      result.current.setRole("Area Supervisor");
    });

    expect(result.current.role).toBe("Area Supervisor");
    expect(result.current.scopeType).toBe("zone");
    expect(result.current.scopeTarget).toBe("");

    act(() => {
      result.current.setScopeType("department");
      result.current.setScopeTarget("Maintenance");
    });

    expect(result.current.scopeType).toBe("department");
    expect(result.current.scopeTarget).toBe("Maintenance");

    act(() => {
      result.current.setRole("Human Resources (HR)");
    });

    expect(result.current.role).toBe("Human Resources (HR)");
    expect(result.current.scopeType).toBe("global");
    expect(result.current.scopeTarget).toBe("");
  });

  it("manages recipient search and pagination", () => {
    const { result } = renderHook(() => useNotificationsStore());

    act(() => {
      result.current.setRecipientPage(3);
    });
    expect(result.current.recipientPage).toBe(3);

    // Searching should auto-reset page to 1
    act(() => {
      result.current.setRecipientSearch("Supervisor");
    });
    expect(result.current.recipientSearch).toBe("Supervisor");
    expect(result.current.recipientPage).toBe(1);

    // Changing role filter should auto-reset page to 1
    act(() => {
      result.current.setRecipientPage(2);
      result.current.setRecipientRoleFilter("Area Supervisor");
    });
    expect(result.current.recipientRoleFilter).toBe("Area Supervisor");
    expect(result.current.recipientPage).toBe(1);

    // Resetting recipient filters
    act(() => {
      result.current.resetRecipientFilters();
    });
    expect(result.current.recipientSearch).toBe("");
    expect(result.current.recipientRoleFilter).toBe("all");
    expect(result.current.recipientPage).toBe(1);
  });

  it("manages log filters and log search", () => {
    const { result } = renderHook(() => useNotificationsStore());

    act(() => {
      result.current.setLogStatusFilter("failed");
      result.current.setLogSearch("EVT-123");
    });

    expect(result.current.logStatusFilter).toBe("failed");
    expect(result.current.logSearch).toBe("EVT-123");

    act(() => {
      result.current.resetLogFilters();
    });

    expect(result.current.logStatusFilter).toBe("all");
    expect(result.current.logSearch).toBe("");
  });

  it("sets notice and error messages", () => {
    const { result } = renderHook(() => useNotificationsStore());

    act(() => {
      result.current.setNotice("Recipient added.");
      result.current.setError("Something went wrong.");
    });

    expect(result.current.notice).toBe("Recipient added.");
    expect(result.current.error).toBe("Something went wrong.");
  });

  it("resets form fields without losing notice", () => {
    const { result } = renderHook(() => useNotificationsStore());

    act(() => {
      result.current.setAdding(true);
      result.current.setName("Supervisor Maintenance");
      result.current.setChatId("12345");
      result.current.setNotice("Saved successfully");
      result.current.resetForm();
    });

    expect(result.current.adding).toBe(false);
    expect(result.current.name).toBe("");
    expect(result.current.chatId).toBe("");
    expect(result.current.notice).toBe("Saved successfully");
    expect(result.current.recipientPage).toBe(1);
  });

  it("resets the entire store to initial state", () => {
    const { result } = renderHook(() => useNotificationsStore());

    act(() => {
      result.current.setAdding(true);
      result.current.setName("Shift Lead");
      result.current.setNotice("Saved");
      result.current.setError("Error");
      result.current.setRecipientSearch("test");
      result.current.setLogStatusFilter("sent");
      result.current.reset();
    });

    expect(result.current.adding).toBe(false);
    expect(result.current.name).toBe("");
    expect(result.current.notice).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(result.current.recipientSearch).toBe("");
    expect(result.current.logStatusFilter).toBe("all");
  });
});
