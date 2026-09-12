import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "../../App";
import { createMockSawService } from "../../services/saw-service";

describe("Violations", () => {
  it("shows an auditable Violation History without a snapshot", async () => {
    const user = userEvent.setup();

    const service = createMockSawService({ storage: null });

    render(
      <App
        initialEntries={["/pelanggaran"]}
        initialPersona="admin"
        service={service}
      />,
    );

    expect(
      await screen.findByRole("button", { name: "View details VIO-01" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Violation History" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "View details VIO-02" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "View details VIO-02" }),
    );

    const detail = screen.getByLabelText("Violation Event details VIO-02");
    expect(
      within(detail).getByRole("heading", { name: "Violation Event details" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Unknown").length).toBeGreaterThan(1);
    expect(screen.getAllByText(/WIB/).length).toBeGreaterThan(1);
    expect(
      within(detail).getByText("Violation Episode timeline"),
    ).toBeInTheDocument();
    expect(within(detail).getByText("Face Mask")).toBeInTheDocument();
    expect(
      within(detail).getByText("Detection Confidence"),
    ).toBeInTheDocument();
    expect(
      within(detail).getByText("Notification recipients"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/snapshot/i)).not.toBeInTheDocument();
  });

  it("filters and sorts Violation History in a paginated list", async () => {
    const user = userEvent.setup();

    render(
      <App
        initialEntries={["/pelanggaran"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    await screen.findByRole("button", { name: "View details VIO-01" });
    expect(
      screen.queryByRole("button", { name: "View details VIO-04" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(
      screen.getByRole("button", { name: "View details VIO-04" }),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Violation history sort" }),
      "newest",
    );
    expect(
      within(
        screen.getByRole("list", { name: "Violation history" }),
      ).getAllByRole("listitem")[0],
    ).toHaveTextContent("VIO-05");

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Camera Source filter" }),
      "CAM-02",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Department filter" }),
      "Production",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Episode status filter" }),
      "cleared",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Violation history sort" }),
      "confidence-desc",
    );

    expect(
      screen.getByRole("button", { name: "View details VIO-04" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "View details VIO-03" }),
    ).not.toBeInTheDocument();
  });

  it("applies search, Hazardous Zone, Employee, and date filters to Violation History", async () => {
    const user = userEvent.setup();

    render(
      <App
        initialEntries={["/pelanggaran"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    await screen.findByRole("button", { name: "View details VIO-01" });
    await user.type(
      screen.getByRole("textbox", { name: "Search Violation History" }),
      "Unknown",
    );
    expect(
      screen.getByRole("button", { name: "View details VIO-02" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "View details VIO-01" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Hazardous Zone filter" }),
      "ZON-04",
    );
    expect(
      screen.getByRole("button", { name: "View details VIO-02" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Employee filter" }),
      "unidentified",
    );
    expect(
      screen.getByRole("button", { name: "View details VIO-02" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    fireEvent.change(screen.getByLabelText("Violation start date"), {
      target: { value: "2026-09-05" },
    });
    fireEvent.change(screen.getByLabelText("Violation end date"), {
      target: { value: "2026-09-05" },
    });
    expect(
      screen.getByRole("button", { name: "View details VIO-05" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "View details VIO-04" }),
    ).not.toBeInTheDocument();
  });

  it("persists Safety Score changes and Clearing transitions in Violation History", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: null });

    render(
      <App
        initialEntries={["/monitoring/live"]}
        initialPersona="supervisor"
        service={service}
      />,
    );

    await screen.findByRole("heading", { name: "Live Monitoring" });
    await user.click(
      screen.getByRole("button", { name: "Missing PPE scenario" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Process non-compliant frame" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Process compliant frame" }),
    );
    expect(screen.getByText("Clearing")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Process non-compliant frame" }),
    );
    expect(
      screen.getByRole("region", { name: "Episode status" }),
    ).toHaveTextContent("Violation");

    await user.click(screen.getByRole("link", { name: "Violations" }));
    await screen.findByRole("heading", { name: "Violation History" });
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Violation history sort" }),
      "newest",
    );
    await user.click(
      screen.getByRole("button", { name: "View details VIO-SIM-01" }),
    );

    const detail = screen.getByLabelText("Violation Event details VIO-SIM-01");
    expect(within(detail).getByText("92 → 84")).toBeInTheDocument();
    expect(
      within(detail).getByText("Violation Episode entered Clearing."),
    ).toBeInTheDocument();
    expect(
      within(detail).getByText(
        "PPE became non-compliant again; the Violation Episode returned to Violation.",
      ),
    ).toBeInTheDocument();
  });

  it.each([
    ["loading", "Loading Violation History…"],
    ["empty", "No Violation Events"],
    ["error", "Violation History could not be loaded"],
  ] as const)(
    "shows the %s state for Violation History",
    async (scenario, expectedText) => {
      render(
        <App
          initialEntries={["/pelanggaran"]}
          initialPersona="admin"
          service={createMockSawService({ scenario, storage: null })}
        />,
      );

      expect(await screen.findByText(expectedText)).toBeInTheDocument();
    },
  );
});
