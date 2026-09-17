import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSawService } from "../../providers/ServiceContext";
import type {
  EmployeeDirectoryCapability,
  EmployeeDirectoryData,
  SafetyScoreAudit,
  SafetyScoreCapability,
  SafetyScoreResetRequest,
  SafetyScoreResetResult,
  SafetySettings,
  SafetySettingsCapability,
} from "../../services/saw-service";

export type ScoreResetService = EmployeeDirectoryCapability &
  SafetyScoreCapability &
  SafetySettingsCapability;

export type ScoreResetInitialData = {
  directory: EmployeeDirectoryData;
  settings: SafetySettings;
};

export const scoreResetKeys = {
  all: ["score-reset"] as const,
  data: () => ["score-reset", "data"] as const,
  audit: (employeeId?: string) => ["score-reset", "audit", employeeId] as const,
};

export interface UseScoreResetQueryOptions {
  service?: ScoreResetService;
}

function useResolveService(propService?: ScoreResetService): ScoreResetService {
  try {
    const sawService = useSawService();
    return (propService ?? sawService) as unknown as ScoreResetService;
  } catch {
    if (!propService) {
      throw new Error(
        "ScoreReset hook requires a ServiceProvider or a service prop",
      );
    }
    return propService;
  }
}

export function useScoreResetQuery({
  service: propService,
}: UseScoreResetQueryOptions = {}) {
  const service = useResolveService(propService);

  const query = useQuery<ScoreResetInitialData, Error>({
    queryKey: scoreResetKeys.data(),
    queryFn: async () => {
      const [directory, settings] = await Promise.all([
        service.getEmployeeDirectory(),
        service.getSafetySettings(),
      ]);
      return { directory, settings };
    },
  });

  return {
    data: query.data,
    directory: query.data?.directory,
    settings: query.data?.settings,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export interface UseScoreResetAuditQueryOptions {
  employeeId?: string;
  service?: ScoreResetService;
}

export function useScoreResetAuditQuery({
  employeeId,
  service: propService,
}: UseScoreResetAuditQueryOptions = {}) {
  const service = useResolveService(propService);

  const query = useQuery<SafetyScoreAudit, Error>({
    queryKey: scoreResetKeys.audit(employeeId),
    queryFn: async () => {
      if (!employeeId) throw new Error("Employee ID is required");
      return service.getSafetyScoreAudit(employeeId);
    },
    enabled: Boolean(employeeId),
  });

  return {
    audit: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useResetSafetyScoreMutation({
  service: propService,
}: UseScoreResetQueryOptions = {}) {
  const service = useResolveService(propService);
  const queryClient = useQueryClient();

  return useMutation<SafetyScoreResetResult, Error, SafetyScoreResetRequest>({
    mutationFn: (request) => service.resetSafetyScore(request),
    onSuccess: async (result, variables) => {
      queryClient.setQueryData<ScoreResetInitialData>(
        scoreResetKeys.data(),
        (current) =>
          current && {
            ...current,
            directory: {
              ...current.directory,
              employees: current.directory.employees.map((item) =>
                item.id === variables.employeeId ? result.employee : item,
              ),
            },
          },
      );
      await queryClient.invalidateQueries({
        queryKey: scoreResetKeys.audit(variables.employeeId),
      });
      queryClient.invalidateQueries({
        queryKey: scoreResetKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: ["employees"],
      });
    },
  });
}
