import { describe, expect, it } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryProvider } from "../../../providers/QueryProvider";
import {
  useSafetyParametersQuery,
  useUpdateSafetyParametersMutation,
} from "../useSafetyParametersQuery";
import { createMockSawService } from "../../../services/saw-service";

describe("State Management - useSafetyParametersQuery", () => {
  it("fetches safety settings via useSafetyParametersQuery", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(() => useSafetyParametersQuery({ service }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.settings).toBeDefined();
    expect(result.current.settings?.initialScore).toBe(100);
    expect(result.current.settings?.escalationThreshold).toBe(60);
  });

  it("updates safety settings via useUpdateSafetyParametersMutation", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const initialSettings = await service.getSafetySettings();

    const { result } = renderHook(
      () => ({
        query: useSafetyParametersQuery({ service }),
        mutation: useUpdateSafetyParametersMutation({ service }),
      }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.query.isLoading).toBe(false));

    const updatedTarget = {
      ...initialSettings,
      escalationThreshold: 75,
    };

    let updatedResult: unknown;
    await act(async () => {
      updatedResult = await result.current.mutation.mutateAsync(updatedTarget);
    });

    expect(updatedResult).toBeDefined();
    const currentPersisted = await service.getSafetySettings();
    expect(currentPersisted.escalationThreshold).toBe(75);
    await waitFor(() => {
      expect(result.current.query.settings?.escalationThreshold).toBe(75);
    });
  });

  it("handles mutation failure when updateSafetySettings rejects", async () => {
    const service = createMockSawService({ scenario: "ready" });
    service.updateSafetySettings = async () => {
      throw new Error("Update failed due to network error");
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(
      () => useUpdateSafetyParametersMutation({ service }),
      { wrapper },
    );

    const initialSettings = await service.getSafetySettings();

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          ...initialSettings,
          initialScore: 90,
        });
      }),
    ).rejects.toThrow("Update failed due to network error");
  });
});
