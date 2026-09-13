import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "../../App";
import { createMockSawService } from "../../services/saw-service";

describe("Hazardous Zones", () => {
  it("deactivates a Hazardous Zone while retaining its audit-safe lifecycle", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: null });
    render(<App initialEntries={["/hazardous-zones"]} initialPersona="admin" service={service} />);

    await user.click(await screen.findByRole("button", { name: "Edit Main Gate Zone" }));
    expect(screen.getByText(/Deactivation is the primary action:/)).toBeInTheDocument();
    expect(screen.getByText(/cannot be permanently deleted/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Deactivate Hazardous Zone" }));
    await user.click(screen.getByRole("button", { name: "Confirm deactivation" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Hazardous Zone Main Gate Zone deactivated.");
    expect((await service.getHazardousZone()).find((zone) => zone.id === "ZON-01")?.active).toBe(false);
  });
});
