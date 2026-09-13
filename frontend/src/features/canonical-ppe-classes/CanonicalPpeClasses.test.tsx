import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "../../App";
import { createMockSawService } from "../../services/saw-service";
import { mockMediaQuery } from "../../test/mockMediaQuery";

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

  it("persists an edited mapping and demo-only ONNX metadata after refresh", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    const firstRender = render(<App initialEntries={["/canonical-ppe-classes"]} initialPersona="admin" service={service} />);

    await user.click(await screen.findByRole("button", { name: "Edit mapping mask" }));
    const canonicalClass = screen.getByRole("textbox", { name: "Canonical PPE Class" });
    await user.clear(canonicalClass);
    await user.type(canonicalClass, "Medical Face Mask");
    await user.click(screen.getByRole("button", { name: "Save mapping" }));
    expect(await screen.findByText("Canonical PPE Class mapping saved.")).toBeInTheDocument();

    const modelFile = new File(["demo"], "ppe-model.onnx", { type: "application/octet-stream" });
    await user.upload(screen.getByLabelText("Select ONNX demo file"), modelFile);
    expect(await screen.findByText("ppe-model.onnx")).toBeInTheDocument();
    expect(screen.getByText(/ONNX model validation and inference require a backend/i)).toBeInTheDocument();

    firstRender.unmount();
    render(<App initialEntries={["/canonical-ppe-classes"]} initialPersona="admin" service={createMockSawService({ storage: window.localStorage })} />);
    expect(await screen.findByText("Medical Face Mask")).toBeInTheDocument();
    expect(screen.getByText("ppe-model.onnx")).toBeInTheDocument();
  });

  it("provides an accessible mobile mapping alternative", async () => {
    const restoreMediaQuery = mockMediaQuery("(max-width: 767px)");

    try {
      render(<App initialEntries={["/canonical-ppe-classes"]} initialPersona="admin" service={createMockSawService({ storage: null })} />);
      const mappings = await screen.findByRole("list", { name: "Canonical PPE Class mappings for mobile" });
      expect(within(mappings).getByRole("listitem", { name: /helmet/i })).toHaveTextContent("YOLO index");
    } finally {
      restoreMediaQuery();
    }
  });
});
