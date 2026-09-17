import { useQuery } from "@tanstack/react-query";
import { useSawService } from "../../providers/ServiceContext";
import type {
  Camera,
  CameraSourceCapability,
  Employee,
  EmployeeDirectoryCapability,
  HazardousZoneCapability,
  HazardousZoneWithViolationHistory,
  ViolationHistoryCapability,
  ViolationRecord,
} from "../../services/saw-service";

export type ViolationHistoryService = CameraSourceCapability &
  EmployeeDirectoryCapability &
  HazardousZoneCapability &
  ViolationHistoryCapability;

export type ViolationHistoryData = {
  cameras: Camera[];
  employees: Employee[];
  violations: ViolationRecord[];
  zones: HazardousZoneWithViolationHistory[];
};

export const violationKeys = {
  all: ["violations"] as const,
  data: () => ["violations", "data"] as const,
  history: () => ["violations", "history"] as const,
  cameras: () => ["violations", "cameras"] as const,
  zones: () => ["violations", "zones"] as const,
  directory: () => ["violations", "directory"] as const,
};

export interface UseViolationsQueryOptions {
  service?: ViolationHistoryService;
}

function resolveService(
  propService?: ViolationHistoryService,
): ViolationHistoryService {
  try {
    const sawService = useSawService();
    return (propService ?? sawService) as unknown as ViolationHistoryService;
  } catch {
    if (!propService) {
      throw new Error(
        "Violations hook requires a ServiceProvider or a service prop",
      );
    }
    return propService;
  }
}

export function useViolationsQuery({
  service: propService,
}: UseViolationsQueryOptions = {}) {
  const service = resolveService(propService);

  const query = useQuery<ViolationHistoryData, Error>({
    queryKey: violationKeys.data(),
    queryFn: async () => {
      const [violations, cameras, zones, directory] = await Promise.all([
        service.getViolationHistory(),
        service.getCameras(),
        service.getHazardousZone(),
        service.getEmployeeDirectory(),
      ]);
      return {
        violations,
        cameras,
        zones,
        employees: directory.employees,
      };
    },
  });

  return {
    data: query.data,
    violations: query.data?.violations,
    cameras: query.data?.cameras,
    zones: query.data?.zones,
    employees: query.data?.employees,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
