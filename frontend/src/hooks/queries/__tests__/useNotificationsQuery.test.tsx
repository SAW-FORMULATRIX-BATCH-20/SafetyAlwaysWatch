import { describe, expect, it } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryProvider } from "../../../providers/QueryProvider";
import {
  useNotificationsQuery,
  useSaveNotificationRecipientMutation,
  useSimulateNotificationMutation,
  useDeleteNotificationRecipientMutation,
} from "../useNotificationsQuery";
import { createMockSawService } from "../../../services/saw-service";

describe("State Management - useNotificationsQuery", () => {
  it("fetches notifications data successfully", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(() => useNotificationsQuery({ service }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBeDefined();
    expect(result.current.recipients).toBeDefined();
    expect(result.current.recipients!.length).toBeGreaterThan(0);
    expect(result.current.logs).toBeDefined();
    expect(result.current.zones.length).toBeGreaterThan(0);
    expect(result.current.departments.length).toBeGreaterThan(0);
  });

  it("handles error scenario correctly", async () => {
    const service = createMockSawService({ scenario: "error", storage: null });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(() => useNotificationsQuery({ service }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe(
      "Notification configuration could not be loaded.",
    );
  });

  it("saves a notification recipient via mutation", async () => {
    const service = createMockSawService({ scenario: "ready", storage: null });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(
      () => useSaveNotificationRecipientMutation({ service }),
      { wrapper },
    );

    let savedRecipient: unknown;
    await act(async () => {
      savedRecipient = await result.current.mutateAsync({
        name: "Security Lead",
        chatId: "987654321",
        role: "Area Supervisor",
        scope: { type: "department", departmentId: "Maintenance" },
      });
    });

    expect(savedRecipient).toBeDefined();
    expect((savedRecipient as { name: string }).name).toBe("Security Lead");

    const recipients = await service.getNotificationRecipients();
    expect(recipients.some((r) => r.name === "Security Lead")).toBe(true);
  });

  it("simulates a notification via mutation", async () => {
    const service = createMockSawService({ scenario: "ready", storage: null });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(
      () => useSimulateNotificationMutation({ service }),
      { wrapper },
    );

    const recipients = await service.getNotificationRecipients();
    const targetRecipient = recipients[0];

    let log: unknown;
    await act(async () => {
      log = await result.current.mutateAsync({
        recipientId: targetRecipient.id,
        deliveryStatus: "sent",
      });
    });

    expect(log).toBeDefined();
    expect((log as { deliveryStatus: string }).deliveryStatus).toBe("sent");
  });

  it("deletes a notification recipient via mutation", async () => {
    const service = createMockSawService({ scenario: "ready", storage: null });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(
      () => useDeleteNotificationRecipientMutation({ service }),
      { wrapper },
    );

    const recipients = await service.getNotificationRecipients();
    const target = recipients[0];

    await act(async () => {
      await result.current.mutateAsync(target.id);
    });

    const updatedRecipients = await service.getNotificationRecipients();
    expect(updatedRecipients.some((r) => r.id === target.id)).toBe(false);
  });
});
