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
});
