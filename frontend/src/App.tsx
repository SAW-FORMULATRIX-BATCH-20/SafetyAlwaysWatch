import { BrowserRouter, MemoryRouter } from "react-router-dom";

import { RoutedApplication } from "./application/RoutedApplication";
import { createMockSawService, type SawApplicationCapabilities } from "./services/saw-service";

type AppProps = {
  initialEntries?: string[];
  initialPersona?: "admin" | "supervisor" | "hrd";
  service?: SawApplicationCapabilities;
};

const defaultService = createMockSawService();

/**
 * Application composition only. Feature routes, screens, and adapters are assembled here
 * while their behavior remains behind feature capability interfaces.
 */
export function App({ initialEntries, initialPersona, service = defaultService }: AppProps) {
  if (initialEntries) {
    return <MemoryRouter initialEntries={initialEntries}><RoutedApplication initialPersona={initialPersona} service={service} /></MemoryRouter>;
  }

  return <BrowserRouter><RoutedApplication initialPersona={initialPersona} service={service} /></BrowserRouter>;
}
