import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "../../App";
import { createMockSawService } from "../../services/saw-service";

describe("Safety Parameters", () => {
  it("validates and saves English Safety Parameters through the routed application", async () => {
    const user = userEvent.setup();
    render(
      <App
        initialEntries={["/safety-parameters"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    const initialScore = await screen.findByRole("spinbutton", {
      name: "Initial Safety Score",
    });
    await user.clear(initialScore);
    await user.type(initialScore, "101");
    await user.click(
      screen.getByRole("button", { name: "Save Safety Parameters" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Initial Safety Score must be between 0 and 100.",
    );

    await user.clear(initialScore);
    await user.type(initialScore, "100");
    await user.click(
      screen.getByRole("button", { name: "Save Safety Parameters" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Safety Parameters saved.",
    );
  });

  it("cancels unsaved changes without mutating persisted Safety Parameters", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    const firstRender = render(
      <App
        initialEntries={["/safety-parameters"]}
        initialPersona="admin"
        service={service}
      />,
    );

    const threshold = await screen.findByRole("spinbutton", {
      name: "Escalation Threshold",
    });
    await user.clear(threshold);
    await user.type(threshold, "80");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(threshold).toHaveValue(60);

    firstRender.unmount();
    render(
      <App
        initialEntries={["/safety-parameters"]}
        initialPersona="admin"
        service={createMockSawService({ storage: window.localStorage })}
      />,
    );
    expect(
      await screen.findByRole("spinbutton", { name: "Escalation Threshold" }),
    ).toHaveValue(60);
  });

  it("persists the Escalation Threshold and updates the Overview outcome", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    const initialOverview = await service.getOverview();
    const firstRender = render(
      <App
        initialEntries={["/safety-parameters"]}
        initialPersona="admin"
        service={service}
      />,
    );

    const threshold = await screen.findByRole("spinbutton", {
      name: "Escalation Threshold",
    });
    await user.clear(threshold);
    await user.type(threshold, "95");
    await user.click(
      screen.getByRole("button", { name: "Save Safety Parameters" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Safety Parameters saved.",
    );

    await user.click(screen.getByRole("link", { name: "Overview" }));
    const updatedOverview = await service.getOverview();
    expect(updatedOverview?.employeesBelowEscalationThreshold).toBeGreaterThan(
      initialOverview?.employeesBelowEscalationThreshold ?? 0,
    );
    const belowThresholdCard = screen
      .getByText("Employees below the Escalation Threshold")
      .closest("article");
    expect(belowThresholdCard).not.toBeNull();
    expect(
      within(belowThresholdCard!).getByText(
        String(updatedOverview?.employeesBelowEscalationThreshold),
      ),
    ).toBeInTheDocument();

    firstRender.unmount();
    render(
      <App
        initialEntries={["/safety-parameters"]}
        initialPersona="admin"
        service={createMockSawService({ storage: window.localStorage })}
      />,
    );
    expect(
      await screen.findByRole("spinbutton", { name: "Escalation Threshold" }),
    ).toHaveValue(95);
  });

  it("presents a service save error in English", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: null });
    service.updateSafetySettings = async () => {
      throw new Error("Safety Parameters could not be saved.");
    };
    render(
      <App
        initialEntries={["/safety-parameters"]}
        initialPersona="admin"
        service={service}
      />,
    );

    await screen.findByRole("spinbutton", { name: "Escalation Threshold" });
    await user.click(
      screen.getByRole("button", { name: "Save Safety Parameters" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Safety Parameters could not be saved.",
    );
  });
});
