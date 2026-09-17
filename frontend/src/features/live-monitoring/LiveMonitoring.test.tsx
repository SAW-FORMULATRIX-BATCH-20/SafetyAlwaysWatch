import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "../../App";
import { createMockSawService } from "../../services/saw-service";

describe("Live Monitoring", () => {
  it("limits an Area Supervisor to assigned Camera Sources", async () => {
    render(<App initialEntries={["/monitoring/live"]} initialPersona="supervisor" service={createMockSawService({ storage: null })} />);

    const selector = await screen.findByRole("combobox", { name: "Select Camera Source" });
    expect(selector).toHaveTextContent("Production Gate");
    expect(selector).not.toHaveTextContent("Warehouse Raw Materials");

  });

  it("removes overlays when an Admin/Safety Officer selects an offline Camera Source", async () => {
    const user = userEvent.setup();
    render(<App initialEntries={["/monitoring/live"]} initialPersona="admin" service={createMockSawService({ storage: null })} />);

    await user.selectOptions(await screen.findByRole("combobox", { name: "Select Camera Source" }), "CAM-02");
    expect(await screen.findByText("CAMERA OFFLINE")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Detected Person/)).not.toBeInTheDocument();
  });

  it("keeps a cleared Violation Episode from being presented as a current detection", async () => {
    const user = userEvent.setup();
    render(<App initialEntries={["/monitoring/live"]} initialPersona="admin" service={createMockSawService({ storage: null })} />);

    await user.click(await screen.findByRole("button", { name: "Missing PPE scenario" }));
    await user.click(screen.getByRole("button", { name: "Process non-compliant frame" }));
    await user.click(screen.getByRole("button", { name: "Process compliant frame" }));
    await user.click(screen.getByRole("button", { name: "Process compliant frame" }));

    expect(await screen.findByRole("region", { name: "Episode status" })).toHaveTextContent("Cleared");
    expect(screen.queryByLabelText(/Detected Person/)).not.toBeInTheDocument();
  });

  it("toggles between Single Focus View and Multi-Camera Grid View", async () => {
    const user = userEvent.setup();
    render(
      <App
        initialEntries={["/monitoring/live"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByRole("button", { name: "Single camera view" })).toBeInTheDocument();
    const gridButton = screen.getByRole("button", { name: "Multi-camera grid view" });

    await user.click(gridButton);
    expect(await screen.findByRole("region", { name: "Multi-camera monitoring grid" })).toBeInTheDocument();
    expect(screen.getByText("CCTV Security Video Wall")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inspect Production Gate" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inspect Warehouse Raw Materials" })).toBeInTheDocument();

    // In Grid View, camera selector dropdown is hidden to maximize CCTV wall space
    expect(screen.queryByRole("combobox", { name: "Select Camera Source" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Inspect Warehouse Raw Materials" }));
    expect(await screen.findByRole("region", { name: /Live Monitoring stage/ })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Select Camera Source" })).toBeInTheDocument();
  });

  it("allows hiding and showing the simulator to preview production mode", async () => {
    const user = userEvent.setup();
    render(
      <App
        initialEntries={["/monitoring/live"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByRole("region", { name: "Violation Episode simulator" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Missing PPE scenario" })).toBeInTheDocument();

    // Click hide button in simulator controls
    const hideBtn = screen.getByRole("button", { name: "Hide simulator controls" });
    await user.click(hideBtn);

    // Simulator is completely hidden without any placeholder banner, leaving clean production CCTV UI
    expect(screen.queryByRole("region", { name: "Violation Episode simulator" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Production Preview Mode Active/)).not.toBeInTheDocument();

    // Toggle simulator back on from the header button
    const toggleBtn = screen.getByRole("button", { name: "Switch to simulation mode" });
    await user.click(toggleBtn);

    expect(await screen.findByRole("region", { name: "Violation Episode simulator" })).toBeInTheDocument();
  });
});
