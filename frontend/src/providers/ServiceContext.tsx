import { createContext, useContext, type ReactNode } from "react";
import type { SawApplicationCapabilities } from "../services/saw-service";

const ServiceContext = createContext<SawApplicationCapabilities | null>(null);

export function ServiceProvider({
  service,
  children,
}: {
  service: SawApplicationCapabilities;
  children: ReactNode;
}) {
  return (
    <ServiceContext.Provider value={service}>
      {children}
    </ServiceContext.Provider>
  );
}

export function useSawService(): SawApplicationCapabilities {
  const service = useContext(ServiceContext);
  if (!service) {
    throw new Error("useSawService must be used within a ServiceProvider");
  }
  return service;
}
