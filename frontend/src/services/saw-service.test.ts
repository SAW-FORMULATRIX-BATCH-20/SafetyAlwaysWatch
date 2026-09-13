import { describe, expect, it } from "vitest";

import { createMockSawService } from "./saw-service";

describe("MockSawService Reset Skor", () => {
  it("migrates persisted Indonesian role and Score Reset reason values", async () => {
    const service = createMockSawService({ storage: window.localStorage });
    await service.resetSafetyScore({ employeeId: "EMP-01", reason: "InvestigationClosed", actor: "Admin/Safety Officer" });

    const persisted = JSON.parse(window.localStorage.getItem("saw-demo-data") ?? "{}") as {
      notificationRecipients: Array<{ role: string }>;
      scorePeriods: Array<{ resetReason: string }>;
    };
    persisted.notificationRecipients[0].role = "HRD";
    persisted.scorePeriods[0].resetReason = "InvestigasiDitutup";
    window.localStorage.setItem("saw-demo-data", JSON.stringify(persisted));

    const reloadedService = createMockSawService({ storage: window.localStorage });
    expect((await reloadedService.getNotificationRecipients())[0]?.role).toBe("Human Resources (HR)");
    expect((await reloadedService.getSafetyScoreAudit("EMP-01")).periods[0]?.resetReason).toBe("InvestigationClosed");
  });

  it("restores Safety Score and persists audit artefacts", async () => {
    const service = createMockSawService({ storage: window.localStorage });

    const result = await service.resetSafetyScore({
      employeeId: "EMP-01",
      reason: "InvestigationClosed",
      actor: "Admin/Safety Officer",
    });

    expect(result.employee.safetyScore).toBe(100);
    expect(result.closedPeriod.employeeId).toBe("EMP-01");
    expect(result.ledgerEntry.scoreBefore).toBe(92);
    expect(result.ledgerEntry.scoreAfter).toBe(100);
    expect(result.resetLog.trigger).toBe("Manual");
    expect(result.resetLog.reason).toBe("InvestigationClosed");

    const reloadedService = createMockSawService({ storage: window.localStorage });
    const directory = await reloadedService.getEmployeeDirectory();
    const audit = await reloadedService.getSafetyScoreAudit("EMP-01");

    expect(directory.employees.find((employee) => employee.id === "EMP-01")?.safetyScore).toBe(100);
    expect(audit.periods).toHaveLength(1);
    expect(audit.ledger).toHaveLength(1);
    expect(audit.resetLogs).toHaveLength(1);
  });
});

describe("MockSawService Employee registration", () => {
  it("creates a normalized active Employee with the configured initial Safety Score and persists it", async () => {
    const service = createMockSawService({ storage: window.localStorage });

    const created = await service.createEmployee({
      employeeCode: "  emp-013 ",
      fullName: "  Avery Tan  ",
      department: "  Quality Assurance  ",
      supervisorId: "EMP-01",
    });

    expect(created).toMatchObject({
      employeeCode: "EMP-013",
      name: "Avery Tan",
      departmentId: "Quality Assurance",
      supervisorId: "EMP-01",
      status: "active",
      safetyScore: 100,
      faceSampleCount: 0,
    });

    const reloadedService = createMockSawService({ storage: window.localStorage });
    expect(await reloadedService.getEmployee(created.id)).toMatchObject({
      id: created.id,
      employeeCode: "EMP-013",
      enrollmentStatus: "not-enrolled",
    });

    await reloadedService.resetDemoData();
    await expect(reloadedService.getEmployee(created.id)).rejects.toMatchObject({
      code: "employee_not_found",
    });
  });

  it("rejects duplicate Employee codes without regard to case through a stable failure code", async () => {
    const service = createMockSawService({ storage: null });

    await expect(service.createEmployee({ employeeCode: "emp-01", fullName: "Avery Tan", department: "Production" })).rejects.toMatchObject({
      code: "employee_code_conflict",
    });
  });
});

describe("MockSawService Hazardous Zone lifecycle", () => {
  it("persists deactivation without removing audit references", async () => {
    const service = createMockSawService({ storage: window.localStorage });

    await service.deactivateHazardousZone("ZON-01");

    const reloadedService = createMockSawService({ storage: window.localStorage });
    expect((await reloadedService.getHazardousZone()).find((zone) => zone.id === "ZON-01")?.active).toBe(false);
    expect((await reloadedService.getCameras()).find((camera) => camera.id === "CAM-01")?.zoneIds).toContain("ZON-01");
  });

  it("deletes a Hazardous Zone without Violation History and removes Camera Source references", async () => {
    const service = createMockSawService({ storage: window.localStorage });

    await service.deleteHazardousZone("ZON-02");

    expect(await service.getHazardousZone()).not.toContainEqual(expect.objectContaining({ id: "ZON-02" }));
    expect((await service.getCameras()).find((camera) => camera.id === "CAM-01")?.zoneIds).not.toContain("ZON-02");
  });

  it("rejects deletion of a Hazardous Zone with Violation History", async () => {
    const service = createMockSawService({ storage: window.localStorage });

    await expect(service.deleteHazardousZone("ZON-01")).rejects.toThrow("Violation History");

    expect(await service.getHazardousZone()).toContainEqual(expect.objectContaining({ id: "ZON-01" }));
    expect((await service.getCameras()).find((camera) => camera.id === "CAM-01")?.zoneIds).toContain("ZON-01");
  });
});
