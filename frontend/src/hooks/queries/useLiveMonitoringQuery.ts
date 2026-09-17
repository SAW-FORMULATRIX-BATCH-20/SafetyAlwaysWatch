import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cameraScopeFor, type Persona } from "../../application/personas";
import { useSawService } from "../../providers/ServiceContext";
import type {
  Camera,
  CameraScope,
  CameraSourceCapability,
  HazardousZone,
  HazardousZoneCapability,
  MonitoringCapability,
  MonitoringFrame,
  MonitoringScenario,
  MonitoringSimulation,
  NotificationCapability,
  NotificationSimulationLog,
  SafetySettings,
  SafetySettingsCapability,
} from "../../services/saw-service";
import { useAuthStore } from "../../stores/useAuthStore";

export type LiveMonitoringService = CameraSourceCapability &
  HazardousZoneCapability &
  MonitoringCapability &
  NotificationCapability &
  SafetySettingsCapability;

export const liveMonitoringKeys = {
  all: ["live-monitoring"] as const,
  cameras: (scope?: CameraScope) => ["live-monitoring", "cameras", scope] as const,
  zones: () => ["live-monitoring", "zones"] as const,
  simulation: () => ["live-monitoring", "simulation"] as const,
  settings: () => ["live-monitoring", "settings"] as const,
  notificationLogs: () => ["live-monitoring", "notification-logs"] as const,
};

export interface UseLiveMonitoringQueryOptions {
  persona?: Persona;
  service?: LiveMonitoringService;
}

function useResolvedService(propService?: LiveMonitoringService): LiveMonitoringService {
  try {
    const sawService = useSawService();
    return (propService ?? sawService) as unknown as LiveMonitoringService;
  } catch {
    if (!propService) {
      throw new Error("useLiveMonitoringQuery requires a ServiceProvider or a service prop");
    }
    return propService;
  }
}

export function useLiveMonitoringQuery({
  persona: propPersona,
  service: propService,
}: UseLiveMonitoringQueryOptions = {}) {
  const service = useResolvedService(propService);
  const authPersona = useAuthStore((state) => state.persona);
  const persona = propPersona ?? authPersona;
  const scope = persona ? cameraScopeFor(persona) : undefined;

  const camerasQuery = useQuery<Camera[], Error>({
    queryKey: liveMonitoringKeys.cameras(scope),
    queryFn: () => service.getCameras(scope),
  });

  const zonesQuery = useQuery<HazardousZone[], Error>({
    queryKey: liveMonitoringKeys.zones(),
    queryFn: () => service.getHazardousZone(),
  });

  const simulationQuery = useQuery<MonitoringSimulation, Error>({
    queryKey: liveMonitoringKeys.simulation(),
    queryFn: () => service.getMonitoringSimulation(),
  });

  const settingsQuery = useQuery<SafetySettings, Error>({
    queryKey: liveMonitoringKeys.settings(),
    queryFn: () => service.getSafetySettings(),
  });

  const notificationLogsQuery = useQuery<NotificationSimulationLog[], Error>({
    queryKey: liveMonitoringKeys.notificationLogs(),
    queryFn: () => service.getNotificationSimulationLogs(),
  });

  const isLoading =
    camerasQuery.isLoading ||
    zonesQuery.isLoading ||
    simulationQuery.isLoading ||
    settingsQuery.isLoading ||
    notificationLogsQuery.isLoading;

  const isError =
    camerasQuery.isError ||
    zonesQuery.isError ||
    simulationQuery.isError ||
    settingsQuery.isError ||
    notificationLogsQuery.isError;

  const error =
    camerasQuery.error ||
    zonesQuery.error ||
    simulationQuery.error ||
    settingsQuery.error ||
    notificationLogsQuery.error;

  return {
    cameras: camerasQuery.data,
    zones: zonesQuery.data,
    simulation: simulationQuery.data,
    settings: settingsQuery.data,
    notificationLogs: notificationLogsQuery.data,
    isLoading,
    isError,
    error,
    refetch: async () => {
      await Promise.all([
        camerasQuery.refetch(),
        zonesQuery.refetch(),
        simulationQuery.refetch(),
        settingsQuery.refetch(),
        notificationLogsQuery.refetch(),
      ]);
    },
  };
}

export function useSelectMonitoringScenarioMutation({
  service: propService,
}: {
  service?: LiveMonitoringService;
} = {}) {
  const service = useResolvedService(propService);
  const queryClient = useQueryClient();

  return useMutation<MonitoringSimulation, Error, MonitoringScenario>({
    mutationFn: (scenario) => service.selectMonitoringScenario(scenario),
    onSuccess: (nextSimulation) => {
      queryClient.setQueryData(liveMonitoringKeys.simulation(), nextSimulation);
    },
  });
}

export function useProcessMonitoringFrameMutation({
  service: propService,
}: {
  service?: LiveMonitoringService;
} = {}) {
  const service = useResolvedService(propService);
  const queryClient = useQueryClient();

  return useMutation<MonitoringSimulation, Error, MonitoringFrame>({
    mutationFn: (frame) => service.processMonitoringFrame(frame),
    onSuccess: (nextSimulation) => {
      queryClient.setQueryData(liveMonitoringKeys.simulation(), nextSimulation);
    },
  });
}
