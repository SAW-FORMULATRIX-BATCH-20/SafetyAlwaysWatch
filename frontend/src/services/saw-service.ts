export type ServiceScenario = "ready" | "loading" | "empty" | "error";

type Camera = { id: string; status: "online" | "offline" };
type Employee = { id: string; departmentId: string; safetyScore: number };
type DemoData = {
  cameras: Camera[];
  compliance: { compliantObservations: number; totalObservations: number };
  departments: string[];
  employees: Employee[];
  escalationThreshold: number;
  violations: Array<{ id: string; status: "confirmed" | "cleared" }>;
  zones: string[];
};

export type OverviewData = {
  activeCameras: number;
  activeViolations: number;
  apdCompliance: number;
  employeesBelowEscalationThreshold: number;
  totalCameras: number;
};

export interface SawService {
  getOverview(): Promise<OverviewData | null>;
  resetDemoData(): Promise<OverviewData>;
}

type MockServiceOptions = {
  initialData?: DemoData;
  scenario?: ServiceScenario;
  storage?: Storage | null;
};

const storageKey = "saw-demo-data";

const seedData: DemoData = {
  cameras: [
    { id: "CAM-01", status: "online" },
    { id: "CAM-02", status: "offline" },
  ],
  zones: ["ZON-01", "ZON-02", "ZON-03", "ZON-04"],
  departments: ["Produksi", "Gudang", "Pemeliharaan"],
  employees: [
    { id: "EMP-01", departmentId: "Produksi", safetyScore: 92 },
    { id: "EMP-02", departmentId: "Produksi", safetyScore: 84 },
    { id: "EMP-03", departmentId: "Produksi", safetyScore: 58 },
    { id: "EMP-04", departmentId: "Produksi", safetyScore: 77 },
    { id: "EMP-05", departmentId: "Gudang", safetyScore: 68 },
    { id: "EMP-06", departmentId: "Gudang", safetyScore: 96 },
    { id: "EMP-07", departmentId: "Gudang", safetyScore: 55 },
    { id: "EMP-08", departmentId: "Gudang", safetyScore: 73 },
    { id: "EMP-09", departmentId: "Pemeliharaan", safetyScore: 88 },
    { id: "EMP-10", departmentId: "Pemeliharaan", safetyScore: 90 },
    { id: "EMP-11", departmentId: "Pemeliharaan", safetyScore: 79 },
    { id: "EMP-12", departmentId: "Pemeliharaan", safetyScore: 65 },
  ],
  escalationThreshold: 60,
  violations: [
    { id: "VIO-01", status: "confirmed" },
    { id: "VIO-02", status: "cleared" },
  ],
  compliance: { compliantObservations: 83, totalObservations: 100 },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function calculateOverview(data: DemoData): OverviewData {
  return {
    activeCameras: data.cameras.filter((camera) => camera.status === "online").length,
    totalCameras: data.cameras.length,
    activeViolations: data.violations.filter((violation) => violation.status === "confirmed").length,
    apdCompliance: data.compliance.totalObservations === 0
      ? 0
      : Math.round((data.compliance.compliantObservations / data.compliance.totalObservations) * 100),
    employeesBelowEscalationThreshold: data.employees.filter(
      (employee) => employee.safetyScore < data.escalationThreshold,
    ).length,
  };
}

export function createMockSawService({
  initialData,
  scenario = "ready",
  storage = typeof window === "undefined" ? null : window.localStorage,
}: MockServiceOptions = {}): SawService {
  const readData = (): DemoData => {
    const persisted = storage?.getItem(storageKey);
    if (persisted) return JSON.parse(persisted) as DemoData;

    const data = clone(initialData ?? seedData);
    storage?.setItem(storageKey, JSON.stringify(data));
    return data;
  };

  const persist = (data: DemoData) => storage?.setItem(storageKey, JSON.stringify(data));

  return {
    async getOverview() {
      if (scenario === "loading") return new Promise<null>(() => undefined);
      if (scenario === "error") throw new Error("Data demo SAW tidak dapat dimuat.");
      if (scenario === "empty") return null;
      return calculateOverview(readData());
    },
    async resetDemoData() {
      const data = clone(seedData);
      persist(data);
      return calculateOverview(data);
    },
  };
}
