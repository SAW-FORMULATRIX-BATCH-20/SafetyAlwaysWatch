import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSawService } from "../../providers/ServiceContext";
import type {
  Camera,
  CameraSourceCapability,
  CanonicalPpeClassCapability,
  CanonicalPpeClassConfiguration,
  HazardousZoneCapability,
  HazardousZoneInput,
  HazardousZoneWithViolationHistory,
} from "../../services/saw-service";

export type HazardousZoneService = CameraSourceCapability &
  HazardousZoneCapability &
  CanonicalPpeClassCapability;

export const hazardousZoneKeys = {
  all: ["hazardous-zones"] as const,
  zones: () => ["hazardous-zones", "zones"] as const,
  cameras: () => ["hazardous-zones", "cameras"] as const,
  configuration: () => ["hazardous-zones", "configuration"] as const,
};

export interface UseHazardousZonesQueryOptions {
  service?: HazardousZoneService;
}

function resolveService(propService?: HazardousZoneService): HazardousZoneService {
  try {
    const sawService = useSawService();
    return (propService ?? sawService) as unknown as HazardousZoneService;
  } catch {
    if (!propService) {
      throw new Error("Hazardous zones hook requires a ServiceProvider or a service prop");
    }
    return propService;
  }
}

export function useHazardousZonesQuery({
  service: propService,
}: UseHazardousZonesQueryOptions = {}) {
  const service = resolveService(propService);

  const camerasQuery = useQuery<Camera[], Error>({
    queryKey: hazardousZoneKeys.cameras(),
    queryFn: () => service.getCameras(),
  });

  const zonesQuery = useQuery<HazardousZoneWithViolationHistory[], Error>({
    queryKey: hazardousZoneKeys.zones(),
    queryFn: () => service.getHazardousZone(),
  });

  const configQuery = useQuery<CanonicalPpeClassConfiguration, Error>({
    queryKey: hazardousZoneKeys.configuration(),
    queryFn: () => service.getCanonicalPpeClassConfiguration(),
  });

  const isLoading = camerasQuery.isLoading || zonesQuery.isLoading || configQuery.isLoading;
  const isError = camerasQuery.isError || zonesQuery.isError || configQuery.isError;
  const error = camerasQuery.error || zonesQuery.error || configQuery.error;

  return {
    cameras: camerasQuery.data,
    zones: zonesQuery.data,
    configuration: configQuery.data,
    isLoading,
    isError,
    error,
    refetch: async () => {
      await Promise.all([
        camerasQuery.refetch(),
        zonesQuery.refetch(),
        configQuery.refetch(),
      ]);
    },
  };
}

export function useSaveHazardousZoneMutation({
  service: propService,
}: UseHazardousZonesQueryOptions = {}) {
  const service = resolveService(propService);
  const queryClient = useQueryClient();

  return useMutation<HazardousZoneWithViolationHistory, Error, HazardousZoneInput>({
    mutationFn: (zone) => service.saveHazardousZone(zone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hazardousZoneKeys.all });
    },
  });
}

export function useDeactivateHazardousZoneMutation({
  service: propService,
}: UseHazardousZonesQueryOptions = {}) {
  const service = resolveService(propService);
  const queryClient = useQueryClient();

  return useMutation<HazardousZoneWithViolationHistory, Error, string>({
    mutationFn: (id) => service.deactivateHazardousZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hazardousZoneKeys.all });
    },
  });
}

export function useDeleteHazardousZoneMutation({
  service: propService,
}: UseHazardousZonesQueryOptions = {}) {
  const service = resolveService(propService);
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.deleteHazardousZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hazardousZoneKeys.all });
    },
  });
}
