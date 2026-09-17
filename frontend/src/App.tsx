import { BrowserRouter, MemoryRouter } from "react-router-dom";

import { ApplicationRouter } from "./application/ApplicationRouter";
import type { PersonaRole } from "./application/personas";
import { QueryProvider } from "./providers/QueryProvider";
import { createMockSawService, type SawApplicationCapabilities } from "./services/saw-service";
import { useAuthStore } from "./stores/useAuthStore";

type AppProps = {
  initialEntries?: string[];
  initialPersona?: PersonaRole;
  service?: SawApplicationCapabilities;
};

const defaultService = createMockSawService();

/**
 * Application composition only. Feature routes, screens, and adapters are assembled here
 * while their behavior remains behind feature capability interfaces.
 */
export function App({ initialEntries, initialPersona, service = defaultService }: AppProps) {
  if (initialPersona && useAuthStore.getState().role !== initialPersona) {
    useAuthStore.getState().setRole(initialPersona);
  } else if (!initialPersona && initialEntries && useAuthStore.getState().role !== undefined) {
    useAuthStore.getState().logout();
  }

  const router = initialEntries ? (
    <MemoryRouter initialEntries={initialEntries}>
      <ApplicationRouter initialPersona={initialPersona} />
    </MemoryRouter>
  ) : (
    <BrowserRouter>
      <ApplicationRouter initialPersona={initialPersona} />
    </BrowserRouter>
  );

  return <QueryProvider service={service}>{router}</QueryProvider>;
}

