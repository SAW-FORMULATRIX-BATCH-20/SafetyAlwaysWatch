import { describe, expect, it } from "vitest";

import { createMockSawService } from "./saw-service";

describe("MockSawService Reset Skor", () => {
  it("memulihkan Safety Score dan menyimpan artefak audit secara persisten", async () => {
    const service = createMockSawService({ storage: window.localStorage });

    const result = await service.resetSafetyScore({
      employeeId: "EMP-01",
      reason: "InvestigasiDitutup",
      actor: "Admin/Safety Officer",
    });

    expect(result.employee.safetyScore).toBe(100);
    expect(result.closedPeriod.employeeId).toBe("EMP-01");
    expect(result.ledgerEntry.scoreBefore).toBe(92);
    expect(result.ledgerEntry.scoreAfter).toBe(100);
    expect(result.resetLog.trigger).toBe("Manual");
    expect(result.resetLog.reason).toBe("InvestigasiDitutup");

    const reloadedService = createMockSawService({ storage: window.localStorage });
    const directory = await reloadedService.getEmployeeDirectory();
    const audit = await reloadedService.getSafetyScoreAudit("EMP-01");

    expect(directory.employees.find((employee) => employee.id === "EMP-01")?.safetyScore).toBe(100);
    expect(audit.periods).toHaveLength(1);
    expect(audit.ledger).toHaveLength(1);
    expect(audit.resetLogs).toHaveLength(1);
  });
});

describe("MockSawService lifecycle Hazardous Zone", () => {
  it("menonaktifkan Hazardous Zone secara persisten tanpa menghapus referensi audit", async () => {
    const service = createMockSawService({ storage: window.localStorage });

    await service.deactivateHazardousZone("ZON-01");

    const reloadedService = createMockSawService({ storage: window.localStorage });
    expect((await reloadedService.getHazardousZone()).find((zone) => zone.id === "ZON-01")?.active).toBe(false);
    expect((await reloadedService.getCameras()).find((camera) => camera.id === "CAM-01")?.zoneIds).toContain("ZON-01");
  });

  it("menghapus Hazardous Zone tanpa riwayat Violation dan membersihkan referensi Camera Source", async () => {
    const service = createMockSawService({ storage: window.localStorage });

    await service.deleteHazardousZone("ZON-02");

    expect(await service.getHazardousZone()).not.toContainEqual(expect.objectContaining({ id: "ZON-02" }));
    expect((await service.getCameras()).find((camera) => camera.id === "CAM-01")?.zoneIds).not.toContain("ZON-02");
  });

  it("menolak penghapusan Hazardous Zone yang memiliki riwayat Violation", async () => {
    const service = createMockSawService({ storage: window.localStorage });

    await expect(service.deleteHazardousZone("ZON-01")).rejects.toThrow("riwayat Violation");

    expect(await service.getHazardousZone()).toContainEqual(expect.objectContaining({ id: "ZON-01" }));
    expect((await service.getCameras()).find((camera) => camera.id === "CAM-01")?.zoneIds).toContain("ZON-01");
  });
});
