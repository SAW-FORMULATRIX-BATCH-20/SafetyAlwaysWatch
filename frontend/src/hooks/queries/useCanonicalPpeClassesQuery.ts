import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSawService } from "../../providers/ServiceContext";
import type {
  CanonicalPpeClassCapability,
  CanonicalPpeClassConfiguration,
} from "../../services/saw-service";
import { hazardousZoneKeys } from "./useHazardousZonesQuery";

export const canonicalPpeClassKeys = {
  all: ["canonical-ppe-classes"] as const,
  configuration: () => ["canonical-ppe-classes", "configuration"] as const,
};

export interface UseCanonicalPpeClassesQueryOptions {
  service?: CanonicalPpeClassCapability;
}

function resolveService(propService?: CanonicalPpeClassCapability): CanonicalPpeClassCapability {
  try {
    const sawService = useSawService();
    return (propService ?? sawService) as unknown as CanonicalPpeClassCapability;
  } catch {
    if (!propService) {
      throw new Error("Canonical PPE Classes hook requires a ServiceProvider or a service prop");
    }
    return propService;
  }
}

export function useCanonicalPpeClassesQuery({
  service: propService,
}: UseCanonicalPpeClassesQueryOptions = {}) {
  const service = resolveService(propService);

  const configQuery = useQuery<CanonicalPpeClassConfiguration, Error>({
    queryKey: canonicalPpeClassKeys.configuration(),
    queryFn: () => service.getCanonicalPpeClassConfiguration(),
  });

  return {
    configuration: configQuery.data,
    isLoading: configQuery.isLoading,
    isError: configQuery.isError,
    error: configQuery.error,
    refetch: () => configQuery.refetch(),
  };
}

export function useUpdateCanonicalPpeClassConfigurationMutation({
  service: propService,
}: UseCanonicalPpeClassesQueryOptions = {}) {
  const service = resolveService(propService);
  const queryClient = useQueryClient();

  return useMutation<CanonicalPpeClassConfiguration, Error, CanonicalPpeClassConfiguration>({
    mutationFn: (configuration) =>
      service.updateCanonicalPpeClassConfiguration(configuration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: canonicalPpeClassKeys.all });
      queryClient.invalidateQueries({ queryKey: hazardousZoneKeys.configuration() });
    },
  });
}
