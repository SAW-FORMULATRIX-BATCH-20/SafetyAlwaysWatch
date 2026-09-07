export type ServiceScenario = "ready" | "loading" | "empty" | "error";

export type CameraStatus = "online" | "degraded" | "offline";

export type Camera = {
  id: string;
  name: string;
  location: string;
  zoneIds: string[];
  status: CameraStatus;
  lastUpdatedAt: string;
  supervisorArea: string;
};

export type CameraMetadata = Pick<Camera, "name" | "location">;
export type CameraScope = "all" | { type: "supervisor-area"; area: string };

type Employee = { id: string; departmentId: string; safetyScore: number };
export type DemoData = {
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
  getCameras(scope?: CameraScope): Promise<Camera[]>;
  updateCameraMetadata(id: string, metadata: CameraMetadata): Promise<Camera>;
}

type MockServiceOptions = {
  initialData?: DemoData;
  scenario?: ServiceScenario;
  storage?: Storage | null;
};

const storageKey = "saw-demo-data";

const seedData: DemoData = {
  cameras: [
    {
      id: "CAM-01",
      name: "Gerbang Produksi",
      location: "Lini Produksi Utama",
      zoneIds: ["ZON-01", "ZON-02"],
      status: "online",
      lastUpdatedAt: "2026-09-08T08:15:00+07:00",
      supervisorArea: "Produksi",
    },
    {
      id: "CAM-02",
      name: "Gudang Bahan Baku",
      location: "Gudang Bahan Baku",
      zoneIds: ["ZON-03", "ZON-04"],
      status: "offline",
      lastUpdatedAt: "2026-09-08T07:48:00+07:00",
      supervisorArea: "Gudang",
    },
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
    async getCameras(scope = "all") {
      if (scenario === "loading") return new Promise<Camera[]>(() => undefined);
      if (scenario === "error") throw new Error("Sumber Kamera tidak dapat dimuat.");
      if (scenario === "empty") return [];

      const cameras = readData().cameras;
      return clone(typeof scope === "object"
        ? cameras.filter((camera) => camera.supervisorArea === scope.area)
        : cameras);
    },
    async updateCameraMetadata(id, metadata) {
      const data = readData();
      const camera = data.cameras.find((item) => item.id === id);
      if (!camera) throw new Error("Sumber Kamera tidak ditemukan.");

      camera.name = metadata.name.trim();
      camera.location = metadata.location.trim();
      persist(data);
      return clone(camera);
    },
  };
}
