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
});
