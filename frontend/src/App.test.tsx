import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "./App";
import { createMockSawService, type DemoData } from "./services/saw-service";

const withCameras = (cameras: DemoData["cameras"]): DemoData => ({
  cameras,
  compliance: { compliantObservations: 83, totalObservations: 100 },
  departments: ["Production", "Warehouse", "Maintenance"],
  employees: [{ id: "EMP-01", departmentId: "Production", safetyScore: 92 }],
  escalationThreshold: 60,
  violations: [{ id: "VIO-01", status: "confirmed" }],
  zones: ["ZON-01", "ZON-02", "ZON-03", "ZON-04"],
});

describe("SAW application", () => {
  it("shows an HRD PPE Compliance report whose summary and charts use the same observations", async () => {
    render(
      <App
        initialEntries={["/laporan-kepatuhan"]}
        initialPersona="hrd"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByText("8 PPE Compliance observations")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Compliance Report" })).toBeInTheDocument();
    expect(await screen.findByRole("region", { name: "PPE Compliance trend" })).toBeInTheDocument();
    expect(await screen.findByRole("region", { name: "Canonical PPE Classes breakdown" })).toBeInTheDocument();
    expect(await screen.findByRole("region", { name: "Safety status distribution" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Live Monitoring" })).not.toBeInTheDocument();
  });

  it("updates the whole report when Hazardous Zone, department, Employee, and date filters are combined", async () => {
    const user = userEvent.setup();

    render(
      <App
        initialEntries={["/laporan-kepatuhan"]}
        initialPersona="hrd"
        service={createMockSawService({ storage: null })}
      />,
    );

    await screen.findByRole("heading", { name: "Compliance Report" });
    await user.selectOptions(screen.getByRole("combobox", { name: "Report Hazardous Zone filter" }), "ZON-03");
    await user.selectOptions(screen.getByRole("combobox", { name: "Report department filter" }), "Warehouse");
    await user.selectOptions(screen.getByRole("combobox", { name: "Report Employee filter" }), "EMP-05");
    fireEvent.change(screen.getByLabelText("Report start date"), { target: { value: "2026-09-03" } });
    fireEvent.change(screen.getByLabelText("Report end date"), { target: { value: "2026-09-03" } });

    expect(screen.getByText("1 PPE Compliance observations")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "PPE Compliance trend" })).toHaveTextContent("03 Sep");
    expect(screen.getByRole("region", { name: "Canonical PPE Classes breakdown" })).toHaveTextContent("Safety Helmet");
    expect(screen.getByRole("region", { name: "Safety status distribution" })).toHaveTextContent("Warning");
  });

  it("shows no results and clears report filters", async () => {
    const user = userEvent.setup();

    render(
      <App
        initialEntries={["/laporan-kepatuhan"]}
        initialPersona="hrd"
        service={createMockSawService({ storage: null })}
      />,
    );

    await screen.findByText("8 PPE Compliance observations");
    await user.selectOptions(screen.getByRole("combobox", { name: "Report Hazardous Zone filter" }), "ZON-04");
    await user.selectOptions(screen.getByRole("combobox", { name: "Report department filter" }), "Production");

    expect(screen.getByText("No matching report results.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear report filters" }));
    expect(screen.getByText("8 PPE Compliance observations")).toBeInTheDocument();
  });

  it.each([
    ["loading", "Loading Compliance Report…"],
    ["empty", "No PPE Compliance observations yet"],
    ["error", "The Compliance Report could not be loaded."],
  ] as const)("shows the %s state for the PPE Compliance report", async (scenario, expectedText) => {
    render(
      <App
        initialEntries={["/laporan-kepatuhan"]}
        initialPersona="hrd"
        service={createMockSawService({ scenario, storage: null })}
      />,
    );

    expect(await screen.findByText(expectedText)).toBeInTheDocument();
  });

  it("shows persisted Notification simulation logs after a Safety Score escalation", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: null });

    render(<App initialEntries={["/monitoring/live"]} initialPersona="admin" service={service} />);

    await user.click(await screen.findByRole("button", { name: "Score escalation scenario" }));
    await user.click(screen.getByRole("button", { name: "Process non-compliant frame" }));
    expect(await screen.findByRole("status", { name: "Simulation notification feed" })).toHaveTextContent("3 simulated recipients recorded");
    await user.click(screen.getByRole("link", { name: "Notifications" }));
    expect((await screen.findAllByText(/VIO-SIM-01/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Sent · SIMULATION/).length).toBeGreaterThan(1);
  });

  it.each([
    ["/safety-parameters", "supervisor"],
    ["/safety-parameters", "hrd"],
    ["/score-reset", "supervisor"],
    ["/score-reset", "hrd"],
    ["/notifications", "supervisor"],
  ] as const)(
    "restricts direct route %s for the %s persona",
    (path, persona) => {
      render(
        <App
          initialEntries={[path]}
          initialPersona={persona}
          service={createMockSawService({ storage: null })}
        />,
      );

      expect(
        screen.getByRole("heading", { name: "Restricted access" }),
      ).toBeInTheDocument();
    },
  );

   it("mengarahkan Admin/Safety Officer ke Overview setelah login demo", async () => {
    const user = userEvent.setup();

    render(<App initialEntries={["/login"]} />);

    await user.click(
      screen.getByRole("radio", { name: /Admin\/Safety Officer/i }),
    );
    await user.click(screen.getByRole("button", { name: "Sign in to SAW" }));

    expect(
      await screen.findByRole("heading", { name: "Overview" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Admin/Safety Officer")).toBeInTheDocument();
  });

  it.each([
    ["Area Supervisor", "Live Monitoring"],
    ["Human Resources", "Compliance Report"],
  ])("mengarahkan %s ke %s setelah login demo", async (persona, landingPage) => {
    const user = userEvent.setup();

    render(<App initialEntries={["/login"]} />);

    await user.click(screen.getByRole("radio", { name: new RegExp(persona, "i") }));
    await user.click(screen.getByRole("button", { name: "Sign in to SAW" }));

    expect(
      await screen.findByRole("heading", { name: landingPage }),
    ).toBeInTheDocument();
  });

  it("membatasi URL Live Monitoring saat dibuka langsung oleh HRD", () => {
    render(
      <App initialEntries={["/monitoring/live"]} initialPersona="hrd" />,
    );

    expect(
      screen.getByRole("heading", { name: "Restricted access" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/not available to the Human Resources/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Live Monitoring" })).not.toBeInTheDocument();
  });

  it("shows simulated Live Monitoring with only an Area Supervisor's Camera Sources", async () => {
    render(
      <App
        initialEntries={["/monitoring/live"]}
        initialPersona="supervisor"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(screen.getByRole("heading", { name: "Live Monitoring" })).toBeInTheDocument();
    expect(await screen.findByRole("combobox", { name: "Select Camera Source" })).toHaveTextContent("Production Gate");
    expect(screen.getByRole("combobox", { name: "Select Camera Source" })).not.toHaveTextContent("Warehouse Raw Materials");
    expect(screen.getByLabelText("Detected Person")).toBeInTheDocument();
  });

  it("stops overlays when a Camera Source is offline without hiding the latest update", async () => {
    const user = userEvent.setup();
    render(
      <App
        initialEntries={["/monitoring/live"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    const selector = await screen.findByRole("combobox", { name: "Select Camera Source" });
    await user.selectOptions(selector, "CAM-02");

    expect(screen.getByText("CAMERA OFFLINE")).toBeInTheDocument();
    expect(screen.getAllByText(/Latest update/i)).not.toHaveLength(0);
    expect(screen.getAllByText(/WIB/)).not.toHaveLength(0);
    expect(screen.getByRole("img", { name: /dimmed latest frame/i })).toBeInTheDocument();
    expect(screen.queryByText("Detected Person")).not.toBeInTheDocument();
  });

  it("runs one missing-PPE Violation Episode without duplicating its Violation Event or score deduction", async () => {
    const user = userEvent.setup();
    render(
      <App
        initialEntries={["/monitoring/live"]}
        initialPersona="supervisor"
        service={createMockSawService({ storage: null })}
      />,
    );

    await screen.findByRole("heading", { name: "Live Monitoring" });
    await user.click(screen.getByRole("button", { name: "Missing PPE scenario" }));

    expect(screen.getByText("Pending Confirmation")).toBeInTheDocument();
    expect(screen.getByText(/Confirmation countdown: 5 seconds/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Detected Person · Pending Confirmation")).toHaveClass("border-dashed");

    await user.click(screen.getByRole("button", { name: "Process non-compliant frame" }));
    const episodeStatus = await screen.findByRole("region", { name: "Episode status" });
    expect(episodeStatus).toHaveTextContent("Violation");
    expect(episodeStatus).toHaveTextContent("Violation Event VIO-SIM-01");
    expect(episodeStatus).toHaveTextContent("Safety Score: 92 → 84");
    expect(screen.getByLabelText("Detected Person · Violation")).toHaveClass("border-red-500");

    await user.click(screen.getByRole("button", { name: "Process compliant frame" }));
    expect(screen.getByText("Clearing")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Process non-compliant frame" }));
    expect(screen.getByRole("region", { name: "Episode status" })).toHaveTextContent("Violation");

    await user.click(screen.getByRole("button", { name: "Process compliant frame" }));
    expect(screen.getByText("Clearing")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Process compliant frame" }));
    expect(screen.getByText("Cleared")).toBeInTheDocument();
    expect(screen.getAllByText(/Violation Event VIO-SIM-01/i)).toHaveLength(1);
  });

  it("provides unknown identity, low-confidence frame, offline camera, and score escalation scenarios", async () => {
    const user = userEvent.setup();
    render(
      <App
        initialEntries={["/monitoring/live"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    await screen.findByRole("heading", { name: "Live Monitoring" });
    await user.click(screen.getByRole("button", { name: "Normal operation scenario" }));
    expect(await screen.findByText(/PPE Compliance · Detected Person/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Unknown person scenario" }));
    expect(await screen.findByRole("region", { name: /Live Monitoring stage/i })).toHaveTextContent("Unknown");
    await user.click(screen.getByRole("button", { name: "Low-confidence frame" }));
    expect(screen.getByText("Pending Confirmation")).toBeInTheDocument();
    expect(screen.getByText(/frame below the minimum confidence/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Score escalation scenario" }));
    await user.click(screen.getByRole("button", { name: "Process non-compliant frame" }));
    expect(await screen.findByText(/Safety Score: 65 → 55/i)).toBeInTheDocument();
    expect(screen.getByText(/Escalation Threshold crossed: 60/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Camera offline scenario" }));
    expect(await screen.findByText("CAMERA OFFLINE")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Detected Person/)).not.toBeInTheDocument();
  });

  it("menampilkan kelompok navigasi sesuai hak akses Admin/Safety Officer", () => {
    render(
      <App initialEntries={["/overview"]} initialPersona="admin" />,
    );

    const navigation = screen.getByRole("navigation", { name: "Main navigation" });
    expect(navigation).toHaveTextContent("Overview");
    expect(navigation).toHaveTextContent("Monitoring");
    expect(navigation).toHaveTextContent("Safety Operations");
    expect(navigation).toHaveTextContent("Configuration");
    expect(navigation).toHaveTextContent("Administration");
  });

  it("shows Overview KPIs calculated from the SAW seed", async () => {
    render(
      <App
        initialEntries={["/overview"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByText("1", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("83%", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("2", { selector: "strong" })).toBeInTheDocument();
  });

  it("resets demo data to the seed and preserves it after refresh", async () => {
    const initialData = {
      cameras: [
        { id: "CAM-01", name: "Production Gate", location: "Main Production Line", zoneIds: ["ZON-01"], status: "online" as const, lastUpdatedAt: "2026-09-08T08:15:00+07:00", supervisorArea: "Production" },
        { id: "CAM-02", name: "Warehouse Raw Materials", location: "Warehouse Raw Materials", zoneIds: ["ZON-03"], status: "online" as const, lastUpdatedAt: "2026-09-08T08:00:00+07:00", supervisorArea: "Warehouse" },
      ],
      compliance: { compliantObservations: 50, totalObservations: 100 },
      departments: ["Production", "Warehouse", "Maintenance"],
      employees: [{ id: "EMP-01", departmentId: "Production", safetyScore: 40 }],
      escalationThreshold: 60,
      violations: [{ id: "VIO-01", status: "confirmed" as const }],
      zones: ["ZON-01", "ZON-02", "ZON-03", "ZON-04"],
    };
    const user = userEvent.setup();
    const firstRender = render(
      <App initialEntries={["/overview"]} initialPersona="admin" service={createMockSawService({ initialData, storage: window.localStorage })} />,
    );

    expect(await screen.findByText("2 / 2")).toBeInTheDocument();
    firstRender.unmount();
    const refreshedRender = render(
      <App initialEntries={["/overview"]} initialPersona="admin" service={createMockSawService({ storage: window.localStorage })} />,
    );
    expect(await screen.findByText("2 / 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset demo data" }));
    await user.click(screen.getAllByRole("button", { name: "Reset demo data" })[1]);
    expect(await screen.findByText("1 / 2")).toBeInTheDocument();

    refreshedRender.unmount();
    render(<App initialEntries={["/overview"]} initialPersona="admin" service={createMockSawService({ storage: window.localStorage })} />);
    expect(await screen.findByText("1 / 2")).toBeInTheDocument();
  });

  it.each([
    ["loading", "Loading safety overview…"],
    ["empty", "No demo data"],
    ["error", "SAW demo data could not be loaded"],
  ] as const)("menampilkan state %s Overview secara jelas", async (scenario, expectedText) => {
    render(<App initialEntries={["/overview"]} initialPersona="admin" service={createMockSawService({ scenario, storage: null })} />);

    expect(await screen.findByText(expectedText)).toBeInTheDocument();
  });

  it("shows seeded Camera Sources with status and deterministic WIB updates", async () => {
    render(
      <App
        initialEntries={["/konfigurasi/kamera"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByRole("article", { name: "Production Gate" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Production Gate" })).toHaveTextContent("Active");
    expect(screen.getByRole("article", { name: "Production Gate" })).toHaveTextContent("Main Production Line");
    expect(screen.getByRole("article", { name: "Production Gate" })).toHaveTextContent("ZON-01");
    expect(screen.getByRole("article", { name: "Production Gate" })).toHaveTextContent("WIB");
    expect(screen.getByRole("article", { name: "Warehouse Raw Materials" })).toHaveTextContent("Offline");
  });

  it("supports Camera Source search, status filtering, and details", async () => {
    const user = userEvent.setup();
    render(
      <App
        initialEntries={["/konfigurasi/kamera"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByRole("article", { name: "Production Gate" })).toBeInTheDocument();
    const search = screen.getByRole("textbox", { name: "Search Camera Source" });
    await user.type(search, "Warehouse");
    expect(screen.queryByRole("article", { name: "Production Gate" })).not.toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Warehouse Raw Materials" })).toBeInTheDocument();

    await user.clear(search);
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter status" }), "offline");
    expect(screen.queryByRole("article", { name: "Production Gate" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "View details Warehouse Raw Materials" }));

    expect(screen.getByRole("heading", { name: "Camera Source Details" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Camera Source name" })).toHaveValue("Warehouse Raw Materials");
    expect(screen.queryByText(/token|password|rtsp/i)).not.toBeInTheDocument();
  });

  it("limits Camera Sources for an Area Supervisor and denies HRD access", async () => {
    render(
      <App
        initialEntries={["/konfigurasi/kamera"]}
        initialPersona="supervisor"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByRole("article", { name: "Production Gate" })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Warehouse Raw Materials" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Save metadata/i })).not.toBeInTheDocument();

    render(
      <App
        initialEntries={["/konfigurasi/kamera"]}
        initialPersona="hrd"
        service={createMockSawService({ storage: null })}
      />,
    );
    expect(screen.getByRole("heading", { name: "Restricted access" })).toBeInTheDocument();
  });

  it("persists safe Camera Source metadata updates by an Admin/Safety Officer", async () => {
    const user = userEvent.setup();
    const firstRender = render(
      <App
        initialEntries={["/konfigurasi/kamera"]}
        initialPersona="admin"
        service={createMockSawService({ storage: window.localStorage })}
      />,
    );

    await user.click(await screen.findByRole("button", { name: "View details Production Gate" }));
    const nameInput = screen.getByRole("textbox", { name: "Camera Source name" });
    await user.clear(nameInput);
    await user.type(nameInput, "Production Gate Barat");
    await user.click(screen.getByRole("button", { name: "Save metadata demo" }));

    expect(await screen.findByRole("article", { name: "Production Gate Barat" })).toBeInTheDocument();
    expect(screen.getByText("Camera Source metadata updated.")).toBeInTheDocument();

    firstRender.unmount();
    render(
      <App
        initialEntries={["/konfigurasi/kamera"]}
        initialPersona="admin"
        service={createMockSawService({ storage: window.localStorage })}
      />,
    );
    expect(await screen.findByRole("article", { name: "Production Gate Barat" })).toBeInTheDocument();
  });

  it("shows a label and icon for every connection status", async () => {
    render(
      <App
        initialEntries={["/konfigurasi/kamera"]}
        initialPersona="admin"
        service={createMockSawService({
          initialData: withCameras([
            {
              id: "CAM-01",
              name: "Production Gate",
              location: "Main Production Line",
              zoneIds: ["ZON-01"],
              status: "online",
              lastUpdatedAt: "2026-09-08T08:15:00+07:00",
              supervisorArea: "Production",
            },
            {
              id: "CAM-02",
              name: "Maintenance Entrance",
              location: "Maintenance Workshop",
              zoneIds: ["ZON-04"],
              status: "degraded",
              lastUpdatedAt: "2026-09-08T08:03:00+07:00",
              supervisorArea: "Maintenance",
            },
            {
              id: "CAM-03",
              name: "Warehouse Raw Materials",
              location: "Warehouse Raw Materials",
              zoneIds: ["ZON-03"],
              status: "offline",
              lastUpdatedAt: "2026-09-08T07:48:00+07:00",
              supervisorArea: "Warehouse",
            },
          ]),
          storage: null,
        })}
      />,
    );

    const statusCards = [
      ["Production Gate", "Active"],
      ["Maintenance Entrance", "Degraded"],
      ["Warehouse Raw Materials", "Offline"],
    ];
    for (const [cameraName, status] of statusCards) {
      const card = await screen.findByRole("article", { name: cameraName });
      expect(card).toHaveTextContent(status);
      expect(card).toHaveAccessibleName(cameraName);
      expect(within(card).getByRole("img", { name: `Status icon ${status}` })).toBeInTheDocument();
    }
  });

  it.each([
    ["loading", "Loading Camera Sources…"],
    ["empty", "No Camera Sources are registered"],
    ["error", "Camera Sources could not be loaded."],
  ] as const)("clearly presents the Camera Source %s state", async (scenario, expectedText) => {
    render(
      <App
        initialEntries={["/konfigurasi/kamera"]}
        initialPersona="admin"
        service={createMockSawService({ scenario, storage: null })}
      />,
    );

    expect(await screen.findByText(expectedText)).toBeInTheDocument();
  });

   it("allows an Admin/Safety Officer to add Canonical PPE Class mappings and rejects duplicate YOLO indices", async () => {
    const user = userEvent.setup();

    render(
      <App
        initialEntries={["/canonical-ppe-classes"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByText("mask")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Canonical PPE Classes" })).toBeInTheDocument();
    expect(screen.getAllByText("Face Mask")).toHaveLength(3);
    expect(screen.getAllByText("Compliant")).toHaveLength(4);

    await user.click(screen.getByRole("button", { name: "Add mapping" }));
    await user.type(screen.getByRole("spinbutton", { name: "YOLO index" }), "0");
    await user.type(screen.getByRole("textbox", { name: "Raw label" }), "visor");
    await user.type(screen.getByRole("textbox", { name: "Canonical PPE Class" }), "Face Shield");
    await user.click(screen.getByRole("button", { name: "Save mapping" }));

    expect(screen.getByRole("alert")).toHaveTextContent("YOLO index 0 is already in use.");
    expect(screen.getByRole("spinbutton", { name: "YOLO index" })).toHaveAccessibleDescription("YOLO index 0 is already in use.");
    await user.clear(screen.getByRole("spinbutton", { name: "YOLO index" }));
    await user.type(screen.getByRole("spinbutton", { name: "YOLO index" }), "9");
    await user.click(screen.getByRole("button", { name: "Save mapping" }));

    expect(await screen.findByText("Canonical PPE Class mapping saved.")).toBeInTheDocument();
    expect(screen.getByText("visor")).toBeInTheDocument();
  });

  it("edits Canonical PPE Class mappings, previews interpretation, and persists after refresh", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    const firstRender = render(
      <App initialEntries={["/canonical-ppe-classes"]} initialPersona="admin" service={service} />,
    );

    await screen.findByText("mask");
    await user.click(screen.getByRole("button", { name: "Edit mapping mask" }));
    const yoloIndex = screen.getByRole("spinbutton", { name: "YOLO index" });
    const rawLabel = screen.getByRole("textbox", { name: "Raw label" });
    const canonicalClass = screen.getByRole("textbox", { name: "Canonical PPE Class" });
    await user.clear(yoloIndex);
    await user.type(yoloIndex, "7");
    await user.clear(rawLabel);
    await user.type(rawLabel, "face_mask");
    await user.clear(canonicalClass);
    await user.type(canonicalClass, "Medical Face Mask");
    await user.selectOptions(screen.getByRole("combobox", { name: "Interpretation category" }), "violation");

    expect(screen.getByRole("complementary", { name: "Mapping interpretation preview" })).toHaveTextContent("face_mask is interpreted as Medical Face Mask with the violation.");

    await user.click(screen.getByRole("button", { name: "Save mapping" }));
    expect(await screen.findByText("Canonical PPE Class mapping saved.")).toBeInTheDocument();
    expect(screen.getByText("face_mask")).toBeInTheDocument();
    expect(screen.getByText("face_mask").closest("tr")).toHaveTextContent("Violation");

    firstRender.unmount();
    render(<App initialEntries={["/canonical-ppe-classes"]} initialPersona="admin" service={service} />);
    expect(await screen.findByText("face_mask")).toBeInTheDocument();
    expect(screen.getByText("Medical Face Mask")).toBeInTheDocument();
  });

  it("stores ONNX model metadata as a demo without browser validation", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    const firstRender = render(
      <App initialEntries={["/canonical-ppe-classes"]} initialPersona="admin" service={service} />,
    );

    await screen.findByText("mask");
    const modelFile = new File(["demo"], "ppe-produksi.onnx", { type: "application/octet-stream" });
    await user.upload(screen.getByLabelText("Select ONNX demo file"), modelFile);

    expect(await screen.findByText("ONNX model demo metadata saved.")).toBeInTheDocument();
    expect(screen.getByText("ppe-produksi.onnx")).toBeInTheDocument();
    expect(screen.getByText(/ONNX model validation and inference require a backend/i)).toBeInTheDocument();

    firstRender.unmount();
    render(<App initialEntries={["/canonical-ppe-classes"]} initialPersona="admin" service={service} />);
    expect(await screen.findByText("ppe-produksi.onnx")).toBeInTheDocument();
  });

   it("shows the Hazardous Zone editor for an Admin/Safety Officer with seeded Camera Sources, PPE, and zones", async () => {
    render(
      <App
        initialEntries={["/konfigurasi/zona"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByRole("combobox", { name: "Select Camera Source" })).toHaveTextContent("Production Gate");
    expect(screen.getByRole("heading", { name: "Hazardous Zones" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Main Gate Zone" })).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Add Hazardous Zone" }));
    expect(screen.getByRole("group", { name: "Required PPE" })).toHaveTextContent("Safety Helmet");
  });

  it("draws, moves, and resizes a Hazardous Zone with a pointer", async () => {
    const user = userEvent.setup();
    render(<App initialEntries={["/konfigurasi/zona"]} initialPersona="admin" service={createMockSawService({ storage: null })} />);

    await screen.findByRole("combobox", { name: "Select Camera Source" });
    const canvas = screen.getByLabelText("Hazardous Zone canvas");
    Object.defineProperty(canvas, "getBoundingClientRect", {
      value: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    });

    await user.click(screen.getByRole("button", { name: "Add Hazardous Zone" }));
    fireEvent.pointerDown(canvas, { clientX: 10, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 50, clientY: 60, pointerId: 1 });
    fireEvent.pointerUp(canvas, { pointerId: 1 });
    expect(screen.getByRole("spinbutton", { name: "Coordinate x" })).toHaveValue(0.1);
    expect(screen.getByRole("spinbutton", { name: "Coordinate width" })).toHaveValue(0.4);

    await user.click(screen.getByRole("button", { name: "Edit Main Gate Zone" }));
    fireEvent.pointerDown(screen.getByRole("button", { name: "Move Main Gate Zone" }), { clientX: 20, clientY: 20, pointerId: 2 });
    fireEvent.pointerMove(canvas, { clientX: 30, clientY: 40, pointerId: 2 });
    fireEvent.pointerUp(canvas, { pointerId: 2 });
    expect(screen.getByRole("spinbutton", { name: "Coordinate x" })).toHaveValue(0.22);
    expect(screen.getByRole("spinbutton", { name: "Coordinate y" })).toHaveValue(0.38);

    fireEvent.pointerDown(screen.getByRole("button", { name: "Resize Main Gate Zone" }), { clientX: 34, clientY: 70, pointerId: 3 });
    fireEvent.pointerMove(canvas, { clientX: 70, clientY: 80, pointerId: 3 });
    fireEvent.pointerUp(canvas, { pointerId: 3 });
    expect(screen.getByRole("spinbutton", { name: "Coordinate width" })).toHaveValue(0.58);
    expect(screen.getByRole("spinbutton", { name: "Coordinate height" })).toHaveValue(0.62);
  });

  it("makes the Hazardous Zone canvas view-only on mobile while preserving coordinate inputs", async () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = (query) => ({
      matches: query === "(max-width: 767px)",
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    });

    try {
      const user = userEvent.setup();
      render(<App initialEntries={["/konfigurasi/zona"]} initialPersona="admin" service={createMockSawService({ storage: null })} />);
      await screen.findByRole("combobox", { name: "Select Camera Source" });
      await user.click(screen.getByRole("button", { name: "Add Hazardous Zone" }));
      const canvas = screen.getByLabelText("Hazardous Zone canvas");
      Object.defineProperty(canvas, "getBoundingClientRect", { value: () => ({ left: 0, top: 0, width: 100, height: 100 }) });

      fireEvent.pointerDown(canvas, { clientX: 10, clientY: 20, pointerId: 1 });
      fireEvent.pointerMove(canvas, { clientX: 60, clientY: 70, pointerId: 1 });
      expect(screen.getByRole("spinbutton", { name: "Coordinate x" })).toHaveValue(0.2);

      await user.clear(screen.getByRole("spinbutton", { name: "Coordinate x" }));
      await user.type(screen.getByRole("spinbutton", { name: "Coordinate x" }), "0.4");
      expect(screen.getByRole("spinbutton", { name: "Coordinate x" })).toHaveValue(0.4);
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it("persists a new Hazardous Zone and shows it in Live Monitoring", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    const firstRender = render(<App initialEntries={["/konfigurasi/zona"]} initialPersona="admin" service={service} />);

    await screen.findByRole("combobox", { name: "Select Camera Source" });
    await user.click(screen.getByRole("button", { name: "Add Hazardous Zone" }));
    await user.type(screen.getByRole("textbox", { name: "Hazardous Zone name" }), "Test Zone");
    await user.clear(screen.getByRole("spinbutton", { name: "Coordinate x" }));
    await user.type(screen.getByRole("spinbutton", { name: "Coordinate x" }), "0.35");
    await user.click(screen.getByRole("checkbox", { name: "Safety Helmet" }));
    await user.click(screen.getByRole("checkbox", { name: "Face Mask" }));
    await user.click(screen.getByRole("checkbox", { name: "Production" }));
    await user.click(screen.getByRole("checkbox", { name: "Warehouse" }));
    await user.click(screen.getByRole("button", { name: "Save Hazardous Zone" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Hazardous Zone Test Zone saved.");
    expect(screen.getByRole("article", { name: "Test Zone" })).toBeInTheDocument();

    firstRender.unmount();
    const monitoringRender = render(<App initialEntries={["/monitoring/live"]} initialPersona="admin" service={service} />);

    monitoringRender.unmount();
    const cameraRender = render(<App initialEntries={["/konfigurasi/kamera"]} initialPersona="admin" service={service} />);
    await user.click(await screen.findByRole("button", { name: "View details Production Gate" }));
    expect(screen.getAllByText(/ZON-01, ZON-02, ZON-05/)).toHaveLength(2);

    cameraRender.unmount();
    render(<App initialEntries={["/konfigurasi/zona"]} initialPersona="admin" service={createMockSawService({ storage: window.localStorage })} />);
    expect(await screen.findByRole("article", { name: "Test Zone" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit Test Zone" }));
    expect(screen.getByRole("spinbutton", { name: "Coordinate x" })).toHaveValue(0.35);
    expect(screen.getByRole("checkbox", { name: "Face Mask" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Warehouse" })).toBeChecked();
  });

  it("validates Hazardous Zone name, PPE, and Area Supervisor assignment", async () => {
    const user = userEvent.setup();
    render(<App initialEntries={["/konfigurasi/zona"]} initialPersona="admin" service={createMockSawService({ storage: null })} />);

    await screen.findByRole("combobox", { name: "Select Camera Source" });
    await user.click(screen.getByRole("button", { name: "Add Hazardous Zone" }));
    await user.click(screen.getByRole("button", { name: "Save Hazardous Zone" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Hazardous Zone name is required.");

    await user.type(screen.getByRole("textbox", { name: "Hazardous Zone name" }), "Validation Zone");
    await user.click(screen.getByRole("checkbox", { name: "Safety Helmet" }));
    await user.click(screen.getByRole("button", { name: "Save Hazardous Zone" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Select at least one Canonical PPE Class.");

    await user.click(screen.getByRole("checkbox", { name: "Safety Helmet" }));
    await user.click(screen.getByRole("checkbox", { name: "Production" }));
    await user.click(screen.getByRole("button", { name: "Save Hazardous Zone" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Select at least one Area Supervisor.");
  });

  it("confirms the Hazardous Zone lifecycle, retains its audit, and filters inactive zones", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    render(<App initialEntries={["/konfigurasi/zona"]} initialPersona="admin" service={service} />);

    await screen.findByRole("combobox", { name: "Select Camera Source" });
    await user.click(screen.getByRole("button", { name: "Edit Main Gate Zone" }));

    expect(screen.getByText(/has Violation History/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Permanently delete Hazardous Zone" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Active Hazardous Zone" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Deactivate Hazardous Zone" }));
    expect(screen.getByRole("dialog", { name: "Confirm deactivation Main Gate Zone" })).toBeInTheDocument();
    await user.click(within(screen.getByRole("dialog", { name: "Confirm deactivation Main Gate Zone" })).getByRole("button", { name: "Cancel" }));
    expect((await service.getHazardousZone()).find((zone) => zone.id === "ZON-01")?.active).toBe(true);

    await user.click(screen.getByRole("button", { name: "Deactivate Hazardous Zone" }));
    await user.click(screen.getByRole("button", { name: "Confirm deactivation" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Hazardous Zone Main Gate Zone deactivated.");
    expect((await service.getHazardousZone()).find((zone) => zone.id === "ZON-01")?.active).toBe(false);

    await user.selectOptions(screen.getByRole("combobox", { name: "Filter Hazardous Zone status" }), "inactive");
    expect(screen.getByRole("article", { name: "Main Gate Zone" })).toHaveTextContent("Inactive");
    expect(screen.queryByRole("article", { name: "Press Machine Zone" })).not.toBeInTheDocument();
  });

  it("permanently deletes a Hazardous Zone without history after final confirmation", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    render(<App initialEntries={["/konfigurasi/zona"]} initialPersona="admin" service={service} />);

    await screen.findByRole("combobox", { name: "Select Camera Source" });
    await user.click(screen.getByRole("button", { name: "Edit Press Machine Zone" }));
    await user.click(screen.getByRole("button", { name: "Permanently delete Hazardous Zone" }));
    expect(screen.getByRole("dialog", { name: "Confirm deletion Press Machine Zone" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirm permanent deletion" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Hazardous Zone Press Machine Zone permanently deleted.");
    expect(screen.queryByRole("article", { name: "Press Machine Zone" })).not.toBeInTheDocument();
    expect((await service.getCameras()).find((camera) => camera.id === "CAM-01")?.zoneIds).not.toContain("ZON-02");
  });

  it("reflects an inactive Hazardous Zone in Live Monitoring and Camera Source details", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    await service.deactivateHazardousZone("ZON-01");

    const monitoringRender = render(<App initialEntries={["/monitoring/live"]} initialPersona="admin" service={service} />);

    monitoringRender.unmount();
    render(<App initialEntries={["/konfigurasi/kamera"]} initialPersona="admin" service={service} />);
    await user.click(await screen.findByRole("button", { name: "View details Production Gate" }));
    expect(screen.getByRole("list", { name: "Hazardous Zone status" })).toHaveTextContent("Main Gate Zone · Inactive");
  });

  it("allows Escape to close the confirmation dialog and keeps focus within it", async () => {
    const user = userEvent.setup();
    render(<App initialEntries={["/overview"]} initialPersona="admin" service={createMockSawService({ storage: null })} />);

    await user.click(await screen.findByRole("button", { name: "Reset demo data" }));
    const dialog = screen.getByRole("dialog", { name: "Reset demo data?" });
    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.tab();
    expect(screen.getAllByRole("button", { name: "Reset demo data" })[1]).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Reset demo data?" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset demo data" })).toHaveFocus();
  });

  it("disables shell motion when the user prefers reduced motion", async () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = (query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    });

    try {
      render(<App initialEntries={["/overview"]} initialPersona="admin" service={createMockSawService({ storage: null })} />);
      await screen.findByRole("heading", { name: "Overview" });
      expect(screen.getByRole("main")).not.toHaveAttribute("style");
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it("describes the Hazardous Zone canvas as view-only on mobile while keeping coordinate inputs operable", async () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = (query) => ({
      matches: query === "(max-width: 767px)",
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    });

    try {
      const user = userEvent.setup();
      render(<App initialEntries={["/konfigurasi/zona"]} initialPersona="admin" service={createMockSawService({ storage: null })} />);
      await user.click(await screen.findByRole("button", { name: "Add Hazardous Zone" }));

      expect(screen.getByLabelText("Hazardous Zone canvas")).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByText("On a phone, the frame is view-only. Use the coordinate inputs below.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Move Main Gate Zone" })).toBeDisabled();
      expect(screen.getByRole("spinbutton", { name: "Coordinate x" })).toBeEnabled();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it("provides labelled card representations for Canonical PPE Class mappings on mobile", async () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = (query) => ({
      matches: query === "(max-width: 767px)",
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    });

    try {
      render(<App initialEntries={["/canonical-ppe-classes"]} initialPersona="admin" service={createMockSawService({ storage: null })} />);

      const mappings = await screen.findByRole("list", { name: "Canonical PPE Class mappings for mobile" });
      expect(within(mappings).getByRole("listitem", { name: /helmet/i })).toHaveTextContent("YOLO index");
      expect(within(mappings).getByRole("listitem", { name: /helmet/i })).toHaveTextContent("Canonical PPE Class");
      expect(within(mappings).getByRole("button", { name: "Edit mapping helmet" })).toBeEnabled();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});
