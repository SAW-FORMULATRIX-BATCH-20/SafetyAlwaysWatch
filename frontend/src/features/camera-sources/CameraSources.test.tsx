import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "../../App";
import { createMockSawService } from "../../services/saw-service";

describe("Camera Sources", () => {
  it("filters Camera Sources and persists safe metadata changes in English", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    const firstRender = render(
      <App initialEntries={["/camera-sources"]} initialPersona="admin" service={service} />,
    );

    await user.type(await screen.findByRole("textbox", { name: "Search Camera Source" }), "Production");
    expect(screen.getByText("Showing 1 of 2 Camera Sources")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "View details Production Gate" }));
    const name = screen.getByRole("textbox", { name: "Camera Source name" });
    await user.clear(name);
    await user.type(name, "Production Floor Camera");
    await user.click(screen.getByRole("button", { name: "Save metadata demo" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Camera Source metadata updated.");

    firstRender.unmount();
    render(
      <App
        initialEntries={["/camera-sources"]}
        initialPersona="admin"
        service={createMockSawService({ storage: window.localStorage })}
      />,
    );
    expect(await screen.findByText("Production Floor Camera")).toBeInTheDocument();
  });

  it("presents Camera Source load failures in English", async () => {
    render(
      <App
        initialEntries={["/camera-sources"]}
        initialPersona="admin"
        service={createMockSawService({ scenario: "error", storage: null })}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Camera Sources could not be loaded");
  });

  it("applies status filtering and role-scoped access", async () => {
    const user = userEvent.setup();
    const supervisorRender = render(
      <App initialEntries={["/camera-sources"]} initialPersona="supervisor" service={createMockSawService({ storage: null })} />,
    );

    expect(await screen.findByRole("article", { name: "Production Gate" })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Warehouse Raw Materials" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Save metadata/i })).not.toBeInTheDocument();

    supervisorRender.unmount();
    render(<App initialEntries={["/camera-sources"]} initialPersona="admin" service={createMockSawService({ storage: null })} />);
    await user.selectOptions(await screen.findByRole("combobox", { name: "Filter status" }), "offline");
    expect(screen.getByRole("article", { name: "Warehouse Raw Materials" })).toHaveTextContent("Offline");
    expect(screen.queryByRole("article", { name: "Production Gate" })).not.toBeInTheDocument();
  });

  it.each([
    ["empty", "No Camera Sources are registered"],
    ["loading", "Loading Camera Sources…"],
  ] as const)("presents the %s Camera Source state", async (scenario, expectedText) => {
    render(<App initialEntries={["/camera-sources"]} initialPersona="admin" service={createMockSawService({ scenario, storage: null })} />);

    expect(await screen.findByText(expectedText)).toBeInTheDocument();
  });

  it("denies Human Resources access to Camera Sources", () => {
    render(<App initialEntries={["/camera-sources"]} initialPersona="hrd" service={createMockSawService({ storage: null })} />);

    expect(screen.getByRole("heading", { name: "Restricted access" })).toBeInTheDocument();
  });
});
