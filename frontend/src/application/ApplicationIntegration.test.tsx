import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "../App";
import { createMockSawService } from "../services/saw-service";

describe("application integration", () => {
  it("records escalation notifications from Live Monitoring in the Notifications feature", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: null });

    render(<App initialEntries={["/monitoring/live"]} initialPersona="admin" service={service} />);

    await user.click(await screen.findByRole("button", { name: "Score escalation scenario" }));
    await user.click(screen.getByRole("button", { name: "Process non-compliant frame" }));
    expect(await screen.findByRole("status", { name: "Simulation notification feed" })).toHaveTextContent(
      "3 simulated recipients recorded",
    );

    await user.click(screen.getByRole("link", { name: "Notifications" }));
    expect((await screen.findAllByText(/VIO-SIM-01/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Sent · SIMULATION/).length).toBeGreaterThan(1);
  });

  it("restores the persisted browser-local data to the deterministic seed", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });

    const initialRender = render(<App initialEntries={["/camera-sources"]} initialPersona="admin" service={service} />);

    await user.click(await screen.findByRole("button", { name: "View details Production Gate" }));
    const name = screen.getByRole("textbox", { name: "Camera Source name" });
    await user.clear(name);
    await user.type(name, "Temporary camera name");
    await user.click(screen.getByRole("button", { name: "Save metadata demo" }));
    expect(await screen.findByRole("article", { name: "Temporary camera name" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Overview" }));
    await user.click(screen.getByRole("button", { name: "Reset demo data" }));
    await user.click(screen.getAllByRole("button", { name: "Reset demo data" })[1]);

    await user.click(screen.getByRole("link", { name: "Camera Sources" }));
    expect(await screen.findByRole("article", { name: "Production Gate" })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Temporary camera name" })).not.toBeInTheDocument();

    initialRender.unmount();
    render(
      <App
        initialEntries={["/camera-sources"]}
        initialPersona="admin"
        service={createMockSawService({ storage: window.localStorage })}
      />,
    );
    expect(await screen.findByRole("article", { name: "Production Gate" })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Temporary camera name" })).not.toBeInTheDocument();
  });
});
