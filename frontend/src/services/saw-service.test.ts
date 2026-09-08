import { describe, expect, it } from "vitest";

import { createMockSawService } from "./saw-service";

describe("MockSawService Reset Skor", () => {
  it("memulihkan Skor Keselamatan dan menyimpan artefak audit secara persisten", async () => {
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
