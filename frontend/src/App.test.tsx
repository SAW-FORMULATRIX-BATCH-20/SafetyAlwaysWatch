import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { App } from "./App";
import { createMockSawService } from "./services/saw-service";

describe("SAW application", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  it("mengarahkan Admin/Safety Officer ke Overview setelah login demo", async () => {
    const user = userEvent.setup();

    render(<App initialEntries={["/login"]} />);

    await user.click(
      screen.getByRole("radio", { name: /Admin\/Safety Officer/i }),
    );
    await user.click(screen.getByRole("button", { name: "Sign in to SAW" }));

    expect(
      await screen.findByRole("heading", { name: "Overview" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Admin/Safety Officer")).toBeInTheDocument();
  });

  it("menampilkan navigasi Overview untuk persona Admin/Safety Officer", () => {
    render(
      <App initialEntries={["/overview"]} initialPersona="admin" />,
    );

    const navigation = screen.getByRole("navigation", { name: "Main navigation" });
    expect(navigation).toHaveTextContent("Overview");
  });

  it("shows Overview KPIs calculated from the SAW seed", async () => {
    render(
      <App
        initialEntries={["/overview"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByText("1", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("83%", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("2", { selector: "strong" })).toBeInTheDocument();
  });

  it("resets demo data to the seed and preserves it after refresh", async () => {
    const initialData = {
      cameras: [
        { id: "CAM-01", name: "Production Gate", location: "Main Production Line", zoneIds: ["ZON-01"], status: "online" as const, lastUpdatedAt: "2026-09-08T08:15:00+07:00", supervisorArea: "Production" },
        { id: "CAM-02", name: "Warehouse Raw Materials", location: "Warehouse Raw Materials", zoneIds: ["ZON-03"], status: "online" as const, lastUpdatedAt: "2026-09-08T08:00:00+07:00", supervisorArea: "Warehouse" },
      ],
      compliance: { compliantObservations: 50, totalObservations: 100 },
      departments: ["Production", "Warehouse", "Maintenance"],
      employees: [{ id: "EMP-01", departmentId: "Production", safetyScore: 40 }],
      escalationThreshold: 60,
      violations: [{ id: "VIO-01", status: "confirmed" as const }],
      zones: ["ZON-01", "ZON-02", "ZON-03", "ZON-04"],
    };
    const user = userEvent.setup();
    const firstRender = render(
      <App initialEntries={["/overview"]} initialPersona="admin" service={createMockSawService({ initialData, storage: window.localStorage })} />,
    );

    expect(await screen.findByText("2 / 2")).toBeInTheDocument();
    firstRender.unmount();
    const refreshedRender = render(
      <App initialEntries={["/overview"]} initialPersona="admin" service={createMockSawService({ storage: window.localStorage })} />,
    );
    expect(await screen.findByText("2 / 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset demo data" }));
    await user.click(screen.getAllByRole("button", { name: "Reset demo data" })[1]);
    expect(await screen.findByText("1 / 2")).toBeInTheDocument();

    refreshedRender.unmount();
    render(<App initialEntries={["/overview"]} initialPersona="admin" service={createMockSawService({ storage: window.localStorage })} />);
    expect(await screen.findByText("1 / 2")).toBeInTheDocument();
  });

  it.each([
    ["loading", "Loading safety overview…"],
    ["empty", "No demo data"],
    ["error", "SAW demo data could not be loaded"],
  ] as const)("menampilkan state %s Overview secara jelas", async (scenario, expectedText) => {
    render(<App initialEntries={["/overview"]} initialPersona="admin" service={createMockSawService({ scenario, storage: null })} />);

    expect(await screen.findByText(expectedText)).toBeInTheDocument();
  });

  it("allows Escape to close the confirmation dialog and keeps focus within it", async () => {
    const user = userEvent.setup();
    render(<App initialEntries={["/overview"]} initialPersona="admin" service={createMockSawService({ storage: null })} />);

    await user.click(await screen.findByRole("button", { name: "Reset demo data" }));
    const dialog = screen.getByRole("dialog", { name: "Reset demo data?" });
    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.tab();
    expect(screen.getAllByRole("button", { name: "Reset demo data" })[1]).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Reset demo data?" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset demo data" })).toHaveFocus();
  });

  it("disables shell motion when the user prefers reduced motion", async () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = (query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    });

    try {
      render(<App initialEntries={["/overview"]} initialPersona="admin" service={createMockSawService({ storage: null })} />);
      await screen.findByRole("heading", { name: "Overview" });
      expect(screen.getByRole("main")).not.toHaveAttribute("style");
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});
