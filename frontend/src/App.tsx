import { BrowserRouter, MemoryRouter } from "react-router-dom";

import { ApplicationRouter } from "./application/ApplicationRouter";
import type { PersonaRole } from "./application/personas";
import { createMockSawService, type SawApplicationCapabilities } from "./services/saw-service";

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
  if (initialEntries) {
    return <MemoryRouter initialEntries={initialEntries}><ApplicationRouter initialPersona={initialPersona} service={service} /></MemoryRouter>;
  }

  return <BrowserRouter><ApplicationRouter initialPersona={initialPersona} service={service} /></BrowserRouter>;
}
