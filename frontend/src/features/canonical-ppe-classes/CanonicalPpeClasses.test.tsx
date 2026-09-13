import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "../../App";
import { createMockSawService } from "../../services/saw-service";

describe("Canonical PPE Classes", () => {
  it("validates duplicate YOLO indices and presents the mapping preview in English", async () => {
    const user = userEvent.setup();
    render(
      <App
        initialEntries={["/canonical-ppe-classes"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    await user.click(await screen.findByRole("button", { name: "Add mapping" }));
    await user.type(screen.getByRole("spinbutton", { name: "YOLO index" }), "0");
    await user.type(screen.getByRole("textbox", { name: "Raw label" }), "helmet-copy");
    await user.type(screen.getByRole("textbox", { name: "Canonical PPE Class" }), "Safety Helmet");
    expect(screen.getByLabelText("Mapping interpretation preview")).toHaveTextContent("helmet-copy");
    await user.click(screen.getByRole("button", { name: "Save mapping" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("YOLO index 0 is already in use.");
  });
});
