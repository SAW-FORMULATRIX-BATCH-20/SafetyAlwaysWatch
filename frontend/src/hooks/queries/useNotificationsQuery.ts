import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSawService } from "../../providers/ServiceContext";
import type {
  EmployeeDirectoryCapability,
  HazardousZone,
  HazardousZoneCapability,
  NotificationCapability,
  NotificationRecipient,
  NotificationRecipientInput,
  NotificationSimulationLog,
} from "../../services/saw-service";

export type NotificationsService = NotificationCapability &
  HazardousZoneCapability &
  EmployeeDirectoryCapability;

export type NotificationsData = {
  recipients: NotificationRecipient[];
  logs: NotificationSimulationLog[];
  zones: HazardousZone[];
  departments: string[];
};

export const notificationKeys = {
  all: ["notifications"] as const,
  data: () => ["notifications", "data"] as const,
  recipients: () => ["notifications", "recipients"] as const,
  logs: () => ["notifications", "logs"] as const,
  zones: () => ["notifications", "zones"] as const,
  directory: () => ["notifications", "directory"] as const,
};

export interface UseNotificationsQueryOptions {
  service?: NotificationsService;
}

function resolveService(
  propService?: NotificationsService,
): NotificationsService {
  try {
    const sawService = useSawService();
    return (propService ?? sawService) as unknown as NotificationsService;
  } catch {
    if (!propService) {
      throw new Error(
        "Notifications hook requires a ServiceProvider or a service prop",
      );
    }
    return propService;
  }
}

export function useNotificationsQuery({
  service: propService,
}: UseNotificationsQueryOptions = {}) {
  const service = resolveService(propService);

  const query = useQuery<NotificationsData, Error>({
    queryKey: notificationKeys.data(),
    queryFn: async () => {
      const [recipients, logs, zones, directory] = await Promise.all([
        service.getNotificationRecipients(),
        service.getNotificationSimulationLogs(),
        service.getHazardousZone(),
        service.getEmployeeDirectory(),
      ]);
      const departments = [
        ...new Set(
          directory.employees.map((employee) => employee.departmentId),
        ),
      ].sort();
      return {
        recipients,
        logs,
        zones,
        departments,
      };
    },
  });

  return {
    data: query.data,
    recipients: query.data?.recipients,
    logs: query.data?.logs,
    zones: query.data?.zones ?? [],
    departments: query.data?.departments ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useSaveNotificationRecipientMutation({
  service: propService,
}: UseNotificationsQueryOptions = {}) {
  const service = resolveService(propService);
  const queryClient = useQueryClient();

  return useMutation<NotificationRecipient, Error, NotificationRecipientInput>({
    mutationFn: (input) => service.saveNotificationRecipient(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useSimulateNotificationMutation({
  service: propService,
}: UseNotificationsQueryOptions = {}) {
  const service = resolveService(propService);
  const queryClient = useQueryClient();

  return useMutation<
    NotificationSimulationLog,
    Error,
    { recipientId: string; deliveryStatus: "sent" | "failed" }
  >({
    mutationFn: ({ recipientId, deliveryStatus }) =>
      service.simulateNotification(recipientId, deliveryStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useDeleteNotificationRecipientMutation({
  service: propService,
}: UseNotificationsQueryOptions = {}) {
  const service = resolveService(propService);
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.deleteNotificationRecipient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
