import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "../App";
import { createMockSawService } from "../services/saw-service";

describe("application routing", () => {
  afterEach(() => {
    cleanup();
    window.history.replaceState({}, "", "/");
  });

  it.each([
    ["/laporan-kepatuhan", "/compliance-report", "hrd", "Compliance Report"],
    ["/pelanggaran", "/violations", "admin", "Violation History"],
    ["/karyawan", "/employees", "admin", "Employees"],
    ["/konfigurasi/kamera", "/camera-sources", "admin", "Camera Sources"],
    ["/konfigurasi/zona", "/hazardous-zones", "admin", "Hazardous Zones"],
    ["/konfigurasi/apd", "/canonical-ppe-classes", "admin", "Canonical PPE Classes"],
    ["/administrasi/parameter", "/safety-parameters", "admin", "Safety Parameters"],
    ["/administrasi/reset-skor", "/score-reset", "admin", "Score Reset"],
    ["/administrasi/notifikasi", "/notifications", "admin", "Notifications"],
  ] as const)("replaces legacy route %s with %s for the active persona", async (legacyPath, canonicalPath, initialPersona, heading) => {
    window.history.replaceState({}, "", legacyPath);
    const replaceState = vi.spyOn(window.history, "replaceState");

    render(
      <App
        initialPersona={initialPersona}
        service={createMockSawService({ storage: null })}
      />,
    );

    await screen.findByRole("heading", { name: heading });
    expect(screen.getAllByRole("heading", { name: heading })).toHaveLength(1);
    expect(window.location.pathname).toBe(canonicalPath);
    expect(replaceState).toHaveBeenCalled();
  });
});
