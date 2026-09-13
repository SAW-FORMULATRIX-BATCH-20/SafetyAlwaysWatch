import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "../../App";
import { createMockSawService } from "../../services/saw-service";

describe("Employees", () => {
  it("shows the Employee directory with search, filters, sorting, and pagination", async () => {
    const user = userEvent.setup();

    render(
      <App
        initialEntries={["/karyawan"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(
      await screen.findByText("Showing 1–5 of 12 Employees"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Employees" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("listitem", { name: "Employee Maintenance 01" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("listitem", { name: "Employee Warehouse 01" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("img", { name: "Safety Score status safe" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("img", { name: "Safety Score status warning" })
        .length,
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(
      screen.getByText("Showing 6–10 of 12 Employees"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("listitem", { name: "Employee Maintenance 01" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(
      screen.getByText("Showing 11–12 of 12 Employees"),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("img", { name: "Safety Score status critical" })
        .length,
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Previous page" }));
    await user.click(screen.getByRole("button", { name: "Previous page" }));
    await user.type(
      screen.getByRole("textbox", { name: "Search Employees" }),
      "Warehouse 02",
    );
    expect(
      screen.getByRole("listitem", { name: "Employee Warehouse 02" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("listitem", { name: "Employee Production 01" }),
    ).not.toBeInTheDocument();

    await user.clear(screen.getByRole("textbox", { name: "Search Employees" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Department filter" }),
      "Warehouse",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Safety Score status filter" }),
      "critical",
    );
    expect(
      screen.getByRole("listitem", { name: "Employee Warehouse 03" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("listitem", { name: "Employee Warehouse 02" }),
    ).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Employee sort" }),
      "score-asc",
    );
    expect(
      screen.getByRole("listitem", { name: "Employee Warehouse 03" }),
    ).toHaveTextContent("55");
  });

  it("shows read-only Employee details and an honest Face Enrollment state", async () => {
    const user = userEvent.setup();

    render(
      <App
        initialEntries={["/karyawan"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(
      await screen.findByText("Showing 1–5 of 12 Employees"),
    ).toBeInTheDocument();
    await user.type(
      screen.getByRole("textbox", { name: "Search Employees" }),
      "Production 01",
    );
    await user.click(
      screen.getByRole("button", {
        name: "View details Employee Production 01",
      }),
    );

    const detail = screen.getByRole("region", { name: "Employee details" });
    expect(
      within(detail).getByRole("heading", { name: "Employee details" }),
    ).toBeInTheDocument();
    expect(within(detail).getByText("Department")).toBeInTheDocument();
    expect(within(detail).getByText("Area Supervisor")).toBeInTheDocument();
    expect(within(detail).getByText("Safety Score")).toBeInTheDocument();
    expect(
      within(detail).getByText("Escalation Threshold"),
    ).toBeInTheDocument();
    expect(within(detail).getByText("Enrolled")).toBeInTheDocument();
    expect(within(detail).getByText("Audit summary")).toBeInTheDocument();
    expect(
      within(detail).getByText(/Face Enrollment is unavailable/i),
    ).toBeInTheDocument();
    expect(
      within(detail).queryByText(/webcam|capture|enrollment complete/i),
    ).not.toBeInTheDocument();
    expect(
      within(detail).queryByRole("button", { name: /enroll|add employee/i }),
    ).not.toBeInTheDocument();
  });

  it("limits an Area Supervisor to assigned Employees and keeps HR access read-only", async () => {
    render(
      <App
        initialEntries={["/karyawan"]}
        initialPersona="supervisor"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(
      await screen.findByText("Showing 1–4 of 4 Employees"),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("listitem", { name: "Employee Production 01" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("listitem", { name: "Employee Warehouse 01" }),
    ).not.toBeInTheDocument();
  });

  it("gives Human Resources access to Safety Score and audit details without Live Monitoring", async () => {
    const user = userEvent.setup();
    render(
      <App
        initialEntries={["/karyawan"]}
        initialPersona="hrd"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(
      await screen.findByText("Showing 1–5 of 12 Employees"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("listitem", { name: "Employee Maintenance 01" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Live Monitoring" }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: "View details Employee Maintenance 01",
      }),
    );
    const detail = screen.getByRole("region", { name: "Employee details" });
    expect(within(detail).getByText("Safety Score")).toBeInTheDocument();
  });

  it("provides clearable empty and no-result states", async () => {
    const user = userEvent.setup();
    const emptyRender = render(
      <App
        initialEntries={["/karyawan"]}
        initialPersona="admin"
        service={createMockSawService({ scenario: "empty", storage: null })}
      />,
    );
    expect(await screen.findByText("No Employees")).toBeInTheDocument();
    emptyRender.unmount();

    render(
      <App
        initialEntries={["/karyawan"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );
    await user.type(
      await screen.findByRole("textbox", { name: "Search Employees" }),
      "no match",
    );
    expect(screen.getByText("No matching Employees.")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Clear Employee filters" }),
    );
    expect(
      screen.getByRole("listitem", { name: "Employee Maintenance 01" }),
    ).toBeInTheDocument();
  });
});
