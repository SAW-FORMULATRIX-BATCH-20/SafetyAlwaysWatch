import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "./App";
import { createMockSawService, type DemoData, type SawService } from "./services/saw-service";

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

  it("menampilkan direktori Karyawan dengan pencarian, filter, sorting, dan pagination", async () => {
    const user = userEvent.setup();

    render(
      <App
        initialEntries={["/karyawan"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByText("Menampilkan 1–5 dari 12 Karyawan")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Karyawan" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Karyawan Gudang 01" })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Karyawan Produksi 01" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Ikon status skor Aman" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("img", { name: "Ikon status skor Waspada" }).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Halaman berikutnya" }));
    expect(screen.getByText("Menampilkan 6–10 dari 12 Karyawan")).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Karyawan Gudang 01" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Halaman berikutnya" }));
    expect(screen.getByText("Menampilkan 11–12 dari 12 Karyawan")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Ikon status skor Kritis" }).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Halaman sebelumnya" }));
    await user.click(screen.getByRole("button", { name: "Halaman sebelumnya" }));
    await user.type(screen.getByRole("textbox", { name: "Cari Karyawan" }), "Gudang 02");
    expect(screen.getByRole("article", { name: "Karyawan Gudang 02" })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Karyawan Produksi 01" })).not.toBeInTheDocument();

    await user.clear(screen.getByRole("textbox", { name: "Cari Karyawan" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter departemen" }), "Gudang");
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter status skor" }), "critical");
    expect(screen.getByRole("article", { name: "Karyawan Gudang 03" })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Karyawan Gudang 02" })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: "Urutkan Karyawan" }), "score-asc");
    expect(screen.getByRole("article", { name: "Karyawan Gudang 03" })).toHaveTextContent("55");
  });

  it("menampilkan detail Karyawan dan tindakan enrollment yang aman", async () => {
    const user = userEvent.setup();

    render(
      <App
        initialEntries={["/karyawan"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByText("Menampilkan 1–5 dari 12 Karyawan")).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "Cari Karyawan" }), "Produksi 01");
    await user.click(screen.getByRole("button", { name: "Lihat detail Karyawan Produksi 01" }));

    const detail = screen.getByRole("region", { name: "Detail Karyawan" });
    expect(within(detail).getByRole("heading", { name: "Detail Karyawan" })).toBeInTheDocument();
    expect(within(detail).getByText("Departemen")).toBeInTheDocument();
    expect(within(detail).getByText("Supervisor Area")).toBeInTheDocument();
    expect(within(detail).getByText("Skor Keselamatan")).toBeInTheDocument();
    expect(within(detail).getByText("Ambang Eskalasi")).toBeInTheDocument();
    expect(within(detail).getByText("Terdaftar")).toBeInTheDocument();
    expect(within(detail).getByText("Ringkasan audit")).toBeInTheDocument();
    expect(within(detail).getByRole("button", { name: "Mulai enrollment Karyawan Produksi 01" })).toBeInTheDocument();
    expect(within(detail).getByText(/memerlukan integrasi backend/i)).toBeInTheDocument();
    expect(within(detail).queryByText(/webcam|capture|berhasil terdaftar/i)).not.toBeInTheDocument();
  });

  it("membatasi direktori Supervisor Area dan memberi HRD akses baca tanpa Live Monitoring", async () => {
    render(
      <App
        initialEntries={["/karyawan"]}
        initialPersona="supervisor"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByText("Menampilkan 1–4 dari 4 Karyawan")).toBeInTheDocument();
    expect(await screen.findByRole("article", { name: "Karyawan Produksi 01" })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Karyawan Gudang 01" })).not.toBeInTheDocument();
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

    expect(await screen.findByText("Menampilkan 1–5 dari 12 Karyawan")).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Karyawan Gudang 01" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Live Monitoring" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Lihat detail Karyawan Gudang 01" }));
    const detail = screen.getByRole("region", { name: "Detail Karyawan" });
    expect(within(detail).getByText("Skor Keselamatan")).toBeInTheDocument();
    expect(within(detail).getByText("Ringkasan audit")).toBeInTheDocument();
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
    expect(await screen.findByText("Belum ada Karyawan")).toBeInTheDocument();
    emptyRender.unmount();

    render(
      <App
        initialEntries={["/karyawan"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );
    await user.type(await screen.findByRole("textbox", { name: "Cari Karyawan" }), "tidak ada");
    expect(screen.getByText("Tidak ada Karyawan yang cocok.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Bersihkan filter Karyawan" }));
    expect(screen.getByRole("article", { name: "Karyawan Gudang 01" })).toBeInTheDocument();
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
    expect(screen.getByRole("heading", { name: "Skor Keselamatan", level: 2, hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Stabilisasi Episode dan deteksi", level: 2, hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Jadwal Reset Skor", level: 2, hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Ambang Eskalasi", hidden: true })).toHaveValue(60);
    expect(screen.getByRole("spinbutton", { name: "Pengurangan Helm Keselamatan", hidden: true })).toHaveValue(10);
    expect(screen.getByRole("spinbutton", { name: "Ambang konfirmasi", hidden: true })).toHaveValue(5);
    expect(screen.getByRole("spinbutton", { name: "Ambang pemulihan", hidden: true })).toHaveValue(3);
    expect(screen.getByRole("spinbutton", { name: "Confidence minimum", hidden: true })).toHaveValue(0.5);
    expect(screen.getByLabelText("Jadwal Reset Skor")).toHaveValue("00:00");
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
    await user.click(screen.getByRole("button", { name: "Simpan parameter", hidden: true }));

    expect(screen.getByRole("alert")).toHaveTextContent("Skor awal harus antara 0 dan 100.");
    expect(screen.queryByText("Parameter keselamatan berhasil disimpan.")).not.toBeInTheDocument();
  });

  it("dapat membatalkan perubahan parameter tanpa mengubah data tersimpan", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    const firstRender = render(
      <App initialEntries={["/administrasi/parameter"]} initialPersona="admin" service={service} />,
    );

    const escalationThreshold = await screen.findByRole("spinbutton", { name: "Ambang Eskalasi", hidden: true });
    await user.clear(escalationThreshold);
    await user.type(escalationThreshold, "80");
    await user.click(screen.getByRole("button", { name: "Batal", hidden: true }));
    expect(screen.getByRole("spinbutton", { name: "Ambang Eskalasi", hidden: true })).toHaveValue(60);

    firstRender.unmount();
    render(<App initialEntries={["/administrasi/parameter"]} initialPersona="admin" service={service} />);
    expect(await screen.findByRole("spinbutton", { name: "Ambang Eskalasi", hidden: true })).toHaveValue(60);
  });

  it("menyimpan parameter, mempertahankannya setelah refresh, dan mengubah KPI ambang Overview", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({
      initialData: {
        cameras: [
          { id: "CAM-01", name: "Gerbang Produksi", location: "Lini Produksi", zoneIds: [], status: "online", lastUpdatedAt: "2026-09-08T08:15:00+07:00", supervisorArea: "Produksi" },
        ],
        compliance: { compliantObservations: 10, totalObservations: 10 },
        departments: ["Produksi"],
        employees: [
          { id: "EMP-01", name: "Karyawan 01", departmentId: "Produksi", safetyScore: 55 },
          { id: "EMP-02", name: "Karyawan 02", departmentId: "Produksi", safetyScore: 65 },
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
    const escalationThreshold = await screen.findByRole("spinbutton", { name: "Ambang Eskalasi", hidden: true });
    await user.clear(escalationThreshold);
    await user.type(escalationThreshold, "70");
    await user.click(screen.getByRole("button", { name: "Simpan parameter", hidden: true }));

    expect(await screen.findByText("Parameter keselamatan berhasil disimpan.")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Ambang Eskalasi", hidden: true })).toHaveValue(70);

    await user.click(screen.getByRole("link", { name: "Overview" }));
    expect(await screen.findByText("2", { selector: "strong" })).toBeInTheDocument();

    firstRender.unmount();
    render(<App initialEntries={["/administrasi/parameter"]} initialPersona="admin" service={service} />);
    expect(await screen.findByRole("spinbutton", { name: "Ambang Eskalasi", hidden: true })).toHaveValue(70);
  });

  it("menampilkan kegagalan saat penyimpanan parameter ditolak service", async () => {
    const user = userEvent.setup();
    const service: SawService = createMockSawService({ storage: null });
    service.updateSafetySettings = async () => {
      throw new Error("Parameter keselamatan tidak dapat disimpan.");
    };

    render(<App initialEntries={["/administrasi/parameter"]} initialPersona="admin" service={service} />);
    const escalationThreshold = await screen.findByRole("spinbutton", { name: "Ambang Eskalasi", hidden: true });
    await user.clear(escalationThreshold);
    await user.type(escalationThreshold, "70");
    await user.click(screen.getByRole("button", { name: "Simpan parameter", hidden: true }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Parameter keselamatan tidak dapat disimpan.");
  });

  it.each(["supervisor", "hrd"] as const)("membatasi halaman parameter untuk peran %s", (role) => {
    render(
      <App
        initialEntries={["/administrasi/parameter"]}
        initialPersona={role}
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(screen.getByRole("heading", { name: "Akses terbatas" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Simpan parameter" })).not.toBeInTheDocument();
  });

  it("menampilkan kegagalan pemuatan parameter", async () => {
    render(
      <App
        initialEntries={["/administrasi/parameter"]}
        initialPersona="admin"
        service={createMockSawService({ scenario: "error", storage: null })}
      />,
    );

    expect(await screen.findByText("Parameter keselamatan tidak dapat dimuat")).toBeInTheDocument();
  });
});
