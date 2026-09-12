import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { App } from "../App";
import { createMockSawService } from "../services/saw-service";

describe("application foundation", () => {
  afterEach(() => {
    cleanup();
    window.history.replaceState({}, "", "/");
  });

  it.each([
    ["Admin/Safety OfficerManage SAW safety operations and configuration.", "Overview", "/overview"],
    ["Area SupervisorMonitor the Hazardous Zones assigned to you.", "Live Monitoring", "/monitoring/live"],
    ["Human Resources (HR)Review PPE Compliance trends and Employee safety records.", "Compliance Report", "/compliance-report"],
  ] as const)("sends the %s persona to %s after demo sign in", async (personaName, heading, landingPath) => {
    const user = userEvent.setup();
    render(<App initialEntries={["/login"]} service={createMockSawService({ storage: null })} />);

    await user.click(screen.getByRole("radio", { name: personaName }));
    await user.click(screen.getByRole("button", { name: "Sign in to SAW" }));

    await screen.findByRole("heading", { name: heading });
    expect(screen.getAllByRole("heading", { name: heading })).toHaveLength(1);
    expect(screen.getByRole("link", { current: "page" })).toHaveAttribute("href", landingPath);
  });

  it("signs out to the persona picker", async () => {
    const user = userEvent.setup();

    render(<App initialEntries={["/overview"]} initialPersona="admin" service={createMockSawService({ storage: null })} />);

    await user.click(screen.getByRole("button", { name: "Sign out of SAW" }));

    await screen.findByRole("heading", { name: "Sign in to SAW" });
    expect(screen.getAllByRole("heading", { name: "Sign in to SAW" })).toHaveLength(1);
  });

  it("applies the same persona rules to direct routes and visible navigation", () => {
    render(<App initialEntries={["/monitoring/live"]} initialPersona="hrd" service={createMockSawService({ storage: null })} />);

    expect(screen.getAllByRole("heading", { name: "Restricted access" })).toHaveLength(1);
    const navigation = within(screen.getByRole("navigation", { name: "Main navigation" }));
    expect(navigation.queryByRole("link", { name: "Live Monitoring" })).not.toBeInTheDocument();
  });

  it("keeps shell navigation keyboard reachable on a narrow viewport", async () => {
    const user = userEvent.setup();
    const originalInnerWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 375 });

    try {
      render(<App initialEntries={["/overview"]} initialPersona="admin" service={createMockSawService({ storage: null })} />);

      await user.tab();
      expect(screen.getByRole("link", { name: "SAW home" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("link", { name: "Overview" })).toHaveFocus();
      expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: originalInnerWidth });
    }
  });

  it("replaces an unknown direct route with the active persona landing page", async () => {
    window.history.replaceState({}, "", "/no-such-page");

    render(
      <App
        initialPersona="supervisor"
        service={createMockSawService({ storage: null })}
      />,
    );

    await screen.findByRole("heading", { name: "Live Monitoring" });
    expect(window.location.pathname).toBe("/monitoring/live");
  });
});
