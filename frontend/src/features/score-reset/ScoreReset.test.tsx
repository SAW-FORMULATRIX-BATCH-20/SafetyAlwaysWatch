import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "../../App";
import { createMockSawService } from "../../services/saw-service";

describe("Score Reset", () => {
  it("requires a note for Other and records an auditable Score Reset", async () => {
    const user = userEvent.setup();
    render(
      <App
        initialEntries={["/score-reset"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    await screen.findByRole("heading", { name: "Score Reset" });
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Employee to reset" }),
      "EMP-01",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Score Reset reason" }),
      "Other",
    );
    await user.click(
      screen.getByRole("button", { name: "Review Score Reset" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "A note is required for the Other reason.",
    );

    await user.type(
      screen.getByRole("textbox", { name: "Reason note" }),
      "Investigation evidence corrected.",
    );
    await user.click(
      screen.getByRole("button", { name: "Review Score Reset" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Review Score Reset" }),
    ).toHaveTextContent("92 → 100");
    await user.click(
      screen.getByRole("button", { name: "Continue to confirmation" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirm Score Reset" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Score Reset saved.",
    );
    expect(
      screen.getByRole("region", { name: "Score Reset audit" }),
    ).toHaveTextContent("Investigation evidence corrected.");
    expect(
      screen.getByRole("region", { name: "Score Reset audit" }),
    ).toHaveTextContent("Configured Initial Safety Score: 100");
    expect(
      screen.getByRole("region", { name: "Score Reset audit" }),
    ).toHaveTextContent("Actor: Admin/Safety Officer");
  });

  it("cancels Score Reset confirmation without mutating the audit or Safety Score", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: null });
    render(
      <App
        initialEntries={["/score-reset"]}
        initialPersona="admin"
        service={service}
      />,
    );

    await screen.findByRole("heading", { name: "Score Reset" });
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Employee to reset" }),
      "EMP-01",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Score Reset reason" }),
      "InvestigationClosed",
    );
    await user.click(
      screen.getByRole("button", { name: "Review Score Reset" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Continue to confirmation" }),
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      (await service.getEmployeeDirectory()).employees.find(
        (employee) => employee.id === "EMP-01",
      )?.safetyScore,
    ).toBe(92);
    expect(await service.getSafetyScoreAudit("EMP-01")).toEqual({
      periods: [],
      ledger: [],
      resetLogs: [],
    });
  });

  it("persists a Score Reset and presents the audit after reload", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    const firstRender = render(
      <App
        initialEntries={["/score-reset"]}
        initialPersona="admin"
        service={service}
      />,
    );

    await screen.findByRole("heading", { name: "Score Reset" });
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Employee to reset" }),
      "EMP-01",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Score Reset reason" }),
      "InvestigationClosed",
    );
    await user.click(
      screen.getByRole("button", { name: "Review Score Reset" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Continue to confirmation" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirm Score Reset" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Score Reset saved.",
    );

    firstRender.unmount();
    render(
      <App
        initialEntries={["/score-reset"]}
        initialPersona="admin"
        service={createMockSawService({ storage: window.localStorage })}
      />,
    );
    await user.selectOptions(
      await screen.findByRole("combobox", { name: "Employee to reset" }),
      "EMP-01",
    );
    const audit = await screen.findByRole("region", { name: "Score Reset audit" });
    expect(audit).toHaveTextContent("Reason: Investigation closed");
    expect(audit).toHaveTextContent("Safety Score: 92 → 100");
  });

  it("presents a loading error in English", async () => {
    render(
      <App
        initialEntries={["/score-reset"]}
        initialPersona="admin"
        service={createMockSawService({ scenario: "error", storage: null })}
      />,
    );

    expect(await screen.findByText("Employee Directory could not be loaded.")).toBeInTheDocument();
  });

  it("filters employees by search query and score filter chips", async () => {
    const user = userEvent.setup();
    render(
      <App
        initialEntries={["/score-reset"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    await screen.findByRole("heading", { name: "Score Reset" });

    const searchInput = screen.getByRole("textbox", {
      name: "Filter employee list",
    });
    await user.type(searchInput, "EMP-01");

    const combobox = screen.getByRole("combobox", {
      name: "Employee to reset",
    });
    expect(combobox).toHaveTextContent("EMP-01");

    await user.click(
      screen.getByRole("button", { name: "Clear employee search" }),
    );
    expect(searchInput).toHaveValue("");

    const needsResetChip = screen.getByRole("button", {
      name: /Needs Reset/i,
    });
    await user.click(needsResetChip);
    expect(combobox).toHaveTextContent("EMP-01");
  });

  it("dismisses error toast when dismiss button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <App
        initialEntries={["/score-reset"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    await screen.findByRole("heading", { name: "Score Reset" });
    await user.click(
      screen.getByRole("button", { name: "Review Score Reset" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Select an Employee to reset.",
    );

    await user.click(screen.getByRole("button", { name: "Dismiss error" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
