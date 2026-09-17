import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSawService } from "../../providers/ServiceContext";
import type {
  SafetySettings,
  SafetySettingsCapability,
} from "../../services/saw-service";
import { overviewKeys } from "./useOverviewQuery";
import { scoreResetKeys } from "./useScoreResetQuery";
import { liveMonitoringKeys } from "./useLiveMonitoringQuery";

export type SafetyParametersService = SafetySettingsCapability;

export const safetyParametersKeys = {
  all: ["safety-parameters"] as const,
  settings: () => ["safety-parameters", "settings"] as const,
};

export interface UseSafetyParametersQueryOptions {
  service?: SafetyParametersService;
}

function resolveService(
  propService?: SafetyParametersService,
): SafetyParametersService {
  try {
    const sawService = useSawService();
    return (propService ?? sawService) as unknown as SafetyParametersService;
  } catch {
    if (!propService) {
      throw new Error(
        "SafetyParameters hook requires a ServiceProvider or a service prop",
      );
    }
    return propService;
  }
}

export function useSafetyParametersQuery({
  service: propService,
}: UseSafetyParametersQueryOptions = {}) {
  const service = resolveService(propService);

  const query = useQuery<SafetySettings, Error>({
    queryKey: safetyParametersKeys.settings(),
    queryFn: () => service.getSafetySettings(),
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => query.refetch(),
  };
}

export function useUpdateSafetyParametersMutation({
  service: propService,
}: UseSafetyParametersQueryOptions = {}) {
  const service = resolveService(propService);
  const queryClient = useQueryClient();

  return useMutation<SafetySettings, Error, SafetySettings>({
    mutationFn: (settings) => service.updateSafetySettings(settings),
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(
        safetyParametersKeys.settings(),
        updatedSettings,
      );
      queryClient.invalidateQueries({ queryKey: safetyParametersKeys.all });
      queryClient.invalidateQueries({ queryKey: overviewKeys.all });
      queryClient.invalidateQueries({ queryKey: scoreResetKeys.all });
      queryClient.invalidateQueries({ queryKey: liveMonitoringKeys.all });
    },
  });
}
