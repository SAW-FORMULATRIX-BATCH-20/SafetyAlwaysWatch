import { describe, expect, it } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryProvider } from "../../../providers/QueryProvider";
import {
  useCanonicalPpeClassesQuery,
  useUpdateCanonicalPpeClassConfigurationMutation,
} from "../useCanonicalPpeClassesQuery";
import { createMockSawService } from "../../../services/saw-service";

describe("State Management - useCanonicalPpeClassesQuery", () => {
  it("fetches configuration via useCanonicalPpeClassesQuery", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(() => useCanonicalPpeClassesQuery({ service }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.configuration).toBeDefined();
    expect(result.current.configuration?.mappings.length).toBeGreaterThan(0);
  });

  it("updates configuration via useUpdateCanonicalPpeClassConfigurationMutation", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const initialConfig = await service.getCanonicalPpeClassConfiguration();

    const { result } = renderHook(
      () => useUpdateCanonicalPpeClassConfigurationMutation({ service }),
      { wrapper },
    );

    const nextConfig = {
      ...initialConfig,
      mappings: [
        ...initialConfig.mappings,
        {
          id: "PPE-99",
          yoloIndex: 99,
          rawLabel: "gloves",
          canonicalPpeClass: "Safety Gloves",
          complianceCategory: "compliance" as const,
          active: true,
        },
      ],
    };

    let updatedConfig: unknown;
    await act(async () => {
      updatedConfig = await result.current.mutateAsync(nextConfig);
    });

    expect(updatedConfig).toBeDefined();
    const currentConfig = await service.getCanonicalPpeClassConfiguration();
    expect(currentConfig.mappings.some((m) => m.id === "PPE-99")).toBe(true);
  });
});
