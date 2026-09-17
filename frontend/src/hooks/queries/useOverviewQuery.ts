import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OverviewData } from "../../services/saw-service";
import { useSawService } from "../../providers/ServiceContext";

export const overviewKeys = {
  all: ["overview"] as const,
};

export function useOverviewQuery() {
  const service = useSawService();

  return useQuery<OverviewData | null, Error>({
    queryKey: overviewKeys.all,
    queryFn: () => service.getOverview(),
  });
}

export function useResetDemoDataMutation() {
  const service = useSawService();
  const queryClient = useQueryClient();

  return useMutation<OverviewData, Error>({
    mutationFn: () => service.resetDemoData(),
    onSuccess: (nextOverview) => {
      queryClient.setQueryData(overviewKeys.all, nextOverview);
    },
  });
}
