import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { App } from "../../App";
import {
  createMockSawService,
  seedData,
  type ViolationRecord,
} from "../../services/saw-service";
import { useViolationsStore } from "../../stores/useViolationsStore";

describe("Violations", () => {
  beforeEach(() => {
    useViolationsStore.getState().reset();
  });
  it("shows an auditable Violation History without a snapshot", async () => {
    const user = userEvent.setup();

    const service = createMockSawService({ storage: null });

    render(
      <App
        initialEntries={["/violations"]}
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

    const paginatedViolations: ViolationRecord[] = [
      ...seedData.violations,
      {
        id: "VIO-06",
        status: "cleared",
        zoneId: "ZON-01",
        cameraId: "CAM-01",
        episodeId: "EPS-006",
        employeeId: "EMP-01",
        missingCanonicalPpeClasses: ["Safety Helmet"],
        confidence: 0.88,
        detectedAt: "2026-09-06T08:00:00+07:00",
        updatedAt: "2026-09-06T08:10:00+07:00",
      },
      {
        id: "VIO-07",
        status: "cleared",
        zoneId: "ZON-01",
        cameraId: "CAM-01",
        episodeId: "EPS-007",
        employeeId: "EMP-02",
        missingCanonicalPpeClasses: ["Safety Vest"],
        confidence: 0.87,
        detectedAt: "2026-09-06T09:00:00+07:00",
        updatedAt: "2026-09-06T09:10:00+07:00",
      },
      {
        id: "VIO-08",
        status: "cleared",
        zoneId: "ZON-02",
        cameraId: "CAM-01",
        episodeId: "EPS-008",
        employeeId: "EMP-03",
        missingCanonicalPpeClasses: ["Safety Helmet"],
        confidence: 0.86,
        detectedAt: "2026-09-06T10:00:00+07:00",
        updatedAt: "2026-09-06T10:10:00+07:00",
      },
      {
        id: "VIO-09",
        status: "cleared",
        zoneId: "ZON-02",
        cameraId: "CAM-01",
        episodeId: "EPS-009",
        employeeId: "EMP-04",
        missingCanonicalPpeClasses: ["Safety Vest"],
        confidence: 0.85,
        detectedAt: "2026-09-06T11:00:00+07:00",
        updatedAt: "2026-09-06T11:10:00+07:00",
      },
      {
        id: "VIO-10",
        status: "cleared",
        zoneId: "ZON-03",
        cameraId: "CAM-02",
        episodeId: "EPS-010",
        employeeId: "EMP-05",
        missingCanonicalPpeClasses: ["Safety Helmet"],
        confidence: 0.84,
        detectedAt: "2026-09-06T12:00:00+07:00",
        updatedAt: "2026-09-06T12:10:00+07:00",
      },
      {
        id: "VIO-11",
        status: "cleared",
        zoneId: "ZON-03",
        cameraId: "CAM-02",
        episodeId: "EPS-011",
        employeeId: "EMP-06",
        missingCanonicalPpeClasses: ["Safety Vest"],
        confidence: 0.83,
        detectedAt: "2026-09-06T13:00:00+07:00",
        updatedAt: "2026-09-06T13:10:00+07:00",
      },
    ];

    render(
      <App
        initialEntries={["/violations"]}
        initialPersona="admin"
        service={createMockSawService({
          storage: null,
          initialData: {
            ...seedData,
            violations: paginatedViolations,
          },
        })}
      />,
    );

    await screen.findByRole("button", { name: "View details VIO-01" });
    expect(
      screen.queryByRole("button", { name: "View details VIO-11" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(
      screen.getByRole("button", { name: "View details VIO-11" }),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Violation history sort" }),
      "newest",
    );
    expect(
      within(
        screen.getByRole("list", { name: "Violation history" }),
      ).getAllByRole("listitem")[0],
    ).toHaveTextContent("VIO-11");

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Department filter" }),
      "Production",
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

  it("applies search, Hazardous Zone, and date filters to Violation History", async () => {
    const user = userEvent.setup();

    render(
      <App
        initialEntries={["/violations"]}
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

    await user.click(
      await screen.findByRole("button", { name: "Missing PPE scenario" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Process non-compliant frame" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Process compliant frame" }),
    );
    expect(
      screen.getByRole("region", { name: "Episode status" }),
    ).toHaveTextContent("Clearing");
    await user.click(
      screen.getByRole("button", { name: "Process non-compliant frame" }),
    );
    expect(
      screen.getByRole("region", { name: "Episode status" }),
    ).toHaveTextContent("Violation");

    await user.click(screen.getByRole("link", { name: "Violations" }));
    await user.selectOptions(
      await screen.findByRole("combobox", { name: "Violation history sort" }),
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
          initialEntries={["/violations"]}
          initialPersona="admin"
          service={createMockSawService({ scenario, storage: null })}
        />,
      );

      expect(await screen.findByText(expectedText)).toBeInTheDocument();
    },
  );
});
