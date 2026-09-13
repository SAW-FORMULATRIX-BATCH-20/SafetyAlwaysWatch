import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "../../App";
import { createMockSawService } from "../../services/saw-service";
import { mockMediaQuery } from "../../test/mockMediaQuery";

describe("Hazardous Zones", () => {
  it("deactivates a Hazardous Zone while retaining its audit-safe lifecycle", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: null });
    render(<App initialEntries={["/hazardous-zones"]} initialPersona="admin" service={service} />);

    await user.click(await screen.findByRole("button", { name: "Edit Main Gate Zone" }));
    expect(screen.getByText(/Deactivation is the primary action:/)).toBeInTheDocument();
    expect(screen.getByText(/cannot be permanently deleted/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Deactivate Hazardous Zone" }));
    await user.click(screen.getByRole("button", { name: "Confirm deactivation" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Hazardous Zone Main Gate Zone deactivated.");
    expect((await service.getHazardousZone()).find((zone) => zone.id === "ZON-01")?.active).toBe(false);
  });

  it("draws a Hazardous Zone and validates its required configuration", async () => {
    const user = userEvent.setup();
    render(<App initialEntries={["/hazardous-zones"]} initialPersona="admin" service={createMockSawService({ storage: null })} />);

    await user.click(await screen.findByRole("button", { name: "Add Hazardous Zone" }));
    await user.click(screen.getByRole("button", { name: "Save Hazardous Zone" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Hazardous Zone name is required.");

    await user.type(screen.getByRole("textbox", { name: "Hazardous Zone name" }), "Validation Zone");
    await user.click(screen.getByRole("checkbox", { name: "Safety Helmet" }));
    await user.click(screen.getByRole("button", { name: "Save Hazardous Zone" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Select at least one Canonical PPE Class.");
    await user.click(screen.getByRole("checkbox", { name: "Safety Helmet" }));
    await user.click(screen.getByRole("checkbox", { name: "Production" }));
    await user.click(screen.getByRole("button", { name: "Save Hazardous Zone" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Select at least one Area Supervisor.");
    await user.click(screen.getByRole("checkbox", { name: "Production" }));
    const canvas = screen.getByLabelText("Hazardous Zone canvas");
    Object.defineProperty(canvas, "getBoundingClientRect", { value: () => ({ left: 0, top: 0, width: 100, height: 100 }) });
    fireEvent.pointerDown(canvas, { clientX: 10, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 50, clientY: 60, pointerId: 1 });
    fireEvent.pointerUp(canvas, { pointerId: 1 });
    await user.click(screen.getByRole("button", { name: "Save Hazardous Zone" }));
    expect(await screen.findByRole("article", { name: "Validation Zone" })).toBeInTheDocument();
  });

  it("persists a new Hazardous Zone and permits deletion only when it has no Violation History", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    const firstRender = render(<App initialEntries={["/hazardous-zones"]} initialPersona="admin" service={service} />);

    await user.click(await screen.findByRole("button", { name: "Add Hazardous Zone" }));
    await user.type(screen.getByRole("textbox", { name: "Hazardous Zone name" }), "Temporary Zone");
    await user.click(screen.getByRole("button", { name: "Save Hazardous Zone" }));
    expect(await screen.findByRole("article", { name: "Temporary Zone" })).toBeInTheDocument();

    firstRender.unmount();
    render(<App initialEntries={["/hazardous-zones"]} initialPersona="admin" service={createMockSawService({ storage: window.localStorage })} />);
    await user.click(await screen.findByRole("button", { name: "Edit Temporary Zone" }));
    await user.click(screen.getByRole("button", { name: "Permanently delete Hazardous Zone" }));
    await user.click(screen.getByRole("button", { name: "Confirm permanent deletion" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Hazardous Zone Temporary Zone permanently deleted.");
  });

  it("keeps coordinate inputs operable when the mobile frame is view-only", async () => {
    const restoreMediaQuery = mockMediaQuery("(max-width: 767px)");

    try {
      const user = userEvent.setup();
      render(<App initialEntries={["/hazardous-zones"]} initialPersona="admin" service={createMockSawService({ storage: null })} />);
      await user.click(await screen.findByRole("button", { name: "Add Hazardous Zone" }));
      expect(screen.getByLabelText("Hazardous Zone canvas")).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByRole("spinbutton", { name: "Coordinate x" })).toBeEnabled();
    } finally {
      restoreMediaQuery();
    }
  });
});
