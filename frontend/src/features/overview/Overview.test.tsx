import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "../../App";
import { createMockSawService } from "../../services/saw-service";

describe("Overview", () => {
  it("shows calculated English safety metrics from deterministic seed data", async () => {
    render(
      <App
        initialEntries={["/overview"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByText("Employees below the Escalation Threshold")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByText("83%", { selector: "strong" })).toBeInTheDocument();
  });

  it.each([
    ["loading", "Loading safety overview…"],
    ["empty", "No demo data"],
    ["error", "SAW demo data could not be loaded"],
  ] as const)("presents the %s Overview state in English", async (scenario, expectedText) => {
    render(<App initialEntries={["/overview"]} initialPersona="admin" service={createMockSawService({ scenario, storage: null })} />);

    expect(await screen.findByText(expectedText)).toBeInTheDocument();
  });
});
