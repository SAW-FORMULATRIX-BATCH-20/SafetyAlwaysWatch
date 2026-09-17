import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "../../App";
import { createMockSawService } from "../../services/saw-service";

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

  it("relocates Add Hazardous Zone buttons contextually and supports polygon points editing", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: null });
    render(<App initialEntries={["/hazardous-zones"]} initialPersona="admin" service={service} />);

    // Top-right of title section should NOT contain an Add button
    const titleHeader = await screen.findByRole("heading", { name: "Hazardous Zones", level: 1 });
    expect(titleHeader.parentElement?.querySelector("button")).toBeNull();

    // Contextual button exists on the CCTV frame HUD
    const frameAddBtn = await screen.findByRole("button", { name: "Add Hazardous Zone" });
    expect(frameAddBtn).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Zone" })).not.toBeInTheDocument();

    // Open draft from CCTV frame
    await user.click(frameAddBtn);

    // Form opens with Polygon Vertices
    expect(screen.getByRole("heading", { name: "Add Hazardous Zone", level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/Polygon Vertices/i)).toBeInTheDocument();

    // 4 initial polygon points exist
    expect(screen.getByText("Point 1")).toBeInTheDocument();
    expect(screen.getByText("Point 4")).toBeInTheDocument();

    // Name the zone
    const nameInput = screen.getByLabelText("Hazardous Zone name");
    await user.type(nameInput, "Assembly Robot Zone");

    // Adjust Point 1 X coordinate
    const pt1X = screen.getByLabelText("Point 1 X coordinate");
    await user.clear(pt1X);
    await user.type(pt1X, "0.15");

    // Add a 5th vertex point
    const addPtBtn = screen.getAllByRole("button", { name: /Add Point/i })[0];
    await user.click(addPtBtn);
    expect(screen.getByText("Point 5")).toBeInTheDocument();

    // Remove the 5th point
    const deletePt5Btn = screen.getByRole("button", { name: "Delete Point 5" });
    await user.click(deletePt5Btn);
    expect(screen.queryByText("Point 5")).not.toBeInTheDocument();

    // Save zone
    await user.click(screen.getByRole("button", { name: "Save Hazardous Zone" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Hazardous Zone Assembly Robot Zone saved.");

    // Verify saved zone in service has points and calculated bounds
    const zones = await service.getHazardousZone();
    const createdZone = zones.find((z) => z.name === "Assembly Robot Zone");
    expect(createdZone).toBeDefined();
    expect(createdZone?.points).toBeDefined();
    expect(createdZone?.points?.length).toBe(4);
    expect(createdZone?.points?.[0].x).toBe(0.15);
    expect(createdZone?.bounds.x).toBe(0.15);
  });
});
