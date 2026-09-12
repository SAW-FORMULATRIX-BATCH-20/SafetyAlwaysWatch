import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";
import { createMockSawService } from "./services/saw-service";

describe("English route compatibility", () => {
  it.each([
    ["/overview", "/overview", "admin", "Overview"],
    ["/compliance-report", "/laporan-kepatuhan", "hrd", "Compliance Report"],
    ["/monitoring/live", "/monitoring/live", "supervisor", "Live Monitoring"],
    ["/violations", "/pelanggaran", "admin", "Violation History"],
    ["/employees", "/karyawan", "admin", "Employees"],
    ["/camera-sources", "/konfigurasi/kamera", "admin", "Camera Sources"],
    ["/hazardous-zones", "/konfigurasi/zona", "admin", "Hazardous Zones"],
    ["/canonical-ppe-classes", "/konfigurasi/apd", "admin", "Canonical PPE Classes"],
    ["/safety-parameters", "/administrasi/parameter", "admin", "Safety Parameters"],
    ["/score-reset", "/administrasi/reset-skor", "admin", "Score Reset"],
    ["/notifications", "/administrasi/notifikasi", "admin", "Notifications"],
  ] as const)("shows %s and its legacy redirect for the active persona", async (canonicalPath, legacyPath, persona, heading) => {
    for (const path of [canonicalPath, legacyPath]) {
    const view = render(
      <App
        initialEntries={[path]}
        initialPersona={persona}
        service={createMockSawService({ storage: null })}
      />,
    );

      await screen.findByRole("heading", { name: heading });
      expect(screen.getAllByRole("heading", { name: heading })).toHaveLength(1);
      view.unmount();
    }
  });
});
