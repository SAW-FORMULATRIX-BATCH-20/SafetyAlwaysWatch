import { useQuery } from "@tanstack/react-query";
import { useSawService } from "../../providers/ServiceContext";
import type {
  ComplianceReportData,
  ComplianceReportingCapability,
} from "../../services/saw-service";

export const complianceReportKeys = {
  all: ["compliance-report"] as const,
  report: () => ["compliance-report", "data"] as const,
};

export interface UseComplianceReportQueryOptions {
  service?: ComplianceReportingCapability;
}

function resolveService(
  propService?: ComplianceReportingCapability,
): ComplianceReportingCapability {
  try {
    const sawService = useSawService();
    return (propService ?? sawService) as unknown as ComplianceReportingCapability;
  } catch {
    if (!propService) {
      throw new Error(
        "Compliance report hook requires a ServiceProvider or a service prop",
      );
    }
    return propService;
  }
}

export function useComplianceReportQuery({
  service: propService,
}: UseComplianceReportQueryOptions = {}) {
  const service = resolveService(propService);

  const reportQuery = useQuery<ComplianceReportData, Error>({
    queryKey: complianceReportKeys.report(),
    queryFn: () => service.getComplianceReport(),
  });

  return {
    report: reportQuery.data,
    data: reportQuery.data,
    isLoading: reportQuery.isLoading,
    isError: reportQuery.isError,
    error: reportQuery.error,
    refetch: reportQuery.refetch,
  };
}
