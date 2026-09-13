import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "../../App";
import { createMockSawService } from "../../services/saw-service";

describe("Compliance Report", () => {
  it("derives report summaries and charts from the filtered observations", async () => {
    const user = userEvent.setup();
    render(<App initialEntries={["/compliance-report"]} initialPersona="hrd" service={createMockSawService({ storage: null })} />);
    await user.selectOptions(await screen.findByRole("combobox", { name: "Report Hazardous Zone filter" }), "ZON-03");
    await user.selectOptions(screen.getByRole("combobox", { name: "Report department filter" }), "Warehouse");
    await user.selectOptions(screen.getByRole("combobox", { name: "Report Employee filter" }), "EMP-05");
    fireEvent.change(screen.getByLabelText("Report start date"), { target: { value: "2026-09-03" } });
    fireEvent.change(screen.getByLabelText("Report end date"), { target: { value: "2026-09-03" } });

    expect(screen.getByText("1 PPE Compliance observations")).toBeInTheDocument();
    expect(await screen.findByRole("region", { name: "PPE Compliance trend" })).toHaveTextContent("03 Sept");
    expect(screen.getByRole("region", { name: "Canonical PPE Classes breakdown" })).toHaveTextContent("Safety Helmet");
  });

  it("clears a no-result filter combination", async () => {
    const user = userEvent.setup();
    render(<App initialEntries={["/compliance-report"]} initialPersona="hrd" service={createMockSawService({ storage: null })} />);

    await user.selectOptions(await screen.findByRole("combobox", { name: "Report Hazardous Zone filter" }), "ZON-04");
    await user.selectOptions(screen.getByRole("combobox", { name: "Report department filter" }), "Production");
    expect(screen.getByText("No matching report results.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear report filters" }));
    expect(screen.getByText("8 PPE Compliance observations")).toBeInTheDocument();
  });

  it.each([
    ["loading", "Loading Compliance Report…"],
    ["empty", "No PPE Compliance observations yet"],
    ["error", "The Compliance Report could not be loaded."],
  ] as const)("presents the %s state in English", async (scenario, expectedText) => {
    render(<App initialEntries={["/compliance-report"]} initialPersona="hrd" service={createMockSawService({ scenario, storage: null })} />);

    expect(await screen.findByText(expectedText)).toBeInTheDocument();
  });
});
