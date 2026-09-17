import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cameraScopeFor, type Persona } from "../../application/personas";
import { useSawService } from "../../providers/ServiceContext";
import type {
  Camera,
  CameraMetadata,
  CameraScope,
  CameraSourceCapability,
  HazardousZoneCapability,
  HazardousZoneWithViolationHistory,
} from "../../services/saw-service";
import { useAuthStore } from "../../stores/useAuthStore";

export type CameraSourceService = CameraSourceCapability & HazardousZoneCapability;

export const cameraSourceKeys = {
  all: ["camera-sources"] as const,
  cameras: (scope?: CameraScope) => ["camera-sources", "cameras", scope] as const,
  zones: () => ["camera-sources", "zones"] as const,
};

export interface UseCameraSourcesQueryOptions {
  persona?: Persona;
  service?: CameraSourceService;
}

function resolveService(propService?: CameraSourceService): CameraSourceService {
  try {
    const sawService = useSawService();
    return (propService ?? sawService) as unknown as CameraSourceService;
  } catch {
    if (!propService) {
      throw new Error("useCameraSourcesQuery requires a ServiceProvider or a service prop");
    }
    return propService;
  }
}

export function useCameraSourcesQuery({
  persona: propPersona,
  service: propService,
}: UseCameraSourcesQueryOptions = {}) {
  const service = resolveService(propService);
  const authPersona = useAuthStore((state) => state.persona);
  const persona = propPersona ?? authPersona;
  const scope = persona ? cameraScopeFor(persona) : undefined;

  const camerasQuery = useQuery<Camera[], Error>({
    queryKey: cameraSourceKeys.cameras(scope),
    queryFn: () => service.getCameras(scope),
  });

  const zonesQuery = useQuery<HazardousZoneWithViolationHistory[], Error>({
    queryKey: cameraSourceKeys.zones(),
    queryFn: () => service.getHazardousZone(),
  });

  const isLoading = camerasQuery.isLoading || zonesQuery.isLoading;
  const isError = camerasQuery.isError || zonesQuery.isError;
  const error = camerasQuery.error || zonesQuery.error;

  return {
    cameras: camerasQuery.data,
    zones: zonesQuery.data,
    isLoading,
    isError,
    error,
    refetch: async () => {
      await Promise.all([camerasQuery.refetch(), zonesQuery.refetch()]);
    },
  };
}

export function useUpdateCameraMetadataMutation({
  service: propService,
}: UseCameraSourcesQueryOptions = {}) {
  const service = resolveService(propService);
  const queryClient = useQueryClient();

  return useMutation<Camera, Error, { id: string; metadata: CameraMetadata }>({
    mutationFn: ({ id, metadata }) => service.updateCameraMetadata(id, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cameraSourceKeys.all });
    },
  });
}
