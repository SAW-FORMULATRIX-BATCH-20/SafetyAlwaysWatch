import { QueryClient, QueryClientContext, QueryClientProvider } from "@tanstack/react-query";
import { useContext, useState, type ReactNode } from "react";

/**
 * Ensures a QueryClient is available in context.
 * If an outer QueryClientProvider exists (e.g. from App/QueryProvider), it is reused.
 * Otherwise, a local fallback QueryClient is provided so isolated unit tests or
 * standalone component mounts run seamlessly without throwing.
 */
export function EnsureQueryClient({ children }: { children: ReactNode }) {
  const existingClient = useContext(QueryClientContext);
  const [fallbackClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            staleTime: 1000 * 60,
          },
        },
      }),
  );

  if (existingClient) {
    return <>{children}</>;
  }

  return (
    <QueryClientProvider client={fallbackClient}>
      {children}
    </QueryClientProvider>
  );
}
