import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "../../App";
import { createMockSawService } from "../../services/saw-service";

describe("Notifications", () => {
  it("gives Human Resources read-only access to English notification logs", async () => {
    render(
      <App
        initialEntries={["/notifications"]}
        initialPersona="hrd"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Notification simulation log",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add recipient" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Simulate sent" }),
    ).not.toBeInTheDocument();
  });

  it("masks a saved Area Supervisor Chat ID and records simulated delivery", async () => {
    const user = userEvent.setup();
    render(
      <App
        initialEntries={["/notifications"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    await user.click(
      await screen.findByRole("button", { name: "Add recipient" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Recipient name" }),
      "Maintenance Shift B",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Chat ID" }),
      "1234567890",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Recipient role" }),
      "Area Supervisor",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Recipient scope" }),
      "department",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Target department" }),
      "Maintenance",
    );
    await user.click(screen.getByRole("button", { name: "Save recipient" }));
    const recipient = await screen.findByRole("listitem", {
      name: "Maintenance Shift B",
    });
    expect(recipient).toHaveTextContent("•••• 7890");
    expect(recipient).not.toHaveTextContent("1234567890");
    await user.click(
      within(recipient).getByRole("button", { name: "Simulate sent" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Simulation sent recorded for Maintenance Shift B.",
    );
  });

  it("persists successful and failed deterministic simulations after reload", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    const firstRender = render(
      <App
        initialEntries={["/notifications"]}
        initialPersona="admin"
        service={service}
      />,
    );

    const recipient = await screen.findByRole("listitem", {
      name: "Operations Human Resources",
    });
    await user.click(
      within(recipient).getByRole("button", { name: "Simulate sent" }),
    );
    await user.click(
      within(recipient).getByRole("button", { name: "Simulate failed" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Simulation failed recorded for Operations Human Resources.",
    );

    firstRender.unmount();
    render(
      <App
        initialEntries={["/notifications"]}
        initialPersona="admin"
        service={createMockSawService({ storage: window.localStorage })}
      />,
    );
    expect((await screen.findAllByText("Sent · SIMULATION")).length).toBeGreaterThan(1);
    expect(screen.getAllByText("Failed · SIMULATION")).not.toHaveLength(0);
  });

  it("deletes recipients and shows a visible service error when deletion fails", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: null });
    service.deleteNotificationRecipient = async () => {
      throw new Error("Notification recipient could not be deleted.");
    };
    render(
      <App
        initialEntries={["/notifications"]}
        initialPersona="admin"
        service={service}
      />,
    );

    const recipient = await screen.findByRole("listitem", {
      name: "Operations Human Resources",
    });
    await user.click(
      within(recipient).getByRole("button", { name: "Delete recipient" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Notification recipient could not be deleted.",
    );
    expect(recipient).toBeInTheDocument();
  });

  it("deletes a recipient from the persisted configuration", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    render(
      <App
        initialEntries={["/notifications"]}
        initialPersona="admin"
        service={service}
      />,
    );

    const recipient = await screen.findByRole("listitem", {
      name: "Supervisor Maintenance",
    });
    await user.click(
      within(recipient).getByRole("button", { name: "Delete recipient" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Notification recipient deleted: Supervisor Maintenance.",
    );
    expect(
      screen.queryByRole("listitem", { name: "Supervisor Maintenance" }),
    ).not.toBeInTheDocument();
    expect(
      (await service.getNotificationRecipients()).some(
        (item) => item.name === "Supervisor Maintenance",
      ),
    ).toBe(false);
  });

  it("reports English simulation and loading errors", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: null });
    service.simulateNotification = async () => {
      throw new Error("No Violation Event is available for simulation.");
    };
    const firstRender = render(
      <App
        initialEntries={["/notifications"]}
        initialPersona="admin"
        service={service}
      />,
    );
    const recipient = await screen.findByRole("listitem", {
      name: "Operations Human Resources",
    });
    await user.click(
      within(recipient).getByRole("button", { name: "Simulate sent" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No Violation Event is available for simulation.",
    );

    firstRender.unmount();
    render(
      <App
        initialEntries={["/notifications"]}
        initialPersona="admin"
        service={createMockSawService({ scenario: "error", storage: null })}
      />,
    );
    expect(
      await screen.findByText("Notification configuration could not be loaded."),
    ).toBeInTheDocument();
  });
});
