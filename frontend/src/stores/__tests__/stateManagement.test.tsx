import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuthStore } from "../useAuthStore";
import { useUIStore } from "../useUIStore";

describe("State Management - Zustand Stores", () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.getState().logout();
    });
  });

  it("manages persona role and profile in useAuthStore", () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.role).toBeUndefined();
    expect(result.current.persona).toBeUndefined();

    act(() => {
      result.current.setRole("admin");
    });

    expect(result.current.role).toBe("admin");
    expect(result.current.persona?.name).toBe("Admin/Safety Officer");
    expect(result.current.persona?.landingPath).toBe("/overview");

    act(() => {
      result.current.logout();
    });

    expect(result.current.role).toBeUndefined();
    expect(result.current.persona).toBeUndefined();
  });

  it("manages toasts and UI notifications in useUIStore", () => {
    const { result } = renderHook(() => useUIStore());

    expect(result.current.toasts).toHaveLength(0);

    act(() => {
      result.current.addToast({
        title: "Test Toast",
        description: "Operation successful",
        type: "success",
      });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe("Test Toast");
    expect(result.current.toasts[0].type).toBe("success");

    const toastId = result.current.toasts[0].id;
    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });
});
