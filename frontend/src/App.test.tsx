import { fireEvent, render, screen, within } from "@testing-library/react";
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
  it("memungkinkan Admin/Safety Officer menyimpan penerima Supervisor Area dengan Chat ID yang dimasking", async () => {
    const user = userEvent.setup();

    render(
      <App
        initialEntries={["/administrasi/notifikasi"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    await user.click(await screen.findByRole("button", { name: "Tambah penerima" }));
    await user.type(screen.getByRole("textbox", { name: "Nama penerima" }), "Supervisor Pemeliharaan Shift B");
    await user.type(screen.getByRole("textbox", { name: "Chat ID Telegram" }), "1234567890");
    await user.selectOptions(screen.getByRole("combobox", { name: "Peran penerima" }), "Supervisor Area");
    await user.selectOptions(screen.getByRole("combobox", { name: "Cakupan penerima" }), "department");
    await user.selectOptions(screen.getByRole("combobox", { name: "Target departemen" }), "Pemeliharaan");
    await user.click(screen.getByRole("button", { name: "Simpan penerima" }));

    const recipient = await screen.findByRole("article", { name: "Supervisor Pemeliharaan Shift B" });
    expect(recipient).toHaveTextContent("•••• 7890");
    expect(recipient).not.toHaveTextContent("1234567890");
    await user.click(within(recipient).getByRole("button", { name: "Lihat detail Supervisor Pemeliharaan Shift B" }));
    const detail = screen.getByRole("dialog", { name: "Detail Supervisor Pemeliharaan Shift B" });
    expect(detail).toHaveTextContent("•••• 7890");
    expect(detail).not.toHaveTextContent("1234567890");
  });

  it("mencatat feed dan log SIMULASI ketika Skor Keselamatan melewati Ambang Eskalasi", async () => {
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

    expect(await screen.findByRole("status", { name: "Feed notifikasi simulasi" })).toHaveTextContent("3 penerima simulasi dicatat");
    await user.click(screen.getByRole("link", { name: "Notifikasi" }));
    expect((await screen.findAllByText(/VIO-SIM-01/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Terkirim · SIMULASI/).length).toBeGreaterThan(1);
  });

  it("menyimpan hasil uji berhasil dan gagal setelah halaman dimuat ulang", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    const firstRender = render(
      <App initialEntries={["/administrasi/notifikasi"]} initialPersona="admin" service={service} />,
    );

    const recipient = await screen.findByRole("article", { name: "HRD Operasional" });
    await user.click(within(recipient).getByRole("button", { name: "Uji berhasil" }));
    expect(await screen.findByText(/Uji SIMULASI berhasil untuk HRD Operasional dicatat/)).toBeInTheDocument();
    await user.click(within(await screen.findByRole("article", { name: "HRD Operasional" })).getByRole("button", { name: "Uji gagal" }));
    expect(await screen.findByText(/Uji SIMULASI gagal untuk HRD Operasional dicatat/)).toBeInTheDocument();

    firstRender.unmount();
    render(<App initialEntries={["/administrasi/notifikasi"]} initialPersona="admin" service={createMockSawService({ storage: window.localStorage })} />);

    expect((await screen.findAllByText(/Terkirim · SIMULASI/)).length).toBeGreaterThan(1);
    expect(screen.getAllByText(/Gagal · SIMULASI/).length).toBeGreaterThan(1);
    expect(screen.getAllByRole("img", { name: /Ikon (Terkirim|Gagal)/ })).not.toHaveLength(0);
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
    expect(screen.getByText(/Gagal · SIMULASI/)).toBeInTheDocument();
    expect(screen.getAllByText(/WIB/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Tambah penerima" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Uji berhasil" })).not.toBeInTheDocument();
  });

  it("menampilkan riwayat Pelanggaran yang dapat ditelusuri tanpa snapshot", async () => {
    const user = userEvent.setup();

    const service = createMockSawService({ storage: null });

    render(
      <App
        initialEntries={["/pelanggaran"]}
        initialPersona="admin"
        service={service}
      />,
    );

    expect(await screen.findByRole("button", { name: "Lihat detail VIO-01" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Riwayat Pelanggaran" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lihat detail VIO-02" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Lihat detail VIO-02" }));

    const detail = screen.getByLabelText("Detail VIO-02");
    expect(within(detail).getByRole("heading", { name: "Detail Peristiwa Pelanggaran" })).toBeInTheDocument();
    expect(screen.getAllByText("Tidak Dikenali").length).toBeGreaterThan(1);
    expect(screen.getAllByText(/WIB/).length).toBeGreaterThan(1);
    expect(within(detail).getByText("Timeline Episode Pelanggaran")).toBeInTheDocument();
    expect(within(detail).getByText("Masker")).toBeInTheDocument();
    expect(within(detail).getByText("Keyakinan deteksi")).toBeInTheDocument();
    expect(screen.queryByText(/snapshot/i)).not.toBeInTheDocument();
  });

  it("memfilter dan mengurutkan riwayat Pelanggaran pada daftar yang dipaginasi", async () => {
    const user = userEvent.setup();

    render(
      <App
        initialEntries={["/pelanggaran"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    await screen.findByRole("button", { name: "Lihat detail VIO-01" });
    expect(screen.queryByRole("button", { name: "Lihat detail VIO-04" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Halaman berikutnya" }));
    expect(screen.getByRole("button", { name: "Lihat detail VIO-04" })).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: "Urutkan riwayat Pelanggaran" }), "newest");
    expect(within(screen.getByRole("list", { name: "Daftar riwayat Pelanggaran" })).getAllByRole("listitem")[0]).toHaveTextContent("VIO-05");

    await user.selectOptions(screen.getByRole("combobox", { name: "Filter Sumber Kamera" }), "CAM-02");
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter departemen Pelanggaran" }), "Produksi");
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter Status Episode" }), "cleared");
    await user.selectOptions(screen.getByRole("combobox", { name: "Urutkan riwayat Pelanggaran" }), "confidence-desc");

    expect(screen.getByRole("button", { name: "Lihat detail VIO-04" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lihat detail VIO-03" })).not.toBeInTheDocument();
  });

  it("menerapkan pencarian, Zona Berbahaya, Karyawan, dan rentang tanggal pada riwayat Pelanggaran", async () => {
    const user = userEvent.setup();

    render(
      <App
        initialEntries={["/pelanggaran"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    await screen.findByRole("button", { name: "Lihat detail VIO-01" });
    await user.type(screen.getByRole("textbox", { name: "Cari riwayat Pelanggaran" }), "Tidak Dikenali");
    expect(screen.getByRole("button", { name: "Lihat detail VIO-02" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lihat detail VIO-01" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Bersihkan filter riwayat" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter Zona Berbahaya" }), "ZON-04");
    expect(screen.getByRole("button", { name: "Lihat detail VIO-02" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Bersihkan filter riwayat" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter Karyawan Pelanggaran" }), "unidentified");
    expect(screen.getByRole("button", { name: "Lihat detail VIO-02" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Bersihkan filter riwayat" }));
    fireEvent.change(screen.getByLabelText("Dari tanggal Pelanggaran"), { target: { value: "2026-09-05" } });
    fireEvent.change(screen.getByLabelText("Sampai tanggal Pelanggaran"), { target: { value: "2026-09-05" } });
    expect(screen.getByRole("button", { name: "Lihat detail VIO-05" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lihat detail VIO-04" })).not.toBeInTheDocument();
  });

  it("menyimpan perubahan Skor Keselamatan dan transisi Memulihkan ke riwayat Episode Pelanggaran", async () => {
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
    await user.click(screen.getByRole("button", { name: "Skenario APD hilang" }));
    await user.click(screen.getByRole("button", { name: "Proses kondisi melanggar" }));
    await user.click(screen.getByRole("button", { name: "Proses kondisi patuh" }));
    expect(screen.getByText("Memulihkan")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Proses kondisi melanggar" }));
    expect(screen.getByRole("region", { name: "Status Episode" })).toHaveTextContent("Pelanggaran");

    await user.click(screen.getByRole("link", { name: "Pelanggaran" }));
    await screen.findByRole("heading", { name: "Riwayat Pelanggaran" });
    await user.selectOptions(screen.getByRole("combobox", { name: "Urutkan riwayat Pelanggaran" }), "newest");
    await user.click(screen.getByRole("button", { name: "Lihat detail VIO-SIM-01" }));

    const detail = screen.getByLabelText("Detail VIO-SIM-01");
    expect(within(detail).getByText("92 → 84")).toBeInTheDocument();
    expect(within(detail).getByText("Episode Pelanggaran memasuki Memulihkan.")).toBeInTheDocument();
    expect(within(detail).getByText("APD kembali tidak terpenuhi; Episode Pelanggaran kembali menjadi Pelanggaran.")).toBeInTheDocument();
  });

  it.each([
    ["loading", "Memuat riwayat Pelanggaran…"],
    ["empty", "Belum ada Peristiwa Pelanggaran"],
    ["error", "Riwayat Pelanggaran tidak dapat dimuat"],
  ] as const)("menampilkan state %s untuk riwayat Pelanggaran", async (scenario, expectedText) => {
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

  it("menampilkan Live Monitoring simulasi yang hanya memuat Sumber Kamera area Supervisor", async () => {
    render(
      <App
        initialEntries={["/monitoring/live"]}
        initialPersona="supervisor"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect((await screen.findAllByText("SIMULASI")).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Live Monitoring" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Pilih Sumber Kamera" })).toHaveTextContent("Gerbang Produksi");
    expect(screen.getByRole("combobox", { name: "Pilih Sumber Kamera" })).not.toHaveTextContent("Gudang Bahan Baku");
    expect(screen.getByLabelText("Orang Terdeteksi")).toBeInTheDocument();
    expect(screen.getByText("ZON-01")).toBeInTheDocument();
    expect(screen.getByText(/Pembaruan terakhir/i)).toBeInTheDocument();
  });

  it("menghentikan overlay saat Sumber Kamera offline tanpa menyamarkan pembaruan terakhir", async () => {
    const user = userEvent.setup();
    render(
      <App
        initialEntries={["/monitoring/live"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    const selector = await screen.findByRole("combobox", { name: "Pilih Sumber Kamera" });
    await user.selectOptions(selector, "CAM-02");

    expect(screen.getByText("KAMERA OFFLINE")).toBeInTheDocument();
    expect(screen.getByText(/Pembaruan terakhir/i)).toBeInTheDocument();
    expect(screen.getByText(/WIB/)).toBeInTheDocument();
    expect(screen.getAllByText("SIMULASI").length).toBeGreaterThan(1);
    expect(screen.getByRole("img", { name: /frame terakhir diredupkan/i })).toBeInTheDocument();
    expect(screen.queryByText("Orang Terdeteksi")).not.toBeInTheDocument();
  });

  it("menjalankan satu Episode Pelanggaran APD hilang tanpa menggandakan Peristiwa Pelanggaran atau pengurangan skor", async () => {
    const user = userEvent.setup();
    render(
      <App
        initialEntries={["/monitoring/live"]}
        initialPersona="supervisor"
        service={createMockSawService({ storage: null })}
      />,
    );

    await screen.findByRole("heading", { name: "Live Monitoring" });
    await user.click(screen.getByRole("button", { name: "Skenario APD hilang" }));

    expect(screen.getByText("Dalam Verifikasi")).toBeInTheDocument();
    expect(screen.getByText(/Countdown konfirmasi: 5 detik/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Orang Terdeteksi · Dalam Verifikasi")).toHaveClass("border-dashed");

    await user.click(screen.getByRole("button", { name: "Proses kondisi melanggar" }));
    const episodeStatus = await screen.findByRole("region", { name: "Status Episode" });
    expect(episodeStatus).toHaveTextContent("Pelanggaran");
    expect(episodeStatus).toHaveTextContent("Peristiwa Pelanggaran VIO-SIM-01");
    expect(episodeStatus).toHaveTextContent("Skor Keselamatan: 92 → 84");
    expect(screen.getByLabelText("Orang Terdeteksi · Pelanggaran")).toHaveClass("border-red-500");

    await user.click(screen.getByRole("button", { name: "Proses kondisi patuh" }));
    expect(screen.getByText("Memulihkan")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Proses kondisi melanggar" }));
    expect(screen.getByRole("region", { name: "Status Episode" })).toHaveTextContent("Pelanggaran");

    await user.click(screen.getByRole("button", { name: "Proses kondisi patuh" }));
    expect(screen.getByText("Memulihkan")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Proses kondisi patuh" }));
    expect(screen.getByText("Selesai")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Orang Terdeteksi/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Peristiwa Pelanggaran VIO-SIM-01/i)).toHaveLength(1);
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
    expect(await screen.findByText(/Kepatuhan APD · Orang Terdeteksi/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Skenario identitas gagal" }));
    expect(await screen.findByRole("region", { name: /Stage Live Monitoring/i })).toHaveTextContent("Tidak Dikenali");
    await user.click(screen.getByRole("button", { name: "Frame confidence rendah" }));
    expect(screen.getByText("Dalam Verifikasi")).toBeInTheDocument();
    expect(screen.getByText(/Frame di bawah confidence minimum/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Skenario skor melewati ambang" }));
    await user.click(screen.getByRole("button", { name: "Proses kondisi melanggar" }));
    expect(await screen.findByText(/Skor Keselamatan: 65 → 55/i)).toBeInTheDocument();
    expect(screen.getByText(/Melewati Ambang Eskalasi: 60/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Skenario kamera terputus" }));
    expect(await screen.findByText("KAMERA OFFLINE")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /Orang Terdeteksi/i })).not.toBeInTheDocument();
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

  it("memungkinkan Admin/Safety Officer menambah mapping Kelas APD Kanonis dan menolak indeks YOLO duplikat", async () => {
    const user = userEvent.setup();

    render(
      <App
        initialEntries={["/konfigurasi/apd"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByText("mask")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Kelas APD Kanonis" })).toBeInTheDocument();
    expect(screen.getAllByText("Masker")).toHaveLength(3);
    expect(screen.getAllByText("Kepatuhan")).toHaveLength(4);

    await user.click(screen.getByRole("button", { name: "Tambah mapping" }));
    await user.type(screen.getByRole("spinbutton", { name: "Indeks YOLO" }), "0");
    await user.type(screen.getByRole("textbox", { name: "Label mentah" }), "visor");
    await user.type(screen.getByRole("textbox", { name: "Kelas APD Kanonis" }), "Pelindung Wajah");
    await user.click(screen.getByRole("button", { name: "Simpan mapping" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Indeks YOLO 0 sudah digunakan.");
    expect(screen.getByRole("spinbutton", { name: "Indeks YOLO" })).toHaveAccessibleDescription("Indeks YOLO 0 sudah digunakan.");
    await user.clear(screen.getByRole("spinbutton", { name: "Indeks YOLO" }));
    await user.type(screen.getByRole("spinbutton", { name: "Indeks YOLO" }), "9");
    await user.click(screen.getByRole("button", { name: "Simpan mapping" }));

    expect(await screen.findByText("Mapping Kelas APD Kanonis disimpan.")).toBeInTheDocument();
    expect(screen.getByText("visor")).toBeInTheDocument();
  });

  it("menyunting mapping, menampilkan preview interpretasi, dan mempertahankannya setelah refresh", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    const firstRender = render(
      <App initialEntries={["/konfigurasi/apd"]} initialPersona="admin" service={service} />,
    );

    await screen.findByText("mask");
    await user.click(screen.getByRole("button", { name: "Edit mapping mask" }));
    const yoloIndex = screen.getByRole("spinbutton", { name: "Indeks YOLO" });
    const rawLabel = screen.getByRole("textbox", { name: "Label mentah" });
    const canonicalClass = screen.getByRole("textbox", { name: "Kelas APD Kanonis" });
    await user.clear(yoloIndex);
    await user.type(yoloIndex, "7");
    await user.clear(rawLabel);
    await user.type(rawLabel, "face_mask");
    await user.clear(canonicalClass);
    await user.type(canonicalClass, "Masker Medis");
    await user.selectOptions(screen.getByRole("combobox", { name: "Kategori interpretasi" }), "violation");

    expect(screen.getByRole("complementary", { name: "Preview interpretasi mapping" })).toHaveTextContent("face_mask akan dipahami sebagai Masker Medis dengan kategori pelanggaran.");

    await user.click(screen.getByRole("button", { name: "Simpan mapping" }));
    expect(await screen.findByText("Mapping Kelas APD Kanonis disimpan.")).toBeInTheDocument();
    expect(screen.getByText("face_mask")).toBeInTheDocument();
    expect(screen.getByText("face_mask").closest("tr")).toHaveTextContent("Pelanggaran");

    firstRender.unmount();
    render(<App initialEntries={["/konfigurasi/apd"]} initialPersona="admin" service={service} />);
    expect(await screen.findByText("face_mask")).toBeInTheDocument();
    expect(screen.getByText("Masker Medis")).toBeInTheDocument();
  });

  it("menyimpan metadata model ONNX sebagai demo tanpa memvalidasi model di browser", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    const firstRender = render(
      <App initialEntries={["/konfigurasi/apd"]} initialPersona="admin" service={service} />,
    );

    await screen.findByText("mask");
    const modelFile = new File(["demo"], "apd-produksi.onnx", { type: "application/octet-stream" });
    await user.upload(screen.getByLabelText("Pilih file ONNX demo"), modelFile);

    expect(await screen.findByText("Metadata model ONNX demo disimpan.")).toBeInTheDocument();
    expect(screen.getByText("apd-produksi.onnx")).toBeInTheDocument();
    expect(screen.getByText(/Validasi maupun inferensi model ONNX memerlukan backend/i)).toBeInTheDocument();

    firstRender.unmount();
    render(<App initialEntries={["/konfigurasi/apd"]} initialPersona="admin" service={service} />);
    expect(await screen.findByText("apd-produksi.onnx")).toBeInTheDocument();
  });

  it("memungkinkan Admin/Safety Officer mereset Skor Keselamatan dengan artefak audit", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });

    const firstRender = render(
      <App
        initialEntries={["/administrasi/reset-skor"]}
        initialPersona="admin"
        service={service}
      />,
    );

    expect(await screen.findByRole("heading", { name: "Reset Skor" })).toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox", { name: "Karyawan yang direset" }), "EMP-01");
    await user.selectOptions(screen.getByRole("combobox", { name: "Alasan Reset Skor" }), "Lainnya");
    await user.type(screen.getByRole("textbox", { name: "Catatan alasan" }), "Koreksi setelah investigasi selesai.");
    await user.click(screen.getByRole("button", { name: "Tinjau Reset Skor" }));

    expect(screen.getByRole("dialog", { name: "Tinjau Reset Skor" })).toHaveTextContent("Karyawan Produksi 01");
    expect(screen.getByRole("dialog", { name: "Tinjau Reset Skor" })).toHaveTextContent("01 Sep 2026");
    expect(screen.getByRole("dialog", { name: "Tinjau Reset Skor" })).toHaveTextContent("92");
    expect(screen.getByRole("dialog", { name: "Tinjau Reset Skor" })).toHaveTextContent("100");
    await user.click(screen.getByRole("button", { name: "Lanjut ke konfirmasi" }));
    await user.click(screen.getByRole("button", { name: "Konfirmasi Reset Skor" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Reset Skor berhasil disimpan.");
    expect(screen.getByText("Ringkasan Periode Skor")).toBeInTheDocument();
    expect(screen.getByText("Ledger Skor Keselamatan")).toBeInTheDocument();
    expect(screen.getByText("Log Reset Skor")).toBeInTheDocument();
    expect(screen.getByText("Manual")).toBeInTheDocument();
    expect(screen.getByText("Koreksi setelah investigasi selesai.")).toBeInTheDocument();
    expect(screen.getAllByText("Admin/Safety Officer")).toHaveLength(2);
    expect(screen.getAllByText(/WIB/).length).toBeGreaterThan(0);
    expect((await service.getEmployeeDirectory()).employees.find((employee) => employee.id === "EMP-01")?.safetyScore).toBe(100);

    firstRender.unmount();
    render(<App initialEntries={["/administrasi/reset-skor"]} initialPersona="admin" service={createMockSawService({ storage: window.localStorage })} />);
    await screen.findByRole("heading", { name: "Reset Skor" });
    await user.selectOptions(screen.getByRole("combobox", { name: "Karyawan yang direset" }), "EMP-01");
    expect(await screen.findByText("Koreksi setelah investigasi selesai.")).toBeInTheDocument();
  });

  it("mewajibkan catatan untuk alasan Lainnya dan membatalkan Reset Skor tanpa mengubah audit", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: null });

    render(<App initialEntries={["/administrasi/reset-skor"]} initialPersona="admin" service={service} />);

    await screen.findByRole("heading", { name: "Reset Skor" });
    await user.selectOptions(screen.getByRole("combobox", { name: "Karyawan yang direset" }), "EMP-01");
    await user.selectOptions(screen.getByRole("combobox", { name: "Alasan Reset Skor" }), "Lainnya");
    await user.click(screen.getByRole("button", { name: "Tinjau Reset Skor" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Catatan wajib diisi untuk alasan Lainnya.");

    await user.type(screen.getByRole("textbox", { name: "Catatan alasan" }), "Koreksi setelah pemeriksaan dokumen.");
    await user.click(screen.getByRole("button", { name: "Tinjau Reset Skor" }));
    await user.click(screen.getByRole("button", { name: "Kembali" }));

    await user.selectOptions(screen.getByRole("combobox", { name: "Alasan Reset Skor" }), "InvestigasiDitutup");
    await user.click(screen.getByRole("button", { name: "Tinjau Reset Skor" }));
    await user.click(screen.getByRole("button", { name: "Lanjut ke konfirmasi" }));
    await user.click(screen.getByRole("button", { name: "Batal" }));

    expect((await service.getEmployeeDirectory()).employees.find((employee) => employee.id === "EMP-01")?.safetyScore).toBe(92);
    expect(await service.getSafetyScoreAudit("EMP-01")).toEqual({ periods: [], ledger: [], resetLogs: [] });
  });

  it.each(["supervisor", "hrd"] as const)("membatasi halaman Reset Skor untuk peran %s", (role) => {
    render(<App initialEntries={["/administrasi/reset-skor"]} initialPersona={role} service={createMockSawService({ storage: null })} />);

    expect(screen.getByRole("heading", { name: "Akses terbatas" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tinjau Reset Skor" })).not.toBeInTheDocument();
  });

  it("menampilkan Zone Editor untuk Admin/Safety Officer dengan kamera, APD, dan zona seed", async () => {
    render(
      <App
        initialEntries={["/konfigurasi/zona"]}
        initialPersona="admin"
        service={createMockSawService({ storage: null })}
      />,
    );

    expect(await screen.findByRole("combobox", { name: "Pilih Sumber Kamera" })).toHaveTextContent("Gerbang Produksi");
    expect(screen.getByRole("heading", { name: "Zona Berbahaya" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Zona Gerbang Utama" })).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Tambah Zona Berbahaya" }));
    expect(screen.getByRole("group", { name: "APD wajib" })).toHaveTextContent("Helm Keselamatan");
  });

  it("menggambar, memindahkan, dan mengubah ukuran Zona Berbahaya dengan pointer", async () => {
    const user = userEvent.setup();
    render(<App initialEntries={["/konfigurasi/zona"]} initialPersona="admin" service={createMockSawService({ storage: null })} />);

    await screen.findByRole("combobox", { name: "Pilih Sumber Kamera" });
    const canvas = screen.getByLabelText("Kanvas Zone Editor");
    Object.defineProperty(canvas, "getBoundingClientRect", {
      value: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    });

    await user.click(screen.getByRole("button", { name: "Tambah Zona Berbahaya" }));
    fireEvent.pointerDown(canvas, { clientX: 10, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 50, clientY: 60, pointerId: 1 });
    fireEvent.pointerUp(canvas, { pointerId: 1 });
    expect(screen.getByRole("spinbutton", { name: "Koordinat x" })).toHaveValue(0.1);
    expect(screen.getByRole("spinbutton", { name: "Koordinat width" })).toHaveValue(0.4);

    await user.click(screen.getByRole("button", { name: "Edit Zona Gerbang Utama" }));
    fireEvent.pointerDown(screen.getByRole("button", { name: "Pindahkan Zona Gerbang Utama" }), { clientX: 20, clientY: 20, pointerId: 2 });
    fireEvent.pointerMove(canvas, { clientX: 30, clientY: 40, pointerId: 2 });
    fireEvent.pointerUp(canvas, { pointerId: 2 });
    expect(screen.getByRole("spinbutton", { name: "Koordinat x" })).toHaveValue(0.22);
    expect(screen.getByRole("spinbutton", { name: "Koordinat y" })).toHaveValue(0.38);

    fireEvent.pointerDown(screen.getByRole("button", { name: "Ubah ukuran Zona Gerbang Utama" }), { clientX: 34, clientY: 70, pointerId: 3 });
    fireEvent.pointerMove(canvas, { clientX: 70, clientY: 80, pointerId: 3 });
    fireEvent.pointerUp(canvas, { pointerId: 3 });
    expect(screen.getByRole("spinbutton", { name: "Koordinat width" })).toHaveValue(0.58);
    expect(screen.getByRole("spinbutton", { name: "Koordinat height" })).toHaveValue(0.62);
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
      await screen.findByRole("combobox", { name: "Pilih Sumber Kamera" });
      await user.click(screen.getByRole("button", { name: "Tambah Zona Berbahaya" }));
      const canvas = screen.getByLabelText("Kanvas Zone Editor");
      Object.defineProperty(canvas, "getBoundingClientRect", { value: () => ({ left: 0, top: 0, width: 100, height: 100 }) });

      fireEvent.pointerDown(canvas, { clientX: 10, clientY: 20, pointerId: 1 });
      fireEvent.pointerMove(canvas, { clientX: 60, clientY: 70, pointerId: 1 });
      expect(screen.getByRole("spinbutton", { name: "Koordinat x" })).toHaveValue(0.2);

      await user.clear(screen.getByRole("spinbutton", { name: "Koordinat x" }));
      await user.type(screen.getByRole("spinbutton", { name: "Koordinat x" }), "0.4");
      expect(screen.getByRole("spinbutton", { name: "Koordinat x" })).toHaveValue(0.4);
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it("menyimpan Zona Berbahaya baru secara persisten dan menampilkannya pada Live Monitoring", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    const firstRender = render(<App initialEntries={["/konfigurasi/zona"]} initialPersona="admin" service={service} />);

    await screen.findByRole("combobox", { name: "Pilih Sumber Kamera" });
    await user.click(screen.getByRole("button", { name: "Tambah Zona Berbahaya" }));
    await user.type(screen.getByRole("textbox", { name: "Nama Zona Berbahaya" }), "Zona Pengujian");
    await user.clear(screen.getByRole("spinbutton", { name: "Koordinat x" }));
    await user.type(screen.getByRole("spinbutton", { name: "Koordinat x" }), "0.35");
    await user.click(screen.getByRole("checkbox", { name: "Helm Keselamatan" }));
    await user.click(screen.getByRole("checkbox", { name: "Masker" }));
    await user.click(screen.getByRole("checkbox", { name: "Produksi" }));
    await user.click(screen.getByRole("checkbox", { name: "Gudang" }));
    await user.click(screen.getByRole("button", { name: "Simpan Zona Berbahaya" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Zona Berbahaya Zona Pengujian disimpan.");
    expect(screen.getByRole("article", { name: "Zona Pengujian" })).toBeInTheDocument();

    firstRender.unmount();
    const monitoringRender = render(<App initialEntries={["/monitoring/live"]} initialPersona="admin" service={service} />);
    expect(await screen.findByText("ZON-05")).toBeInTheDocument();

    monitoringRender.unmount();
    const cameraRender = render(<App initialEntries={["/konfigurasi/kamera"]} initialPersona="admin" service={service} />);
    await user.click(await screen.findByRole("button", { name: "Lihat detail Gerbang Produksi" }));
    expect(screen.getAllByText(/ZON-01, ZON-02, ZON-05/)).toHaveLength(2);

    cameraRender.unmount();
    render(<App initialEntries={["/konfigurasi/zona"]} initialPersona="admin" service={createMockSawService({ storage: window.localStorage })} />);
    expect(await screen.findByRole("article", { name: "Zona Pengujian" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit Zona Pengujian" }));
    expect(screen.getByRole("spinbutton", { name: "Koordinat x" })).toHaveValue(0.35);
    expect(screen.getByRole("checkbox", { name: "Masker" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Gudang" })).toBeChecked();
  });

  it("memvalidasi nama, APD, dan penugasan Supervisor Area untuk Zona Berbahaya", async () => {
    const user = userEvent.setup();
    render(<App initialEntries={["/konfigurasi/zona"]} initialPersona="admin" service={createMockSawService({ storage: null })} />);

    await screen.findByRole("combobox", { name: "Pilih Sumber Kamera" });
    await user.click(screen.getByRole("button", { name: "Tambah Zona Berbahaya" }));
    await user.click(screen.getByRole("button", { name: "Simpan Zona Berbahaya" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Nama Zona Berbahaya wajib diisi.");

    await user.type(screen.getByRole("textbox", { name: "Nama Zona Berbahaya" }), "Zona Validasi");
    await user.click(screen.getByRole("checkbox", { name: "Helm Keselamatan" }));
    await user.click(screen.getByRole("button", { name: "Simpan Zona Berbahaya" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Pilih minimal satu Kelas APD Kanonis.");

    await user.click(screen.getByRole("checkbox", { name: "Helm Keselamatan" }));
    await user.click(screen.getByRole("checkbox", { name: "Produksi" }));
    await user.click(screen.getByRole("button", { name: "Simpan Zona Berbahaya" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Pilih minimal satu Supervisor Area.");
  });

  it("mengonfirmasi lifecycle Zona Berbahaya, mempertahankan audit, dan memfilter zona nonaktif", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    render(<App initialEntries={["/konfigurasi/zona"]} initialPersona="admin" service={service} />);

    await screen.findByRole("combobox", { name: "Pilih Sumber Kamera" });
    await user.click(screen.getByRole("button", { name: "Edit Zona Gerbang Utama" }));

    expect(screen.getByText(/memiliki riwayat Pelanggaran/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hapus permanen Zona Berbahaya" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Zona aktif" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nonaktifkan Zona Berbahaya" }));
    expect(screen.getByRole("dialog", { name: "Konfirmasi nonaktifkan Zona Gerbang Utama" })).toBeInTheDocument();
    await user.click(within(screen.getByRole("dialog", { name: "Konfirmasi nonaktifkan Zona Gerbang Utama" })).getByRole("button", { name: "Batal" }));
    expect((await service.getZonaBerbahaya()).find((zone) => zone.id === "ZON-01")?.active).toBe(true);

    await user.click(screen.getByRole("button", { name: "Nonaktifkan Zona Berbahaya" }));
    await user.click(screen.getByRole("button", { name: "Konfirmasi nonaktifkan" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Zona Berbahaya Zona Gerbang Utama dinonaktifkan.");
    expect((await service.getZonaBerbahaya()).find((zone) => zone.id === "ZON-01")?.active).toBe(false);

    await user.selectOptions(screen.getByRole("combobox", { name: "Filter status Zona" }), "inactive");
    expect(screen.getByRole("article", { name: "Zona Gerbang Utama" })).toHaveTextContent("Nonaktif");
    expect(screen.queryByRole("article", { name: "Zona Mesin Press" })).not.toBeInTheDocument();
  });

  it("menghapus Zona Berbahaya tanpa riwayat melalui konfirmasi final", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    render(<App initialEntries={["/konfigurasi/zona"]} initialPersona="admin" service={service} />);

    await screen.findByRole("combobox", { name: "Pilih Sumber Kamera" });
    await user.click(screen.getByRole("button", { name: "Edit Zona Mesin Press" }));
    await user.click(screen.getByRole("button", { name: "Hapus permanen Zona Berbahaya" }));
    expect(screen.getByRole("dialog", { name: "Konfirmasi hapus Zona Mesin Press" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Konfirmasi hapus permanen" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Zona Berbahaya Zona Mesin Press dihapus permanen.");
    expect(screen.queryByRole("article", { name: "Zona Mesin Press" })).not.toBeInTheDocument();
    expect((await service.getCameras()).find((camera) => camera.id === "CAM-01")?.zoneIds).not.toContain("ZON-02");
  });

  it("mencerminkan Zona Berbahaya nonaktif pada Live Monitoring dan detail Sumber Kamera", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: window.localStorage });
    await service.deactivateZonaBerbahaya("ZON-01");

    const monitoringRender = render(<App initialEntries={["/monitoring/live"]} initialPersona="admin" service={service} />);
    expect(await screen.findByText("ZON-02")).toBeInTheDocument();
    expect(screen.queryByText("ZON-01")).not.toBeInTheDocument();

    monitoringRender.unmount();
    render(<App initialEntries={["/konfigurasi/kamera"]} initialPersona="admin" service={service} />);
    await user.click(await screen.findByRole("button", { name: "Lihat detail Gerbang Produksi" }));
    expect(screen.getByRole("list", { name: "Status Zona Berbahaya" })).toHaveTextContent("Zona Gerbang Utama · Nonaktif");
  });
});
