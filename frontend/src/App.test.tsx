import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "./App";
import { createMockSawService } from "./services/saw-service";

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
      cameras: [{ id: "CAM-01", status: "online" as const }, { id: "CAM-02", status: "online" as const }],
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
});
