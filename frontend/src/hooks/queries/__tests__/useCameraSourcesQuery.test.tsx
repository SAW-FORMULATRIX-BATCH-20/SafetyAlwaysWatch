import { describe, expect, it } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryProvider } from "../../../providers/QueryProvider";
import {
  useCameraSourcesQuery,
  useUpdateCameraMetadataMutation,
} from "../useCameraSourcesQuery";
import { createMockSawService } from "../../../services/saw-service";

describe("State Management - useCameraSourcesQuery", () => {
  it("fetches cameras and zones via useCameraSourcesQuery", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(() => useCameraSourcesQuery({ service }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.cameras).toBeDefined();
    expect(result.current.cameras!.length).toBeGreaterThan(0);
    expect(result.current.zones).toBeDefined();
    expect(result.current.zones!.length).toBeGreaterThan(0);
  });

  it("updates camera metadata via useUpdateCameraMetadataMutation", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(
      () => useUpdateCameraMetadataMutation({ service }),
      { wrapper },
    );

    let updatedCamera: unknown;
    await act(async () => {
      updatedCamera = await result.current.mutateAsync({
        id: "CAM-01",
        metadata: {
          name: "Updated Gate Camera",
          location: "Main Gate Zone A",
        },
      });
    });

    expect(updatedCamera).toBeDefined();
    expect((updatedCamera as { name: string }).name).toBe("Updated Gate Camera");

    const cameras = await service.getCameras();
    const found = cameras.find((c) => c.id === "CAM-01");
    expect(found?.name).toBe("Updated Gate Camera");
    expect(found?.location).toBe("Main Gate Zone A");
  });

  it("reports error when service fails", async () => {
    const service = createMockSawService({ scenario: "error", storage: null });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(() => useCameraSourcesQuery({ service }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Camera Sources could not be loaded.");
  });
});
