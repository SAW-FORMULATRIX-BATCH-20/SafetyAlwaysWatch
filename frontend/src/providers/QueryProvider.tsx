import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import type { SawApplicationCapabilities } from "../services/saw-service";
import { ServiceProvider } from "./ServiceContext";

export function QueryProvider({
  service,
  client,
  children,
}: {
  service: SawApplicationCapabilities;
  client?: QueryClient;
  children: ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      client ??
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            retry: false,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ServiceProvider service={service}>{children}</ServiceProvider>
    </QueryClientProvider>
  );
}
