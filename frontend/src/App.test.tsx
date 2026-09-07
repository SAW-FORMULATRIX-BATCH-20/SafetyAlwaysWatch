import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "./App";
import { createMockSawService, type DemoData } from "./services/saw-service";

const withCameras = (cameras: DemoData["cameras"]): DemoData => ({
  cameras,
  compliance: { compliantObservations: 83, totalObservations: 100 },
  departments: ["Produksi", "Gudang", "Pemeliharaan"],
  employees: [{ id: "EMP-01", departmentId: "Produksi", safetyScore: 92 }],
  escalationThreshold: 60,
  violations: [{ id: "VIO-01", status: "confirmed" }],
  zones: ["ZON-01", "ZON-02", "ZON-03", "ZON-04"],
});

describe("SAW application", () => {
  it("mengarahkan Admin/Safety Officer ke Overview setelah login demo", async () => {
    const user = userEvent.setup();

    render(<App initialEntries={["/login"]} />);

    await user.click(
      screen.getByRole("radio", { name: /Admin\/Safety Officer/i }),
    );
    await user.click(screen.getByRole("button", { name: "Masuk ke SAW" }));

    expect(
      await screen.findByRole("heading", { name: "Overview" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Admin/Safety Officer")).toBeInTheDocument();
  });

  it.each([
    ["Supervisor Area", "Live Monitoring"],
    ["HRD", "Laporan Kepatuhan"],
  ])("mengarahkan %s ke %s setelah login demo", async (persona, landingPage) => {
    const user = userEvent.setup();

    render(<App initialEntries={["/login"]} />);

    await user.click(screen.getByRole("radio", { name: new RegExp(persona, "i") }));
    await user.click(screen.getByRole("button", { name: "Masuk ke SAW" }));

    expect(
      await screen.findByRole("heading", { name: landingPage }),
    ).toBeInTheDocument();
  });

  it("membatasi URL Live Monitoring saat dibuka langsung oleh HRD", () => {
    render(
      <App initialEntries={["/monitoring/live"]} initialPersona="hrd" />,
    );

    expect(
      screen.getByRole("heading", { name: "Akses terbatas" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/tidak tersedia untuk persona HRD/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Live Monitoring" })).not.toBeInTheDocument();
  });

  it("menampilkan kelompok navigasi sesuai hak akses Admin/Safety Officer", () => {
    render(
      <App initialEntries={["/overview"]} initialPersona="admin" />,
    );

    const navigation = screen.getByRole("navigation", { name: "Navigasi utama" });
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
        { id: "CAM-01", name: "Gerbang Produksi", location: "Lini Produksi Utama", zoneIds: ["ZON-01"], status: "online" as const, lastUpdatedAt: "2026-09-08T08:15:00+07:00", supervisorArea: "Produksi" },
        { id: "CAM-02", name: "Gudang Bahan Baku", location: "Gudang Bahan Baku", zoneIds: ["ZON-03"], status: "online" as const, lastUpdatedAt: "2026-09-08T08:00:00+07:00", supervisorArea: "Gudang" },
      ],
      compliance: { compliantObservations: 50, totalObservations: 100 },
      departments: ["Produksi", "Gudang", "Pemeliharaan"],
      employees: [{ id: "EMP-01", departmentId: "Produksi", safetyScore: 40 }],
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
    ["loading", "Memuat ringkasan keselamatan…"],
    ["empty", "Belum ada data demo"],
    ["error", "Data demo tidak dapat dimuat"],
  ] as const)("menampilkan state %s Overview secara jelas", async (scenario, expectedText) => {
    render(<App initialEntries={["/overview"]} initialPersona="admin" service={createMockSawService({ scenario, storage: null })} />);

    expect(await screen.findByText(expectedText)).toBeInTheDocument();
  });

  it("menampilkan Sumber Kamera seed dengan status dan pembaruan WIB", async () => {
    render(
      <App
        initialEntries={["/konfigurasi/kamera"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByRole("article", { name: "Gerbang Produksi" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Gerbang Produksi" })).toHaveTextContent("Aktif");
    expect(screen.getByRole("article", { name: "Gerbang Produksi" })).toHaveTextContent("Lini Produksi Utama");
    expect(screen.getByRole("article", { name: "Gerbang Produksi" })).toHaveTextContent("ZON-01");
    expect(screen.getByRole("article", { name: "Gerbang Produksi" })).toHaveTextContent("WIB");
    expect(screen.getByRole("article", { name: "Gudang Bahan Baku" })).toHaveTextContent("Offline");
  });

  it("memungkinkan pencarian, filter status, dan detail Sumber Kamera", async () => {
    const user = userEvent.setup();
    render(
      <App
        initialEntries={["/konfigurasi/kamera"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByRole("article", { name: "Gerbang Produksi" })).toBeInTheDocument();
    const search = screen.getByRole("textbox", { name: "Cari Sumber Kamera" });
    await user.type(search, "Gudang");
    expect(screen.queryByRole("article", { name: "Gerbang Produksi" })).not.toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Gudang Bahan Baku" })).toBeInTheDocument();

    await user.clear(search);
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter status" }), "offline");
    expect(screen.queryByRole("article", { name: "Gerbang Produksi" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Lihat detail Gudang Bahan Baku" }));

    expect(screen.getByRole("heading", { name: "Detail Sumber Kamera" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Nama Sumber Kamera" })).toHaveValue("Gudang Bahan Baku");
    expect(screen.queryByText(/token|password|rtsp/i)).not.toBeInTheDocument();
  });

  it("membatasi Sumber Kamera Supervisor Area dan menolak akses HRD", async () => {
    render(
      <App
        initialEntries={["/konfigurasi/kamera"]}
        initialPersona="supervisor"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByRole("article", { name: "Gerbang Produksi" })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Gudang Bahan Baku" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Simpan metadata/i })).not.toBeInTheDocument();

    render(
      <App
        initialEntries={["/konfigurasi/kamera"]}
        initialPersona="hrd"
        service={createMockSawService({ storage: null })}
      />,
    );
    expect(screen.getByRole("heading", { name: "Akses terbatas" })).toBeInTheDocument();
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

    await user.click(await screen.findByRole("button", { name: "Lihat detail Gerbang Produksi" }));
    const nameInput = screen.getByRole("textbox", { name: "Nama Sumber Kamera" });
    await user.clear(nameInput);
    await user.type(nameInput, "Gerbang Produksi Barat");
    await user.click(screen.getByRole("button", { name: "Simpan metadata demo" }));

    expect(await screen.findByRole("article", { name: "Gerbang Produksi Barat" })).toBeInTheDocument();
    expect(screen.getByText("Metadata Sumber Kamera diperbarui.")).toBeInTheDocument();

    firstRender.unmount();
    render(
      <App
        initialEntries={["/konfigurasi/kamera"]}
        initialPersona="admin"
        service={createMockSawService({ storage: window.localStorage })}
      />,
    );
    expect(await screen.findByRole("article", { name: "Gerbang Produksi Barat" })).toBeInTheDocument();
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
              name: "Gerbang Produksi",
              location: "Lini Produksi Utama",
              zoneIds: ["ZON-01"],
              status: "online",
              lastUpdatedAt: "2026-09-08T08:15:00+07:00",
              supervisorArea: "Produksi",
            },
            {
              id: "CAM-02",
              name: "Pintu Pemeliharaan",
              location: "Bengkel Pemeliharaan",
              zoneIds: ["ZON-04"],
              status: "degraded",
              lastUpdatedAt: "2026-09-08T08:03:00+07:00",
              supervisorArea: "Pemeliharaan",
            },
            {
              id: "CAM-03",
              name: "Gudang Bahan Baku",
              location: "Gudang Bahan Baku",
              zoneIds: ["ZON-03"],
              status: "offline",
              lastUpdatedAt: "2026-09-08T07:48:00+07:00",
              supervisorArea: "Gudang",
            },
          ]),
          storage: null,
        })}
      />,
    );

    const statusCards = [
      ["Gerbang Produksi", "Aktif"],
      ["Pintu Pemeliharaan", "Terganggu"],
      ["Gudang Bahan Baku", "Offline"],
    ];
    for (const [cameraName, status] of statusCards) {
      const card = await screen.findByRole("article", { name: cameraName });
      expect(card).toHaveTextContent(status);
      expect(card).toHaveAccessibleName(cameraName);
      expect(within(card).getByRole("img", { name: `Ikon status ${status}` })).toBeInTheDocument();
    }
  });

  it.each([
    ["loading", "Memuat Sumber Kamera…"],
    ["empty", "Tidak ada Sumber Kamera yang terdaftar"],
    ["error", "Sumber Kamera tidak dapat dimuat"],
  ] as const)("menampilkan state %s Sumber Kamera secara jelas", async (scenario, expectedText) => {
    render(
      <App
        initialEntries={["/konfigurasi/kamera"]}
        initialPersona="admin"
        service={createMockSawService({ scenario, storage: null })}
      />,
    );

    expect(await screen.findByText(expectedText)).toBeInTheDocument();
  });
});
