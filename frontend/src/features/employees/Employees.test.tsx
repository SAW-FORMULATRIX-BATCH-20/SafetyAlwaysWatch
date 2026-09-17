import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { App } from "../../App";
import { createMockSawService } from "../../services/saw-service";
import { useAuthStore } from "../../stores/useAuthStore";
import { useEmployeeStore } from "../../stores/useEmployeeStore";

describe("Employees", () => {
  beforeEach(() => {
    useEmployeeStore.getState().clearFilters();
    useAuthStore.getState().logout();
  });
  it("lets an Admin/Safety Officer register an Employee and view the dedicated detail route", async () => {
    const user = userEvent.setup();

    render(
      <App
        initialEntries={["/employees"]}
        initialPersona="admin"
        service={createMockSawService({ storage: window.localStorage })}
      />,
    );

    await user.click(await screen.findByRole("link", { name: "Add employee" }));
    await user.type(screen.getByRole("textbox", { name: "Employee code" }), " emp-013 ");
    await user.type(screen.getByRole("textbox", { name: "Full name" }), " Avery Tan ");
    await user.type(screen.getByRole("combobox", { name: "Department" }), " Quality Assurance ");
    expect(screen.queryByRole("combobox", { name: "Direct supervisor" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Email" })).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create Employee" }));

    const detail = await screen.findByRole("region", { name: "Employee details" });
    expect(screen.getByRole("status")).toHaveTextContent("Employee EMP-013 was created");
    expect(detail).toHaveTextContent("EMP-013");
    expect(detail).toHaveTextContent("Avery Tan");
    expect(detail).toHaveTextContent("Quality Assurance");
    expect(detail).toHaveTextContent("Active");
    expect(detail).toHaveTextContent("100");
    expect(detail).toHaveTextContent("Not enrolled");
    expect(detail).toHaveTextContent("0");
    expect(screen.getByRole("link", { name: "Enroll face" })).toBeInTheDocument();
  });

  it("keeps correctable values and announces a case-insensitive Employee code conflict", async () => {
    const user = userEvent.setup();
    render(<App initialEntries={["/employees/new"]} initialPersona="admin" service={createMockSawService({ storage: null })} />);

    await user.type(await screen.findByRole("textbox", { name: "Employee code" }), "emp-01");
    await user.type(screen.getByRole("textbox", { name: "Full name" }), "Avery Tan");
    await user.type(screen.getByRole("combobox", { name: "Department" }), "Production");
    await user.click(screen.getByRole("button", { name: "Create Employee" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("already exists");
    expect(screen.getByRole("textbox", { name: "Full name" })).toHaveValue("Avery Tan");
  });

  it("shows the Employee directory with search, filters, sorting, and pagination", async () => {
    const user = userEvent.setup();

    render(
      <App
        initialEntries={["/employees"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(
      await screen.findByText("Showing 1–6 of 12 Employees"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Employees" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("listitem", { name: "Employee Maintenance 01" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("img", { name: "Safety Score status safe" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("img", { name: "Safety Score status warning" })
        .length,
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(
      screen.getByText("Showing 7–12 of 12 Employees"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("listitem", { name: "Employee Maintenance 01" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("img", { name: "Safety Score status critical" })
        .length,
    ).toBeGreaterThan(0);

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

  it("shows an Employee detail route and the next Face Enrollment action for an Admin/Safety Officer", async () => {
    const user = userEvent.setup();

    render(
      <App
        initialEntries={["/employees"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(
      await screen.findByText("Showing 1–6 of 12 Employees"),
    ).toBeInTheDocument();
    await user.type(
      screen.getByRole("textbox", { name: "Search Employees" }),
      "Production 01",
    );
    await user.click(
      screen.getByRole("link", {
        name: "View details Employee Production 01",
      }),
    );

    const detail = await screen.findByRole("region", { name: "Employee details" });
    expect(within(detail).getByText("Department")).toBeInTheDocument();
    expect(within(detail).getByText("Direct supervisor")).toBeInTheDocument();
    expect(within(detail).getByText("Safety Score")).toBeInTheDocument();
    expect(within(detail).getByText("Active Face Samples")).toBeInTheDocument();
    expect(within(detail).getByText("Enrolled")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Enroll face" })).toBeInTheDocument();
  });

  it("limits an Area Supervisor to assigned Employees and keeps HR access read-only", async () => {
    render(
      <App
        initialEntries={["/employees"]}
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
        initialEntries={["/employees"]}
        initialPersona="hrd"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(
      await screen.findByText("Showing 1–6 of 12 Employees"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("listitem", { name: "Employee Maintenance 01" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Live Monitoring" }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("link", {
        name: "View details Employee Maintenance 01",
      }),
    );
    const detail = await screen.findByRole("region", { name: "Employee details" });
    expect(within(detail).getByText("Safety Score")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Add employee" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Enroll face" })).not.toBeInTheDocument();
  });

  it.each(["hrd", "supervisor"] as const)("restricts direct Employee registration for the %s persona", (persona) => {
    render(<App initialEntries={["/employees/new"]} initialPersona={persona} service={createMockSawService({ storage: null })} />);

    expect(screen.getByRole("heading", { name: "Restricted access" })).toBeInTheDocument();
  });

  it("does not expose an out-of-scope Employee through an Area Supervisor's direct URL", async () => {
    render(<App initialEntries={["/employees/EMP-05"]} initialPersona="supervisor" service={createMockSawService({ storage: null })} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("could not be found");
  });

  it("provides clearable empty and no-result states", async () => {
    const user = userEvent.setup();
    const emptyRender = render(
      <App
        initialEntries={["/employees"]}
        initialPersona="admin"
        service={createMockSawService({ scenario: "empty", storage: null })}
      />,
    );
    expect(await screen.findByText("No Employees")).toBeInTheDocument();
    emptyRender.unmount();

    render(
      <App
        initialEntries={["/employees"]}
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

  it("handles optional email and password with validation and visibility toggle", async () => {
    const user = userEvent.setup();
    render(
      <App
        initialEntries={["/employees/new"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    const emailInput = await screen.findByRole("textbox", { name: "Email" });
    const passwordInput = screen.getByLabelText("Password");
    const toggleButton = screen.getByRole("button", { name: "Show password" });

    // Test password toggle
    expect(passwordInput).toHaveAttribute("type", "password");
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(passwordInput).toHaveAttribute("type", "password");

    // Test invalid email validation
    await user.type(screen.getByRole("textbox", { name: "Employee code" }), "EMP-999");
    await user.type(screen.getByRole("textbox", { name: "Full name" }), "Test User");
    await user.type(screen.getByRole("combobox", { name: "Department" }), "Security");
    await user.type(emailInput, "not-an-email");
    await user.click(screen.getByRole("button", { name: "Create Employee" }));

    expect(await screen.findByText("Please enter a valid email address.")).toBeInTheDocument();

    // Fix email and add password
    await user.clear(emailInput);
    await user.type(emailInput, "test.user@company.com");
    await user.type(passwordInput, "secret123");
    await user.click(screen.getByRole("button", { name: "Create Employee" }));

    expect(await screen.findByRole("region", { name: "Employee details" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Employee EMP-999 was created");
  });
});

