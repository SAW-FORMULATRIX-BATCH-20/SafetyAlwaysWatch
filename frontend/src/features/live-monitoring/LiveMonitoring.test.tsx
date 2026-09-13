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

  it("records one Violation Event and one Safety Score deduction through the episode lifecycle", async () => {
    const user = userEvent.setup();
    render(<App initialEntries={["/monitoring/live"]} initialPersona="supervisor" service={createMockSawService({ storage: null })} />);

    await user.click(await screen.findByRole("button", { name: "Missing PPE scenario" }));
    expect(screen.getByText("Pending Confirmation")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Process non-compliant frame" }));
    expect(await screen.findByRole("region", { name: "Episode status" })).toHaveTextContent("Safety Score: 92 → 84");

    await user.click(screen.getByRole("button", { name: "Process compliant frame" }));
    await user.click(screen.getByRole("button", { name: "Process non-compliant frame" }));
    await user.click(screen.getByRole("button", { name: "Process compliant frame" }));
    await user.click(screen.getByRole("button", { name: "Process compliant frame" }));
    expect(screen.getAllByText(/Violation Event VIO-SIM-01/i)).toHaveLength(1);
  });

  it("presents Unknown, low-confidence, offline, and escalation scenarios", async () => {
    const user = userEvent.setup();
    render(<App initialEntries={["/monitoring/live"]} initialPersona="admin" service={createMockSawService({ storage: null })} />);

    await user.click(await screen.findByRole("button", { name: "Unknown person scenario" }));
    expect(await screen.findByRole("region", { name: /Live Monitoring stage/i })).toHaveTextContent("Unknown");
    await user.click(screen.getByRole("button", { name: "Low-confidence frame" }));
    expect(screen.getByText(/frame below the minimum confidence/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Score escalation scenario" }));
    await user.click(screen.getByRole("button", { name: "Process non-compliant frame" }));
    expect(await screen.findByText(/Escalation Threshold crossed: 60/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Camera offline scenario" }));
    expect(await screen.findByText("CAMERA OFFLINE")).toBeInTheDocument();
  });
});
