import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "./App";
import { createMockSawService, type DemoData, type SawApplicationCapabilities } from "./services/saw-service";

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
  it("menyajikan laporan PPE Compliance HRD yang menurunkan ringkasan dan grafik dari observasi yang sama", async () => {
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

  it("memperbarui seluruh laporan ketika filter Hazardous Zone, department, Employee, dan tanggal digabungkan", async () => {
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

  it("menampilkan no-result dan dapat membersihkan filter laporan", async () => {
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
    ["error", "The Compliance Report could not be loaded"],
  ] as const)("menampilkan state %s pada laporan PPE Compliance", async (scenario, expectedText) => {
    render(
      <App
        initialEntries={["/laporan-kepatuhan"]}
        initialPersona="hrd"
        service={createMockSawService({ scenario, storage: null })}
      />,
    );

    expect(await screen.findByText(expectedText)).toBeInTheDocument();
  });

  it("memungkinkan Admin/Safety Officer menyimpan penerima Area Supervisor dengan Chat ID yang dimasking", async () => {
    const user = userEvent.setup();

    render(
      <App
        initialEntries={["/administrasi/notifikasi"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    await user.click(await screen.findByRole("button", { name: "Add penerima" }));
    await user.type(screen.getByRole("textbox", { name: "Name penerima" }), "Supervisor Maintenance Shift B");
    await user.type(screen.getByRole("textbox", { name: "Chat ID Telegram" }), "1234567890");
    await user.selectOptions(screen.getByRole("combobox", { name: "Peran penerima" }), "Area Supervisor");
    await user.selectOptions(screen.getByRole("combobox", { name: "Cakupan penerima" }), "department");
    await user.selectOptions(screen.getByRole("combobox", { name: "Target department" }), "Maintenance");
    await user.click(screen.getByRole("button", { name: "Save penerima" }));

    const recipient = await screen.findByRole("article", { name: "Supervisor Maintenance Shift B" });
    expect(recipient).toHaveTextContent("•••• 7890");
    expect(recipient).not.toHaveTextContent("1234567890");
    await user.click(within(recipient).getByRole("button", { name: "View details Supervisor Maintenance Shift B" }));
    const detail = screen.getByRole("dialog", { name: "Details Supervisor Maintenance Shift B" });
    expect(detail).toHaveTextContent("•••• 7890");
    expect(detail).not.toHaveTextContent("1234567890");
  });

  it("mencatat feed dan log SIMULASI ketika Safety Score melewati Escalation Threshold", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: null });

    render(
      <App
        initialEntries={["/monitoring/live"]}
        initialPersona="admin"
        service={service}
      />,
    );

    await user.click(await screen.findByRole("button", { name: "Skenario skor melewati ambang" }));
    await user.click(screen.getByRole("button", { name: "Proses kondisi melanggar" }));

    expect(await screen.findByRole("status", { name: "Simulation notification feed" })).toHaveTextContent("3 penerima simulasi dicatat");
    await user.click(screen.getByRole("link", { name: "Notifications" }));
    expect((await screen.findAllByText(/VIO-SIM-01/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Sent · SIMULASI/).length).toBeGreaterThan(1);
  });

  it("menyimpan hasil uji berhasil dan gagal setelah halaman dimuat ulang", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    const firstRender = render(
      <App initialEntries={["/administrasi/notifikasi"]} initialPersona="admin" service={service} />,
    );

    const recipient = await screen.findByRole("article", { name: "Operations Human Resources" });
    await user.click(within(recipient).getByRole("button", { name: "Uji berhasil" }));
    expect(await screen.findByText(/Uji SIMULASI berhasil untuk Operations Human Resources dicatat/)).toBeInTheDocument();
    await user.click(within(await screen.findByRole("article", { name: "Operations Human Resources" })).getByRole("button", { name: "Uji gagal" }));
    expect(await screen.findByText(/Uji SIMULASI gagal untuk Operations Human Resources dicatat/)).toBeInTheDocument();

    firstRender.unmount();
    render(<App initialEntries={["/administrasi/notifikasi"]} initialPersona="admin" service={createMockSawService({ storage: window.localStorage })} />);

    expect((await screen.findAllByText(/Sent · SIMULASI/)).length).toBeGreaterThan(1);
    expect(screen.getAllByText(/Failed · SIMULASI/).length).toBeGreaterThan(1);
    expect(screen.getAllByRole("img", { name: /Ikon (Sent|Failed)/ })).not.toHaveLength(0);
  });

  it("memberi HRD akses baca terhadap log notifikasi tanpa kontrol penerima", async () => {
    render(
      <App
        initialEntries={["/administrasi/notifikasi"]}
        initialPersona="hrd"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByRole("heading", { name: "Log notifikasi simulasi" })).toBeInTheDocument();
    expect(screen.getByText(/Failed · SIMULASI/)).toBeInTheDocument();
    expect(screen.getAllByText(/WIB/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Add penerima" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Uji berhasil" })).not.toBeInTheDocument();
  });

  it("menampilkan riwayat Violation yang dapat ditelusuri tanpa snapshot", async () => {
    const user = userEvent.setup();

    const service = createMockSawService({ storage: null });

    render(
      <App
        initialEntries={["/pelanggaran"]}
        initialPersona="admin"
        service={service}
      />,
    );

    expect(await screen.findByRole("button", { name: "View details VIO-01" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Violation History" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View details VIO-02" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "View details VIO-02" }));

    const detail = screen.getByLabelText("Details VIO-02");
    expect(within(detail).getByRole("heading", { name: "Details Violation Event" })).toBeInTheDocument();
    expect(screen.getAllByText("Unknown").length).toBeGreaterThan(1);
    expect(screen.getAllByText(/WIB/).length).toBeGreaterThan(1);
    expect(within(detail).getByText("Timeline Violation Episode")).toBeInTheDocument();
    expect(within(detail).getByText("Face Mask")).toBeInTheDocument();
    expect(within(detail).getByText("Detection Confidence")).toBeInTheDocument();
    expect(screen.queryByText(/snapshot/i)).not.toBeInTheDocument();
  });

  it("memfilter dan mengurutkan riwayat Violation pada daftar yang dipaginasi", async () => {
    const user = userEvent.setup();

    render(
      <App
        initialEntries={["/pelanggaran"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    await screen.findByRole("button", { name: "View details VIO-01" });
    expect(screen.queryByRole("button", { name: "View details VIO-04" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Page berikutnya" }));
    expect(screen.getByRole("button", { name: "View details VIO-04" })).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: "Sort riwayat Violation" }), "newest");
    expect(within(screen.getByRole("list", { name: "Daftar riwayat Violation" })).getAllByRole("listitem")[0]).toHaveTextContent("VIO-05");

    await user.selectOptions(screen.getByRole("combobox", { name: "Filter Camera Source" }), "CAM-02");
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter department Violation" }), "Production");
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter Episode status" }), "cleared");
    await user.selectOptions(screen.getByRole("combobox", { name: "Sort riwayat Violation" }), "confidence-desc");

    expect(screen.getByRole("button", { name: "View details VIO-04" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "View details VIO-03" })).not.toBeInTheDocument();
  });

  it("menerapkan pencarian, Hazardous Zone, Employee, dan rentang tanggal pada riwayat Violation", async () => {
    const user = userEvent.setup();

    render(
      <App
        initialEntries={["/pelanggaran"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    await screen.findByRole("button", { name: "View details VIO-01" });
    await user.type(screen.getByRole("textbox", { name: "Search riwayat Violation" }), "Unknown");
    expect(screen.getByRole("button", { name: "View details VIO-02" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "View details VIO-01" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Bersihkan filter riwayat" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter Hazardous Zone" }), "ZON-04");
    expect(screen.getByRole("button", { name: "View details VIO-02" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Bersihkan filter riwayat" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter Employee Violation" }), "unidentified");
    expect(screen.getByRole("button", { name: "View details VIO-02" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Bersihkan filter riwayat" }));
    fireEvent.change(screen.getByLabelText("Dari tanggal Violation"), { target: { value: "2026-09-05" } });
    fireEvent.change(screen.getByLabelText("Sampai tanggal Violation"), { target: { value: "2026-09-05" } });
    expect(screen.getByRole("button", { name: "View details VIO-05" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "View details VIO-04" })).not.toBeInTheDocument();
  });

  it("menyimpan perubahan Safety Score dan transisi Clearing ke riwayat Violation Episode", async () => {
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
    await user.click(screen.getByRole("button", { name: "Skenario PPE hilang" }));
    await user.click(screen.getByRole("button", { name: "Proses kondisi melanggar" }));
    await user.click(screen.getByRole("button", { name: "Proses kondisi patuh" }));
    expect(screen.getByText("Clearing")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Proses kondisi melanggar" }));
    expect(screen.getByRole("region", { name: "Episode status" })).toHaveTextContent("Violation");

    await user.click(screen.getByRole("link", { name: "Violations" }));
    await screen.findByRole("heading", { name: "Violation History" });
    await user.selectOptions(screen.getByRole("combobox", { name: "Sort riwayat Violation" }), "newest");
    await user.click(screen.getByRole("button", { name: "View details VIO-SIM-01" }));

    const detail = screen.getByLabelText("Details VIO-SIM-01");
    expect(within(detail).getByText("92 → 84")).toBeInTheDocument();
    expect(within(detail).getByText("Violation Episode memasuki Clearing.")).toBeInTheDocument();
    expect(within(detail).getByText("PPE kembali tidak terpenuhi; Violation Episode kembali menjadi Violation.")).toBeInTheDocument();
  });

  it.each([
    ["loading", "Loading riwayat Violation…"],
    ["empty", "No Violation Event"],
    ["error", "Violation History tidak dapat dimuat"],
  ] as const)("menampilkan state %s untuk riwayat Violation", async (scenario, expectedText) => {
    render(
      <App
        initialEntries={["/pelanggaran"]}
        initialPersona="admin"
        service={createMockSawService({ scenario, storage: null })}
      />,
    );

    expect(await screen.findByText(expectedText)).toBeInTheDocument();
  });

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

  it("menampilkan Live Monitoring simulasi yang hanya memuat Camera Source area Supervisor", async () => {
    render(
      <App
        initialEntries={["/monitoring/live"]}
        initialPersona="supervisor"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect((await screen.findAllByText("SIMULASI")).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Live Monitoring" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Select Camera Source" })).toHaveTextContent("Production Gate");
    expect(screen.getByRole("combobox", { name: "Select Camera Source" })).not.toHaveTextContent("Warehouse Raw Materials");
    expect(screen.getByLabelText("Orang Terdeteksi")).toBeInTheDocument();
    expect(screen.getByText("ZON-01")).toBeInTheDocument();
    expect(screen.getByText(/Latest update/i)).toBeInTheDocument();
  });

  it("menghentikan overlay saat Camera Source offline tanpa menyamarkan pembaruan latest", async () => {
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
    expect(screen.getByText(/Latest update/i)).toBeInTheDocument();
    expect(screen.getByText(/WIB/)).toBeInTheDocument();
    expect(screen.getAllByText("SIMULASI").length).toBeGreaterThan(1);
    expect(screen.getByRole("img", { name: /frame latest diredupkan/i })).toBeInTheDocument();
    expect(screen.queryByText("Orang Terdeteksi")).not.toBeInTheDocument();
  });

  it("menjalankan satu Violation Episode PPE hilang tanpa menggandakan Violation Event atau pengurangan skor", async () => {
    const user = userEvent.setup();
    render(
      <App
        initialEntries={["/monitoring/live"]}
        initialPersona="supervisor"
        service={createMockSawService({ storage: null })}
      />,
    );

    await screen.findByRole("heading", { name: "Live Monitoring" });
    await user.click(screen.getByRole("button", { name: "Skenario PPE hilang" }));

    expect(screen.getByText("Pending Confirmation")).toBeInTheDocument();
    expect(screen.getByText(/Confirmation countdown: 5 seconds/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Orang Terdeteksi · Pending Confirmation")).toHaveClass("border-dashed");

    await user.click(screen.getByRole("button", { name: "Proses kondisi melanggar" }));
    const episodeStatus = await screen.findByRole("region", { name: "Episode status" });
    expect(episodeStatus).toHaveTextContent("Violation");
    expect(episodeStatus).toHaveTextContent("Violation Event VIO-SIM-01");
    expect(episodeStatus).toHaveTextContent("Safety Score: 92 → 84");
    expect(screen.getByLabelText("Orang Terdeteksi · Violation")).toHaveClass("border-red-500");

    await user.click(screen.getByRole("button", { name: "Proses kondisi patuh" }));
    expect(screen.getByText("Clearing")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Proses kondisi melanggar" }));
    expect(screen.getByRole("region", { name: "Episode status" })).toHaveTextContent("Violation");

    await user.click(screen.getByRole("button", { name: "Proses kondisi patuh" }));
    expect(screen.getByText("Clearing")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Proses kondisi patuh" }));
    expect(screen.getByText("Cleared")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Orang Terdeteksi/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Violation Event VIO-SIM-01/i)).toHaveLength(1);
  });

  it("menyediakan skenario identitas gagal, frame rendah, kamera terputus, dan skor melewati ambang", async () => {
    const user = userEvent.setup();
    render(
      <App
        initialEntries={["/monitoring/live"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    await screen.findByRole("heading", { name: "Live Monitoring" });
    await user.click(screen.getByRole("button", { name: "Skenario operasi normal" }));
    expect(await screen.findByText(/PPE Compliance · Orang Terdeteksi/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Unidentified person scenario" }));
    expect(await screen.findByRole("region", { name: /Stage Live Monitoring/i })).toHaveTextContent("Unknown");
    await user.click(screen.getByRole("button", { name: "Frame confidence rendah" }));
    expect(screen.getByText("Pending Confirmation")).toBeInTheDocument();
    expect(screen.getByText(/Frame di bawah confidence minimum/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Skenario skor melewati ambang" }));
    await user.click(screen.getByRole("button", { name: "Proses kondisi melanggar" }));
    expect(await screen.findByText(/Safety Score: 65 → 55/i)).toBeInTheDocument();
    expect(screen.getByText(/Escalation Threshold crossed: 60/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Camera offline scenario" }));
    expect(await screen.findByText("CAMERA OFFLINE")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /Orang Terdeteksi/i })).not.toBeInTheDocument();
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

  it("menampilkan KPI Overview yang dihitung dari seed SAW", async () => {
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

  it("mengembalikan data demo ke seed dan mempertahankannya setelah refresh", async () => {
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

    await user.click(screen.getByRole("button", { name: "Reset data demo" }));
    await user.click(screen.getByRole("button", { name: "Reset data" }));
    expect(await screen.findByText("1 / 2")).toBeInTheDocument();

    refreshedRender.unmount();
    render(<App initialEntries={["/overview"]} initialPersona="admin" service={createMockSawService({ storage: window.localStorage })} />);
    expect(await screen.findByText("1 / 2")).toBeInTheDocument();
  });

  it.each([
    ["loading", "Loading safety overview…"],
    ["empty", "No data demo"],
    ["error", "SAW demo data could not be loaded"],
  ] as const)("menampilkan state %s Overview secara jelas", async (scenario, expectedText) => {
    render(<App initialEntries={["/overview"]} initialPersona="admin" service={createMockSawService({ scenario, storage: null })} />);

    expect(await screen.findByText(expectedText)).toBeInTheDocument();
  });

  it("menampilkan Camera Source seed dengan status dan pembaruan WIB", async () => {
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

  it("memungkinkan pencarian, filter status, dan detail Camera Source", async () => {
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
    expect(screen.getByRole("textbox", { name: "Name Camera Source" })).toHaveValue("Warehouse Raw Materials");
    expect(screen.queryByText(/token|password|rtsp/i)).not.toBeInTheDocument();
  });

  it("membatasi Camera Source Area Supervisor dan menolak akses HRD", async () => {
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

  it("menyimpan perubahan metadata aman Admin/Safety Officer setelah refresh", async () => {
    const user = userEvent.setup();
    const firstRender = render(
      <App
        initialEntries={["/konfigurasi/kamera"]}
        initialPersona="admin"
        service={createMockSawService({ storage: window.localStorage })}
      />,
    );

    await user.click(await screen.findByRole("button", { name: "View details Production Gate" }));
    const nameInput = screen.getByRole("textbox", { name: "Name Camera Source" });
    await user.clear(nameInput);
    await user.type(nameInput, "Production Gate Barat");
    await user.click(screen.getByRole("button", { name: "Save metadata demo" }));

    expect(await screen.findByRole("article", { name: "Production Gate Barat" })).toBeInTheDocument();
    expect(screen.getByText("Metadata Camera Source diperbarui.")).toBeInTheDocument();

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

  it("menampilkan label dan ikon untuk setiap status koneksi", async () => {
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
              name: "Pintu Maintenance",
              location: "Bengkel Maintenance",
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
      ["Pintu Maintenance", "Terganggu"],
      ["Warehouse Raw Materials", "Offline"],
    ];
    for (const [cameraName, status] of statusCards) {
      const card = await screen.findByRole("article", { name: cameraName });
      expect(card).toHaveTextContent(status);
      expect(card).toHaveAccessibleName(cameraName);
      expect(within(card).getByRole("img", { name: `Ikon status ${status}` })).toBeInTheDocument();
    }
  });

  it.each([
    ["loading", "Loading Camera Source…"],
    ["empty", "No Camera Sources are registered"],
    ["error", "Camera Source tidak dapat dimuat"],
  ] as const)("menampilkan state %s Camera Source secara jelas", async (scenario, expectedText) => {
    render(
      <App
        initialEntries={["/konfigurasi/kamera"]}
        initialPersona="admin"
        service={createMockSawService({ scenario, storage: null })}
      />,
    );

    expect(await screen.findByText(expectedText)).toBeInTheDocument();
  });

  it("menampilkan direktori Employee dengan pencarian, filter, sorting, dan pagination", async () => {
    const user = userEvent.setup();

    render(
      <App
        initialEntries={["/karyawan"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByText("Menampilkan 1–5 dari 12 Employee")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Employees" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Employee Maintenance 01" })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Employee Warehouse 01" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Score status icon Safe" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("img", { name: "Score status icon Warning" }).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Page berikutnya" }));
    expect(screen.getByText("Menampilkan 6–10 dari 12 Employee")).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Employee Maintenance 01" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Page berikutnya" }));
    expect(screen.getByText("Menampilkan 11–12 dari 12 Employee")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Score status icon Critical" }).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Page sebelumnya" }));
    await user.click(screen.getByRole("button", { name: "Page sebelumnya" }));
    await user.type(screen.getByRole("textbox", { name: "Search Employee" }), "Warehouse 02");
    expect(screen.getByRole("article", { name: "Employee Warehouse 02" })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Employee Production 01" })).not.toBeInTheDocument();

    await user.clear(screen.getByRole("textbox", { name: "Search Employee" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter department" }), "Warehouse");
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter status skor" }), "critical");
    expect(screen.getByRole("article", { name: "Employee Warehouse 03" })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Employee Warehouse 02" })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: "Sort Employee" }), "score-asc");
    expect(screen.getByRole("article", { name: "Employee Warehouse 03" })).toHaveTextContent("55");
  });

  it("menampilkan detail Employee dan tindakan enrollment yang aman", async () => {
    const user = userEvent.setup();

    render(
      <App
        initialEntries={["/karyawan"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByText("Menampilkan 1–5 dari 12 Employee")).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "Search Employee" }), "Production 01");
    await user.click(screen.getByRole("button", { name: "View details Employee Production 01" }));

    const detail = screen.getByRole("region", { name: "Employee Details" });
    expect(within(detail).getByRole("heading", { name: "Employee Details" })).toBeInTheDocument();
    expect(within(detail).getByText("Department")).toBeInTheDocument();
    expect(within(detail).getByText("Area Supervisor")).toBeInTheDocument();
    expect(within(detail).getByText("Safety Score")).toBeInTheDocument();
    expect(within(detail).getByText("Escalation Threshold")).toBeInTheDocument();
    expect(within(detail).getByText("Enrolled")).toBeInTheDocument();
    expect(within(detail).getByText("Audit summary")).toBeInTheDocument();
    expect(within(detail).getByRole("button", { name: "Start Face Enrollment Employee Production 01" })).toBeInTheDocument();
    expect(within(detail).getByText(/requires backend integration/i)).toBeInTheDocument();
    expect(within(detail).queryByText(/webcam|capture|berhasil terdaftar/i)).not.toBeInTheDocument();
  });

  it("membatasi direktori Area Supervisor dan memberi HRD akses baca tanpa Live Monitoring", async () => {
    render(
      <App
        initialEntries={["/karyawan"]}
        initialPersona="supervisor"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByText("Menampilkan 1–4 dari 4 Employee")).toBeInTheDocument();
    expect(await screen.findByRole("article", { name: "Employee Production 01" })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Employee Warehouse 01" })).not.toBeInTheDocument();
  });

  it("memberi HRD akses baca ke skor dan audit tanpa navigasi Live Monitoring", async () => {
    const user = userEvent.setup();
    render(
      <App
        initialEntries={["/karyawan"]}
        initialPersona="hrd"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByText("Menampilkan 1–5 dari 12 Employee")).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Employee Maintenance 01" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Live Monitoring" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "View details Employee Maintenance 01" }));
    const detail = screen.getByRole("region", { name: "Employee Details" });
    expect(within(detail).getByText("Safety Score")).toBeInTheDocument();
    expect(within(detail).getByText("Audit summary")).toBeInTheDocument();
  });

  it("menyediakan empty state dan no-result state yang dapat dibersihkan", async () => {
    const user = userEvent.setup();
    const emptyRender = render(
      <App
        initialEntries={["/karyawan"]}
        initialPersona="admin"
        service={createMockSawService({ scenario: "empty", storage: null })}
      />,
    );
    expect(await screen.findByText("No Employee")).toBeInTheDocument();
    emptyRender.unmount();

    render(
      <App
        initialEntries={["/karyawan"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );
    await user.type(await screen.findByRole("textbox", { name: "Search Employee" }), "tidak ada");
    expect(screen.getByText("No Employee yang cocok.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Bersihkan filter Employee" }));
    expect(screen.getByRole("article", { name: "Employee Maintenance 01" })).toBeInTheDocument();
  });

  it("menampilkan seluruh parameter keselamatan untuk Admin/Safety Officer", async () => {
    render(
      <App
        initialEntries={["/administrasi/parameter"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByRole("spinbutton", { name: "Skor awal", hidden: true })).toHaveValue(100);
    expect(screen.getByRole("heading", { name: "Safety Score", level: 2, hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Stabilisasi Episode dan deteksi", level: 2, hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Jadwal Score Reset", level: 2, hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Escalation Threshold", hidden: true })).toHaveValue(60);
    expect(screen.getByRole("spinbutton", { name: "Pengurangan Safety Helmet", hidden: true })).toHaveValue(10);
    expect(screen.getByRole("spinbutton", { name: "Ambang konfirmasi", hidden: true })).toHaveValue(5);
    expect(screen.getByRole("spinbutton", { name: "Ambang pemulihan", hidden: true })).toHaveValue(3);
    expect(screen.getByRole("spinbutton", { name: "Confidence minimum", hidden: true })).toHaveValue(0.5);
    expect(screen.getByLabelText("Jadwal Score Reset")).toHaveValue("00:00");
    expect(screen.getByRole("spinbutton", { name: "Lead time recap", hidden: true })).toHaveValue(15);
    expect(screen.getByText("Asia/Jakarta (WIB)")).toBeInTheDocument();
  });

  it("menolak nilai parameter di luar rentang sebelum menyimpan", async () => {
    const user = userEvent.setup();

    render(
      <App
        initialEntries={["/administrasi/parameter"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    const initialScore = await screen.findByRole("spinbutton", { name: "Skor awal", hidden: true });
    await user.clear(initialScore);
    await user.type(initialScore, "101");
    await user.click(screen.getByRole("button", { name: "Save parameter", hidden: true }));

    expect(screen.getByRole("alert")).toHaveTextContent("Skor awal harus antara 0 dan 100.");
    expect(screen.queryByText("Parameters keselamatan berhasil disimpan.")).not.toBeInTheDocument();
  });

  it("dapat membatalkan perubahan parameter tanpa mengubah data tersimpan", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    const firstRender = render(
      <App initialEntries={["/administrasi/parameter"]} initialPersona="admin" service={service} />,
    );

    const escalationThreshold = await screen.findByRole("spinbutton", { name: "Escalation Threshold", hidden: true });
    await user.clear(escalationThreshold);
    await user.type(escalationThreshold, "80");
    await user.click(screen.getByRole("button", { name: "Cancel", hidden: true }));
    expect(screen.getByRole("spinbutton", { name: "Escalation Threshold", hidden: true })).toHaveValue(60);

    firstRender.unmount();
    render(<App initialEntries={["/administrasi/parameter"]} initialPersona="admin" service={service} />);
    expect(await screen.findByRole("spinbutton", { name: "Escalation Threshold", hidden: true })).toHaveValue(60);
  });

  it("menyimpan parameter, mempertahankannya setelah refresh, dan mengubah KPI ambang Overview", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({
      initialData: {
        cameras: [
          { id: "CAM-01", name: "Production Gate", location: "Lini Production", zoneIds: [], status: "online", lastUpdatedAt: "2026-09-08T08:15:00+07:00", supervisorArea: "Production" },
        ],
        compliance: { compliantObservations: 10, totalObservations: 10 },
        departments: ["Production"],
        employees: [
          { id: "EMP-01", name: "Employee 01", departmentId: "Production", safetyScore: 55 },
          { id: "EMP-02", name: "Employee 02", departmentId: "Production", safetyScore: 65 },
        ],
        escalationThreshold: 60,
        violations: [],
        zones: [],
      },
      storage: window.localStorage,
    });

    const firstRender = render(
      <App initialEntries={["/administrasi/parameter"]} initialPersona="admin" service={service} />,
    );
    const escalationThreshold = await screen.findByRole("spinbutton", { name: "Escalation Threshold", hidden: true });
    await user.clear(escalationThreshold);
    await user.type(escalationThreshold, "70");
    await user.click(screen.getByRole("button", { name: "Save parameter", hidden: true }));

    expect(await screen.findByText("Parameters keselamatan berhasil disimpan.")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Escalation Threshold", hidden: true })).toHaveValue(70);

    await user.click(screen.getByRole("link", { name: "Overview" }));
    expect(await screen.findByText("2", { selector: "strong" })).toBeInTheDocument();

    firstRender.unmount();
    render(<App initialEntries={["/administrasi/parameter"]} initialPersona="admin" service={service} />);
    expect(await screen.findByRole("spinbutton", { name: "Escalation Threshold", hidden: true })).toHaveValue(70);
  });

  it("menampilkan kegagalan saat penyimpanan parameter ditolak service", async () => {
    const user = userEvent.setup();
    const service: SawApplicationCapabilities = createMockSawService({ storage: null });
    service.updateSafetySettings = async () => {
      throw new Error("Parameters keselamatan tidak dapat disimpan.");
    };

    render(<App initialEntries={["/administrasi/parameter"]} initialPersona="admin" service={service} />);
    const escalationThreshold = await screen.findByRole("spinbutton", { name: "Escalation Threshold", hidden: true });
    await user.clear(escalationThreshold);
    await user.type(escalationThreshold, "70");
    await user.click(screen.getByRole("button", { name: "Save parameter", hidden: true }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Parameters keselamatan tidak dapat disimpan.");
  });

  it.each(["supervisor", "hrd"] as const)("membatasi halaman parameter untuk peran %s", (role) => {
    render(
      <App
        initialEntries={["/administrasi/parameter"]}
        initialPersona={role}
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(screen.getByRole("heading", { name: "Restricted access" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save parameter" })).not.toBeInTheDocument();
  });

  it("menampilkan kegagalan pemuatan parameter", async () => {
    render(
      <App
        initialEntries={["/administrasi/parameter"]}
        initialPersona="admin"
        service={createMockSawService({ scenario: "error", storage: null })}
      />,
    );

    expect(await screen.findByText("Parameters keselamatan tidak dapat dimuat")).toBeInTheDocument();
  });

  it("memungkinkan Admin/Safety Officer menambah mapping Canonical PPE Classes dan menolak indeks YOLO duplikat", async () => {
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
    await user.type(screen.getByRole("spinbutton", { name: "Indeks YOLO" }), "0");
    await user.type(screen.getByRole("textbox", { name: "Label mentah" }), "visor");
    await user.type(screen.getByRole("textbox", { name: "Canonical PPE Classes" }), "Pelindung Wajah");
    await user.click(screen.getByRole("button", { name: "Save mapping" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Indeks YOLO 0 sudah digunakan.");
    expect(screen.getByRole("spinbutton", { name: "Indeks YOLO" })).toHaveAccessibleDescription("Indeks YOLO 0 sudah digunakan.");
    await user.clear(screen.getByRole("spinbutton", { name: "Indeks YOLO" }));
    await user.type(screen.getByRole("spinbutton", { name: "Indeks YOLO" }), "9");
    await user.click(screen.getByRole("button", { name: "Save mapping" }));

    expect(await screen.findByText("Mapping Canonical PPE Classes disimpan.")).toBeInTheDocument();
    expect(screen.getByText("visor")).toBeInTheDocument();
  });

  it("menyunting mapping, menampilkan preview interpretasi, dan mempertahankannya setelah refresh", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    const firstRender = render(
      <App initialEntries={["/canonical-ppe-classes"]} initialPersona="admin" service={service} />,
    );

    await screen.findByText("mask");
    await user.click(screen.getByRole("button", { name: "Edit mapping mask" }));
    const yoloIndex = screen.getByRole("spinbutton", { name: "Indeks YOLO" });
    const rawLabel = screen.getByRole("textbox", { name: "Label mentah" });
    const canonicalClass = screen.getByRole("textbox", { name: "Canonical PPE Classes" });
    await user.clear(yoloIndex);
    await user.type(yoloIndex, "7");
    await user.clear(rawLabel);
    await user.type(rawLabel, "face_mask");
    await user.clear(canonicalClass);
    await user.type(canonicalClass, "Face Mask Medis");
    await user.selectOptions(screen.getByRole("combobox", { name: "Interpretation category" }), "violation");

    expect(screen.getByRole("complementary", { name: "Preview interpretasi mapping" })).toHaveTextContent("face_mask akan dipahami sebagai Face Mask Medis dengan kategori violation.");

    await user.click(screen.getByRole("button", { name: "Save mapping" }));
    expect(await screen.findByText("Mapping Canonical PPE Classes disimpan.")).toBeInTheDocument();
    expect(screen.getByText("face_mask")).toBeInTheDocument();
    expect(screen.getByText("face_mask").closest("tr")).toHaveTextContent("Violation");

    firstRender.unmount();
    render(<App initialEntries={["/canonical-ppe-classes"]} initialPersona="admin" service={service} />);
    expect(await screen.findByText("face_mask")).toBeInTheDocument();
    expect(screen.getByText("Face Mask Medis")).toBeInTheDocument();
  });

  it("menyimpan metadata model ONNX sebagai demo tanpa memvalidasi model di browser", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    const firstRender = render(
      <App initialEntries={["/canonical-ppe-classes"]} initialPersona="admin" service={service} />,
    );

    await screen.findByText("mask");
    const modelFile = new File(["demo"], "ppe-produksi.onnx", { type: "application/octet-stream" });
    await user.upload(screen.getByLabelText("Select file ONNX demo"), modelFile);

    expect(await screen.findByText("Metadata model ONNX demo disimpan.")).toBeInTheDocument();
    expect(screen.getByText("ppe-produksi.onnx")).toBeInTheDocument();
    expect(screen.getByText(/Validasi maupun inferensi model ONNX memerlukan backend/i)).toBeInTheDocument();

    firstRender.unmount();
    render(<App initialEntries={["/canonical-ppe-classes"]} initialPersona="admin" service={service} />);
    expect(await screen.findByText("ppe-produksi.onnx")).toBeInTheDocument();
  });

  it("memungkinkan Admin/Safety Officer mereset Safety Score dengan artefak audit", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });

    const firstRender = render(
      <App
        initialEntries={["/administrasi/reset-skor"]}
        initialPersona="admin"
        service={service}
      />,
    );

    expect(await screen.findByRole("heading", { name: "Score Reset" })).toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox", { name: "Employee yang direset" }), "EMP-01");
    await user.selectOptions(screen.getByRole("combobox", { name: "Reason Score Reset" }), "Other");
    await user.type(screen.getByRole("textbox", { name: "Note reason" }), "Koreksi setelah investigasi selesai.");
    await user.click(screen.getByRole("button", { name: "Tinjau Score Reset" }));

    expect(screen.getByRole("dialog", { name: "Tinjau Score Reset" })).toHaveTextContent("Employee Production 01");
    expect(screen.getByRole("dialog", { name: "Tinjau Score Reset" })).toHaveTextContent("01 Sep 2026");
    expect(screen.getByRole("dialog", { name: "Tinjau Score Reset" })).toHaveTextContent("92");
    expect(screen.getByRole("dialog", { name: "Tinjau Score Reset" })).toHaveTextContent("100");
    await user.click(screen.getByRole("button", { name: "Lanjut ke konfirmasi" }));
    await user.click(screen.getByRole("button", { name: "Konfirmasi Score Reset" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Score Reset berhasil disimpan.");
    expect(screen.getByText("Ringkasan Period Skor")).toBeInTheDocument();
    expect(screen.getByText("Ledger Safety Score")).toBeInTheDocument();
    expect(screen.getByText("Log Score Reset")).toBeInTheDocument();
    expect(screen.getByText("Manual")).toBeInTheDocument();
    expect(screen.getByText("Koreksi setelah investigasi selesai.")).toBeInTheDocument();
    expect(screen.getAllByText("Admin/Safety Officer")).toHaveLength(2);
    expect(screen.getAllByText(/WIB/).length).toBeGreaterThan(0);
    expect((await service.getEmployeeDirectory()).employees.find((employee) => employee.id === "EMP-01")?.safetyScore).toBe(100);

    firstRender.unmount();
    render(<App initialEntries={["/administrasi/reset-skor"]} initialPersona="admin" service={createMockSawService({ storage: window.localStorage })} />);
    await screen.findByRole("heading", { name: "Score Reset" });
    await user.selectOptions(screen.getByRole("combobox", { name: "Employee yang direset" }), "EMP-01");
    expect(await screen.findByText("Koreksi setelah investigasi selesai.")).toBeInTheDocument();
  });

  it("mewajibkan note untuk reason Lainnya dan membatalkan Score Reset tanpa mengubah audit", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: null });

    render(<App initialEntries={["/administrasi/reset-skor"]} initialPersona="admin" service={service} />);

    await screen.findByRole("heading", { name: "Score Reset" });
    await user.selectOptions(screen.getByRole("combobox", { name: "Employee yang direset" }), "EMP-01");
    await user.selectOptions(screen.getByRole("combobox", { name: "Reason Score Reset" }), "Other");
    await user.click(screen.getByRole("button", { name: "Tinjau Score Reset" }));
    expect(screen.getByRole("alert")).toHaveTextContent("A note is required for the Other reason.");

    await user.type(screen.getByRole("textbox", { name: "Note reason" }), "Koreksi setelah pemeriksaan dokumen.");
    await user.click(screen.getByRole("button", { name: "Tinjau Score Reset" }));
    await user.click(screen.getByRole("button", { name: "Back" }));

    await user.selectOptions(screen.getByRole("combobox", { name: "Reason Score Reset" }), "InvestigationClosed");
    await user.click(screen.getByRole("button", { name: "Tinjau Score Reset" }));
    await user.click(screen.getByRole("button", { name: "Lanjut ke konfirmasi" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect((await service.getEmployeeDirectory()).employees.find((employee) => employee.id === "EMP-01")?.safetyScore).toBe(92);
    expect(await service.getSafetyScoreAudit("EMP-01")).toEqual({ periods: [], ledger: [], resetLogs: [] });
  });

  it.each(["supervisor", "hrd"] as const)("membatasi halaman Score Reset untuk peran %s", (role) => {
    render(<App initialEntries={["/administrasi/reset-skor"]} initialPersona={role} service={createMockSawService({ storage: null })} />);

    expect(screen.getByRole("heading", { name: "Restricted access" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tinjau Score Reset" })).not.toBeInTheDocument();
  });

  it("menampilkan Zone Editor untuk Admin/Safety Officer dengan kamera, PPE, dan zona seed", async () => {
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

  it("menggambar, memindahkan, dan mengubah ukuran Hazardous Zone dengan pointer", async () => {
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

  it("menjadikan kanvas lihat-saja di ponsel sambil mempertahankan input koordinat", async () => {
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

  it("menyimpan Hazardous Zone baru secara persisten dan menampilkannya pada Live Monitoring", async () => {
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

    expect(await screen.findByRole("status")).toHaveTextContent("Hazardous Zone Test Zone disimpan.");
    expect(screen.getByRole("article", { name: "Test Zone" })).toBeInTheDocument();

    firstRender.unmount();
    const monitoringRender = render(<App initialEntries={["/monitoring/live"]} initialPersona="admin" service={service} />);
    expect(await screen.findByText("ZON-05")).toBeInTheDocument();

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

  it("memvalidasi name, PPE, dan penugasan Area Supervisor untuk Hazardous Zone", async () => {
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

  it("mengonfirmasi lifecycle Hazardous Zone, mempertahankan audit, dan memfilter zona nonaktif", async () => {
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
    expect(await screen.findByRole("status")).toHaveTextContent("Hazardous Zone Main Gate Zone dinonaktifkan.");
    expect((await service.getHazardousZone()).find((zone) => zone.id === "ZON-01")?.active).toBe(false);

    await user.selectOptions(screen.getByRole("combobox", { name: "Filter Hazardous Zone status" }), "inactive");
    expect(screen.getByRole("article", { name: "Main Gate Zone" })).toHaveTextContent("Inactive");
    expect(screen.queryByRole("article", { name: "Press Machine Zone" })).not.toBeInTheDocument();
  });

  it("menghapus Hazardous Zone tanpa riwayat melalui konfirmasi final", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    render(<App initialEntries={["/konfigurasi/zona"]} initialPersona="admin" service={service} />);

    await screen.findByRole("combobox", { name: "Select Camera Source" });
    await user.click(screen.getByRole("button", { name: "Edit Press Machine Zone" }));
    await user.click(screen.getByRole("button", { name: "Permanently delete Hazardous Zone" }));
    expect(screen.getByRole("dialog", { name: "Confirm deletion Press Machine Zone" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirm permanent deletion" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Hazardous Zone Press Machine Zone dihapus permanen.");
    expect(screen.queryByRole("article", { name: "Press Machine Zone" })).not.toBeInTheDocument();
    expect((await service.getCameras()).find((camera) => camera.id === "CAM-01")?.zoneIds).not.toContain("ZON-02");
  });

  it("mencerminkan Hazardous Zone nonaktif pada Live Monitoring dan detail Camera Source", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    await service.deactivateHazardousZone("ZON-01");

    const monitoringRender = render(<App initialEntries={["/monitoring/live"]} initialPersona="admin" service={service} />);
    expect(await screen.findByText("ZON-02")).toBeInTheDocument();
    expect(screen.queryByText("ZON-01")).not.toBeInTheDocument();

    monitoringRender.unmount();
    render(<App initialEntries={["/konfigurasi/kamera"]} initialPersona="admin" service={service} />);
    await user.click(await screen.findByRole("button", { name: "View details Production Gate" }));
    expect(screen.getByRole("list", { name: "Status Hazardous Zone" })).toHaveTextContent("Main Gate Zone · Inactive");
  });

  it("memungkinkan dialog konfirmasi ditutup dengan Escape dan menahan fokus di dalam dialog", async () => {
    const user = userEvent.setup();
    render(<App initialEntries={["/overview"]} initialPersona="admin" service={createMockSawService({ storage: null })} />);

    await user.click(await screen.findByRole("button", { name: "Reset data demo" }));
    const dialog = screen.getByRole("dialog", { name: "Reset data demo?" });
    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.tab();
    expect(screen.getByRole("button", { name: "Reset data" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Reset data demo?" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset data demo" })).toHaveFocus();
  });

  it("menonaktifkan animasi shell ketika pengguna memilih reduced motion", async () => {
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

  it("menyatakan Hazardous Zone canvas sebagai lihat-saja di ponsel sambil menjaga input koordinat dapat dioperasikan", async () => {
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
      expect(screen.getByRole("spinbutton", { name: "Coordinate x" })).toBeEnabled();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it("menyediakan representasi kartu berlabel untuk mapping Canonical PPE Classes di ponsel", async () => {
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

      const mappings = await screen.findByRole("list", { name: "Daftar mapping Canonical PPE Classes untuk ponsel" });
      expect(within(mappings).getByRole("listitem", { name: /helmet/i })).toHaveTextContent("Indeks YOLO");
      expect(within(mappings).getByRole("listitem", { name: /helmet/i })).toHaveTextContent("Canonical PPE Classes");
      expect(within(mappings).getByRole("button", { name: "Edit mapping helmet" })).toBeEnabled();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});
