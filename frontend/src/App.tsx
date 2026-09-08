import { animate, createScope } from "animejs";
import { useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Link,
  MemoryRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Activity,
  ArrowDownUp,
  Camera as CameraIcon,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Clock3,
  LockKeyhole,
  LogOut,
  MapPin,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  TriangleAlert,
  UserRound,
  WifiOff,
} from "lucide-react";

import { Button } from "./components/ui/button";
import {
  createMockSawService,
  type Camera,
  type CameraMetadata,
  type CameraScope,
  type CameraStatus,
  type Employee,
  type EmployeeDirectoryData,
  type EmployeeScope,
  type OverviewData,
  type SawService,
} from "./services/saw-service";

type Role = "admin" | "supervisor" | "hrd";

type Persona = {
  role: Role;
  name: string;
  description: string;
  landingPath: string;
  assignedArea?: string;
};

type Page = {
  group: string;
  path: string;
  roles: Role[];
  title: string;
};

const personas: Persona[] = [
  {
    role: "admin",
    name: "Admin/Safety Officer",
    description: "Kelola operasi keselamatan dan konfigurasi SAW.",
    landingPath: "/overview",
  },
  {
    role: "supervisor",
    name: "Supervisor Area",
    description: "Pantau kondisi Zona Berbahaya yang menjadi tanggung jawab Anda.",
    landingPath: "/monitoring/live",
    assignedArea: "Produksi",
  },
  {
    role: "hrd",
    name: "HRD",
    description: "Tinjau tren Kepatuhan APD dan catatan keselamatan Karyawan.",
    landingPath: "/laporan-kepatuhan",
  },
];

const navigationGroupLabels = [
  "Overview",
  "Monitoring",
  "Safety Operations",
  "Configuration",
  "Administration",
] as const;

const pages: Page[] = [
  { group: "Overview", path: "/overview", title: "Overview", roles: ["admin"] },
  { group: "Overview", path: "/laporan-kepatuhan", title: "Laporan Kepatuhan", roles: ["admin", "hrd"] },
  { group: "Monitoring", path: "/monitoring/live", title: "Live Monitoring", roles: ["admin", "supervisor"] },
  { group: "Safety Operations", path: "/pelanggaran", title: "Pelanggaran", roles: ["admin", "supervisor", "hrd"] },
  { group: "Safety Operations", path: "/karyawan", title: "Karyawan", roles: ["admin", "supervisor", "hrd"] },
  { group: "Configuration", path: "/konfigurasi/kamera", title: "Sumber Kamera", roles: ["admin", "supervisor"] },
  { group: "Configuration", path: "/konfigurasi/zona", title: "Zona Berbahaya", roles: ["admin"] },
  { group: "Configuration", path: "/konfigurasi/apd", title: "Kelas APD", roles: ["admin"] },
  { group: "Administration", path: "/administrasi/parameter", title: "Parameter Sistem", roles: ["admin"] },
  { group: "Administration", path: "/administrasi/notifikasi", title: "Notifikasi", roles: ["admin", "hrd"] },
];

function getPersona(role: Role) {
  return personas.find((persona) => persona.role === role)!;
}

function Login({ onLogin }: { onLogin: (role: Role) => void }) {
  const [selectedRole, setSelectedRole] = useState<Role>("admin");

  return (
    <main className="grid min-h-screen bg-slate-950 p-5 text-slate-100 lg:grid-cols-[minmax(0,1fr)_30rem] lg:p-8">
      <section className="hidden border border-slate-800 bg-slate-900 p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="font-mono text-sm tracking-[0.24em] text-amber-400">SAW</div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-400">Safety Always Watch</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-white">
            Kendalikan keselamatan area kerja dengan jelas.
          </h1>
          <p className="mt-4 max-w-lg text-slate-400">
            Masuk ke lingkungan demo untuk meninjau pengalaman SAW sesuai peran operasional Anda.
          </p>
        </div>
        <p className="font-mono text-xs text-slate-500">DEMO ENVIRONMENT · BAHASA INDONESIA</p>
      </section>

      <section className="flex items-center bg-white p-6 text-slate-900 sm:p-10">
        <div className="mx-auto w-full max-w-md">
          <div className="font-mono text-sm tracking-[0.24em] text-slate-950 lg:hidden">SAW</div>
          <p className="mt-8 font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Akses demo</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Masuk ke SAW</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Pilih persona untuk membuka ruang kerja dengan akses yang sesuai.
          </p>
          <fieldset className="mt-8 space-y-3">
            <legend className="sr-only">Persona demo</legend>
            {personas.map((persona) => (
              <label
                className="flex cursor-pointer gap-3 rounded-md border border-slate-200 p-4 transition-colors hover:border-amber-400 has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50"
                key={persona.role}
              >
                <input
                  checked={selectedRole === persona.role}
                  className="mt-1 accent-amber-500"
                  name="persona"
                  onChange={() => setSelectedRole(persona.role)}
                  type="radio"
                  value={persona.role}
                />
                <span>
                  <span className="block font-medium">{persona.name}</span>
                  <span className="mt-1 block text-sm leading-5 text-slate-600">{persona.description}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <Button className="mt-8 w-full" onClick={() => onLogin(selectedRole)}>
            Masuk ke SAW
            <ChevronRight aria-hidden="true" className="ml-1 size-4" />
          </Button>
        </div>
      </section>
    </main>
  );
}

function ApplicationShell({
  persona,
  onLogout,
  children,
}: {
  persona: Persona;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scope = createScope({ root: shellRef });
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reducedMotion) {
      scope.add(() => {
        animate("[data-shell-content]", {
          opacity: [0, 1],
          duration: 180,
          ease: "outQuad",
        });
      });
    }

    return () => scope.revert();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]" ref={shellRef}>
      <aside className="bg-slate-950 px-4 py-5 text-slate-200 lg:min-h-screen">
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <Link aria-label="SAW beranda" className="font-mono text-lg font-medium tracking-[0.2em] text-white" to={persona.landingPath}>
            SAW
          </Link>
          <span className="rounded bg-amber-400 px-2 py-1 font-mono text-[10px] font-medium tracking-[0.12em] text-slate-950">DEMO</span>
        </div>
        <nav aria-label="Navigasi utama" className="mt-6 space-y-6">
          {navigationGroupLabels.map((group) => {
            const allowedItems = pages.filter((page) => page.group === group && page.roles.includes(persona.role));
            if (allowedItems.length === 0) return null;
            return (
              <section key={group}>
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">{group}</p>
                <ul className="mt-2 space-y-1">
                  {allowedItems.map((item) => {
                    const active = location.pathname === item.path;
                    return (
                      <li key={item.path}>
                        <Link
                          aria-current={active ? "page" : undefined}
                          className={`block rounded-md px-3 py-2 text-sm transition-colors ${active ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"}`}
                          to={item.path}
                        >
                          {item.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
          <div className="flex items-center gap-2 text-sm text-slate-500"><Activity aria-hidden="true" className="size-4 text-amber-600" />Operasi keselamatan</div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right text-sm sm:block"><span className="block font-medium text-slate-800">{persona.name}</span><span className="font-mono text-xs text-slate-500">DEMO-ROLE</span></span>
            <Button aria-label="Keluar dari SAW" onClick={onLogout} size="sm" variant="outline"><LogOut aria-hidden="true" className="mr-1.5 size-3.5" />Keluar</Button>
          </div>
        </header>
        <main className="flex-1 p-5 sm:p-8" data-shell-content>{children}</main>
      </div>
    </div>
  );
}

function Page({ title }: { title: string }) {
  return (
    <section>
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">SAW workspace</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
      <div className="mt-6 border border-dashed border-slate-300 bg-white p-6 text-slate-600">
        <p className="font-medium">Ruang kerja siap digunakan.</p>
        <p className="mt-1 text-sm">Konten operasional untuk halaman ini akan ditambahkan pada tiket berikutnya.</p>
      </div>
    </section>
  );
}

function Metric({ value, suffix = "" }: { suffix?: string; value: number }) {
  const [displayedValue, setDisplayedValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || previousValue.current === value) {
      setDisplayedValue(value);
      previousValue.current = value;
      return undefined;
    }

    const metric = { value: previousValue.current };
    const animation = animate(metric, {
      value,
      duration: 220,
      ease: "outQuad",
      onUpdate: () => setDisplayedValue(Math.round(metric.value)),
    });
    previousValue.current = value;
    return () => {
      animation.pause();
    };
  }, [value]);

  return <strong className="mt-3 block text-3xl font-semibold tracking-tight text-slate-950">{displayedValue}{suffix}</strong>;
}

function Overview({ service }: { service: SawService }) {
  const [overview, setOverview] = useState<OverviewData | null>();
  const [error, setError] = useState<string>();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    service.getOverview().then((nextOverview) => {
      if (active) setOverview(nextOverview);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Data demo SAW tidak dapat dimuat.");
    });
    return () => {
      active = false;
    };
  }, [refreshKey, service]);

  const retryLoad = () => {
    setError(undefined);
    setOverview(undefined);
    setRefreshKey((key) => key + 1);
  };

  const resetDemoData = async () => {
    const nextOverview = await service.resetDemoData();
    setOverview(nextOverview);
    setConfirmingReset(false);
  };

  if (error) {
    return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Overview</h1><div className="mt-6 border border-red-200 bg-red-50 p-6"><p className="font-medium text-red-900">Data demo tidak dapat dimuat</p><p className="mt-1 text-sm text-red-800">{error}</p><Button className="mt-4" onClick={retryLoad} variant="outline">Coba lagi</Button></div></section>;
  }

  if (overview === undefined) {
    return <section aria-busy="true" aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Overview</h1><p className="mt-6 text-slate-600">Memuat ringkasan keselamatan…</p></section>;
  }

  if (overview === null) {
    return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Overview</h1><div className="mt-6 border border-dashed border-slate-300 bg-white p-6"><p className="font-medium">Belum ada data demo</p><p className="mt-1 text-sm text-slate-600">Tambahkan data SAW untuk melihat ringkasan keselamatan.</p></div></section>;
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Ringkasan operasional</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Overview</h1><p className="mt-2 text-sm text-slate-600">Kondisi keselamatan SAW saat ini.</p></div>
        <Button onClick={() => setConfirmingReset(true)} variant="outline">Reset data demo</Button>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Sumber Kamera aktif</p><Metric suffix={` / ${overview.totalCameras}`} value={overview.activeCameras} /></article>
        <article className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Pelanggaran aktif</p><Metric value={overview.activeViolations} /></article>
        <article className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Kepatuhan APD hari ini</p><Metric suffix="%" value={overview.apdCompliance} /></article>
        <article className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Karyawan di bawah Ambang Eskalasi</p><Metric value={overview.employeesBelowEscalationThreshold} /></article>
      </div>
      {confirmingReset && <div aria-labelledby="reset-title" aria-modal="true" className="fixed inset-0 grid place-items-center bg-slate-950/40 p-5" role="dialog"><div className="w-full max-w-md bg-white p-6 shadow-xl"><h2 className="text-xl font-semibold" id="reset-title">Reset data demo?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Semua perubahan demo akan dikembalikan ke seed awal.</p><div className="mt-6 flex justify-end gap-3"><Button onClick={() => setConfirmingReset(false)} variant="outline">Batal</Button><Button onClick={() => void resetDemoData()}>Reset data</Button></div></div></div>}
    </section>
  );
}

const cameraStatusDetails: Record<CameraStatus, {
  label: string;
  Icon: typeof CheckCircle2;
  className: string;
}> = {
  online: { label: "Aktif", Icon: CheckCircle2, className: "text-emerald-700" },
  degraded: { label: "Terganggu", Icon: TriangleAlert, className: "text-amber-700" },
  offline: { label: "Offline", Icon: WifiOff, className: "text-slate-600" },
};

function formatWib(timestamp: string) {
  return `${new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
    hour12: false,
  }).format(new Date(timestamp))} WIB`;
}

function ConnectionStatus({ status }: { status: CameraStatus }) {
  const { Icon, label, className } = cameraStatusDetails[status];

  return (
    <span aria-label={`Status koneksi: ${label}`} className={`inline-flex items-center gap-1.5 text-sm font-medium ${className}`}>
      <Icon aria-label={`Ikon status ${label}`} className="size-4" role="img" />
      {label}
    </span>
  );
}

function CameraDetail({
  camera,
  canEdit,
  onSaved,
}: {
  camera: Camera;
  canEdit: boolean;
  onSaved: (metadata: CameraMetadata) => void;
}) {
  const [draft, setDraft] = useState<CameraMetadata>({ name: camera.name, location: camera.location });
  const [validationError, setValidationError] = useState<string>();

  const updateDraft = (field: keyof CameraMetadata, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setValidationError(undefined);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name.trim() || !draft.location.trim()) {
      setValidationError("Nama dan lokasi Sumber Kamera wajib diisi.");
      return;
    }
    onSaved({ name: draft.name.trim(), location: draft.location.trim() });
  };

  return (
    <section aria-labelledby="camera-detail-title" className="border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Metadata operasional</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950" id="camera-detail-title">Detail Sumber Kamera</h2>
        </div>
        <ConnectionStatus status={camera.status} />
      </div>
      {canEdit ? (
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-medium text-slate-800">
            Nama Sumber Kamera
            <input
              className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              onChange={(event) => updateDraft("name", event.target.value)}
              value={draft.name}
            />
          </label>
          <label className="block text-sm font-medium text-slate-800">
            Lokasi
            <input
              className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              onChange={(event) => updateDraft("location", event.target.value)}
              value={draft.location}
            />
          </label>
          {validationError && <p className="text-sm text-red-700" role="alert">{validationError}</p>}
          <Button type="submit">Simpan metadata demo</Button>
        </form>
      ) : (
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">Nama Sumber Kamera</dt><dd className="mt-1 font-medium text-slate-950">{camera.name}</dd></div>
          <div><dt className="text-slate-500">Lokasi</dt><dd className="mt-1 font-medium text-slate-950">{camera.location}</dd></div>
        </dl>
      )}
      <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2">
        <div><dt className="text-slate-500">ID sumber</dt><dd className="mt-1 font-mono text-slate-950">{camera.id}</dd></div>
        <div><dt className="text-slate-500">Cakupan Supervisor Area</dt><dd className="mt-1 text-slate-950">{camera.supervisorArea}</dd></div>
        <div><dt className="text-slate-500">Zona terkait</dt><dd className="mt-1 text-slate-950">{camera.zoneIds.join(", ")}</dd></div>
        <div><dt className="text-slate-500">Pembaruan terakhir</dt><dd className="mt-1 font-mono text-slate-950">{formatWib(camera.lastUpdatedAt)}</dd></div>
      </dl>
      <p className="mt-5 border-l-2 border-amber-400 pl-3 text-sm leading-6 text-slate-600">Detail koneksi hanya menampilkan metadata aman untuk demo.</p>
    </section>
  );
}

function CameraCard({ camera, onSelect }: { camera: Camera; onSelect: () => void }) {
  return (
    <article aria-label={camera.name} className="border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CameraIcon aria-hidden="true" className="size-5 text-slate-500" />
            <h2 className="font-semibold text-slate-950">{camera.name}</h2>
          </div>
          <p className="mt-1 font-mono text-xs text-slate-500">{camera.id}</p>
        </div>
        <ConnectionStatus status={camera.status} />
      </div>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <div className="flex gap-2"><MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-400" /><span><dt className="text-slate-500">Lokasi</dt><dd className="mt-0.5 text-slate-900">{camera.location}</dd></span></div>
        <div><dt className="text-slate-500">Zona terkait</dt><dd className="mt-0.5 text-slate-900">{camera.zoneIds.join(", ")}</dd></div>
        <div className="flex gap-2"><Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-400" /><span><dt className="text-slate-500">Pembaruan terakhir</dt><dd className="mt-0.5 font-mono text-xs text-slate-900">{formatWib(camera.lastUpdatedAt)}</dd></span></div>
      </dl>
      <Button className="mt-5" onClick={onSelect} variant="outline">Lihat detail {camera.name}</Button>
    </article>
  );
}

function Cameras({ persona, service }: { persona: Persona; service: SawService }) {
  const [cameras, setCameras] = useState<Camera[]>();
  const [error, setError] = useState<string>();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<CameraStatus | "all">("all");
  const [selectedCameraId, setSelectedCameraId] = useState<string>();
  const [notice, setNotice] = useState<string>();

  useEffect(() => {
    let active = true;
    const scope: CameraScope = persona.role === "supervisor" ? { type: "supervisor-area", area: persona.assignedArea ?? "" } : "all";
    service.getCameras(scope).then((nextCameras) => {
      if (active) setCameras(nextCameras);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Sumber Kamera tidak dapat dimuat.");
    });
    return () => {
      active = false;
    };
  }, [persona.assignedArea, persona.role, service]);

  const filteredCameras = (cameras ?? []).filter((camera) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [camera.name, camera.location, camera.id, ...camera.zoneIds]
      .some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (statusFilter === "all" || camera.status === statusFilter);
  });
  const selectedCamera = cameras?.find((camera) => camera.id === selectedCameraId);

  const saveMetadata = async (camera: Camera, metadata: CameraMetadata) => {
    const savedCamera = await service.updateCameraMetadata(camera.id, metadata);
    setCameras((current) => current?.map((item) => item.id === savedCamera.id ? savedCamera : item));
    setNotice("Metadata Sumber Kamera diperbarui.");
  };

  if (error) {
    return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Sumber Kamera</h1><div className="mt-6 border border-red-200 bg-red-50 p-6"><p className="font-medium text-red-900">Sumber Kamera tidak dapat dimuat</p><p className="mt-1 text-sm text-red-800">{error}</p></div></section>;
  }
  if (cameras === undefined) {
    return <section aria-busy="true" aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Sumber Kamera</h1><p className="mt-6 text-slate-600">Memuat Sumber Kamera…</p></section>;
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Konfigurasi operasional</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Sumber Kamera</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Pantau sumber video pilot, lokasi, zona yang diamati, dan kesegaran data.</p></div>
        <span className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"><CameraIcon aria-hidden="true" className="size-4" />{cameras.length} sumber terdaftar</span>
      </div>
      <div className="mt-8 grid gap-3 border border-slate-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <label className="block text-sm font-medium text-slate-800">Cari Sumber Kamera<div className="relative mt-1"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" /><input aria-label="Cari Sumber Kamera" className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => setSearchTerm(event.target.value)} placeholder="Nama, lokasi, ID, atau zona" value={searchTerm} /></div></label>
        <label className="block text-sm font-medium text-slate-800">Filter status<select aria-label="Filter status" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => setStatusFilter(event.target.value as CameraStatus | "all")} value={statusFilter}><option value="all">Semua status</option><option value="online">Aktif</option><option value="degraded">Terganggu</option><option value="offline">Offline</option></select></label>
      </div>
      <p className="mt-4 text-sm text-slate-600">Menampilkan {filteredCameras.length} dari {cameras.length} Sumber Kamera</p>
      {notice && <p aria-live="polite" className="mt-3 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {cameras.length === 0 ? <div className="mt-4 border border-dashed border-slate-300 bg-white p-6"><p className="font-medium text-slate-900">Tidak ada Sumber Kamera yang terdaftar</p><p className="mt-1 text-sm text-slate-600">Tambahkan sumber kamera untuk mulai memantau cakupan.</p></div> : filteredCameras.length === 0 ? <div className="mt-4 border border-dashed border-slate-300 bg-white p-6"><p className="font-medium text-slate-900">Tidak ada Sumber Kamera yang cocok.</p><p className="mt-1 text-sm text-slate-600">Ubah kata pencarian atau filter status.</p></div> : <div aria-label="Daftar Sumber Kamera" className="mt-4 grid gap-4 xl:grid-cols-2" role="list">{filteredCameras.map((camera) => <CameraCard camera={camera} key={camera.id} onSelect={() => { setSelectedCameraId(camera.id); setNotice(undefined); }} />)}</div>}
      {selectedCamera && <div className="mt-6"><CameraDetail camera={selectedCamera} canEdit={persona.role === "admin"} key={selectedCamera.id} onSaved={(metadata) => void saveMetadata(selectedCamera, metadata)} /></div>}
    </section>
  );
}

type ScoreStatus = "safe" | "warning" | "critical";

const scoreStatusDetails: Record<ScoreStatus, {
  label: string;
  Icon: typeof ShieldCheck;
  className: string;
}> = {
  safe: { label: "Aman", Icon: ShieldCheck, className: "text-emerald-700" },
  warning: { label: "Waspada", Icon: ShieldAlert, className: "text-amber-700" },
  critical: { label: "Kritis", Icon: ShieldX, className: "text-red-700" },
};

function getScoreStatus(score: number, escalationThreshold: number): ScoreStatus {
  if (score < escalationThreshold) return "critical";
  if (score < 80) return "warning";
  return "safe";
}

function employeeName(employee: Employee) {
  return employee.name ?? `Karyawan ${employee.id}`;
}

function EmployeeScoreStatus({ score, escalationThreshold }: { score: number; escalationThreshold: number }) {
  const status = getScoreStatus(score, escalationThreshold);
  const { Icon, label, className } = scoreStatusDetails[status];

  return (
    <span aria-label={`Status skor: ${label}`} className={`inline-flex items-center gap-1.5 text-sm font-medium ${className}`}>
      <Icon aria-label={`Ikon status skor ${label}`} className="size-4" role="img" />
      {label}
    </span>
  );
}

const enrollmentLabels: Record<NonNullable<Employee["enrollmentStatus"]>, string> = {
  enrolled: "Terdaftar",
  pending: "Menunggu integrasi",
  "not-enrolled": "Belum terdaftar",
};

function EmployeeDetail({
  employee,
  escalationThreshold,
}: {
  employee: Employee;
  escalationThreshold: number;
}) {
  const [notice, setNotice] = useState<string>();
  const enrollmentStatus = employee.enrollmentStatus ?? "not-enrolled";
  const auditSummary = employee.auditSummary ?? { violationCount: 0, resetCount: 0 };

  return (
    <section aria-labelledby="employee-detail-title" className="border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Profil operasional</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950" id="employee-detail-title">Detail Karyawan</h2>
          <p className="mt-1 text-sm text-slate-600">{employeeName(employee)} · {employee.id}</p>
        </div>
        <EmployeeScoreStatus score={employee.safetyScore} escalationThreshold={escalationThreshold} />
      </div>
      <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div><dt className="text-slate-500">Departemen</dt><dd className="mt-1 font-medium text-slate-950">{employee.departmentId}</dd></div>
        <div><dt className="text-slate-500">Supervisor Area</dt><dd className="mt-1 font-medium text-slate-950">{employee.supervisorArea ?? employee.departmentId}</dd></div>
        <div><dt className="text-slate-500">Skor Keselamatan</dt><dd className="mt-1 font-mono font-medium text-slate-950">{employee.safetyScore}</dd></div>
        <div><dt className="text-slate-500">Ambang Eskalasi</dt><dd className="mt-1 font-mono font-medium text-slate-950">{escalationThreshold}</dd></div>
        <div><dt className="text-slate-500">Status enrollment</dt><dd className="mt-1 font-medium text-slate-950">{enrollmentLabels[enrollmentStatus]}</dd></div>
        <div><dt className="text-slate-500">Audit terakhir</dt><dd className="mt-1 font-mono text-slate-950">{employee.lastAuditAt ? formatWib(employee.lastAuditAt) : "Belum ada audit"}</dd></div>
      </dl>
      <div className="mt-6 border-t border-slate-100 pt-5">
        <h3 className="font-medium text-slate-950">Ringkasan audit</h3>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">Episode Pelanggaran</dt><dd className="mt-1 font-mono text-slate-950">{auditSummary.violationCount}</dd></div>
          <div><dt className="text-slate-500">Reset Skor</dt><dd className="mt-1 font-mono text-slate-950">{auditSummary.resetCount}</dd></div>
        </dl>
      </div>
      <div className="mt-6 border-l-2 border-amber-400 pl-3 text-sm leading-6 text-slate-600">
        <p>Enrollment memerlukan integrasi backend dan tidak dilakukan di browser demo.</p>
        <Button className="mt-3" onClick={() => setNotice("Integrasi enrollment backend diperlukan untuk melanjutkan.")} variant="outline">
          Mulai enrollment {employeeName(employee)}
        </Button>
        {notice && <p aria-live="polite" className="mt-3 text-amber-800">{notice}</p>}
      </div>
    </section>
  );
}

function EmployeeCard({ employee, escalationThreshold, onSelect }: { employee: Employee; escalationThreshold: number; onSelect: () => void }) {
  const name = employeeName(employee);

  return (
    <article aria-label={name} className="border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600"><UserRound aria-hidden="true" className="size-5" /></span>
          <div><h2 className="font-semibold text-slate-950">{name}</h2><p className="mt-1 font-mono text-xs text-slate-500">{employee.id}</p></div>
        </div>
        <EmployeeScoreStatus score={employee.safetyScore} escalationThreshold={escalationThreshold} />
      </div>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <div><dt className="text-slate-500">Departemen</dt><dd className="mt-0.5 text-slate-900">{employee.departmentId}</dd></div>
        <div><dt className="text-slate-500">Skor Keselamatan</dt><dd className="mt-0.5 font-mono text-slate-900">{employee.safetyScore}</dd></div>
        <div><dt className="text-slate-500">Enrollment</dt><dd className="mt-0.5 text-slate-900">{enrollmentLabels[employee.enrollmentStatus ?? "not-enrolled"]}</dd></div>
      </dl>
      <Button className="mt-5" onClick={onSelect} variant="outline">Lihat detail {name}</Button>
    </article>
  );
}

type EmployeeSort = "name-asc" | "name-desc" | "score-desc" | "score-asc";

function Employees({ persona, service }: { persona: Persona; service: SawService }) {
  const [directory, setDirectory] = useState<EmployeeDirectoryData>();
  const [error, setError] = useState<string>();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState<ScoreStatus | "all">("all");
  const [sort, setSort] = useState<EmployeeSort>("name-asc");
  const [page, setPage] = useState(1);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>();
  const pageSize = 5;

  useEffect(() => {
    let active = true;
    const scope: EmployeeScope = persona.role === "supervisor" ? { type: "supervisor-area", area: persona.assignedArea ?? "" } : "all";
    service.getEmployeeDirectory(scope).then((nextDirectory) => {
      if (active) setDirectory(nextDirectory);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Direktori Karyawan tidak dapat dimuat.");
    });
    return () => {
      active = false;
    };
  }, [persona.assignedArea, persona.role, service]);

  const employees = directory?.employees ?? [];
  const departments = [...new Set(employees.map((employee) => employee.departmentId))].sort((a, b) => a.localeCompare(b));
  const query = searchTerm.trim().toLowerCase();
  const filteredEmployees = employees.filter((employee) => {
    const searchable = [employeeName(employee), employee.id, employee.departmentId, employee.supervisorArea ?? ""].join(" ").toLowerCase();
    const matchesSearch = !query || searchable.includes(query);
    const matchesDepartment = departmentFilter === "all" || employee.departmentId === departmentFilter;
    const matchesScore = scoreFilter === "all" || getScoreStatus(employee.safetyScore, directory?.escalationThreshold ?? 60) === scoreFilter;
    return matchesSearch && matchesDepartment && matchesScore;
  }).sort((a, b) => {
    if (sort === "score-asc") return a.safetyScore - b.safetyScore;
    if (sort === "score-desc") return b.safetyScore - a.safetyScore;
    const comparison = employeeName(a).localeCompare(employeeName(b));
    return sort === "name-desc" ? -comparison : comparison;
  });

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const visibleEmployees = filteredEmployees.slice(pageStart, pageStart + pageSize);
  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId);
  const clearFilters = () => {
    setSearchTerm("");
    setDepartmentFilter("all");
    setScoreFilter("all");
    setSort("name-asc");
    setSelectedEmployeeId(undefined);
  };

  if (error) {
    return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Karyawan</h1><div className="mt-6 border border-red-200 bg-red-50 p-6"><p className="font-medium text-red-900">Direktori Karyawan tidak dapat dimuat</p><p className="mt-1 text-sm text-red-800">{error}</p></div></section>;
  }
  if (directory === undefined) {
    return <section aria-busy="true" aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Karyawan</h1><p className="mt-6 text-slate-600">Memuat Direktori Karyawan…</p></section>;
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Direktori operasional</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Karyawan</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Temukan Karyawan, posisi Skor Keselamatan, dan konteks audit tanpa capture biometrik.</p></div>
        <span className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"><UserRound aria-hidden="true" className="size-4" />{employees.length} Karyawan</span>
      </div>
      <div className="mt-8 grid gap-3 border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_12rem_12rem_13rem]">
        <label className="block text-sm font-medium text-slate-800">Cari Karyawan<div className="relative mt-1"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" /><input aria-label="Cari Karyawan" className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }} placeholder="Nama, ID, departemen, atau area" value={searchTerm} /></div></label>
        <label className="block text-sm font-medium text-slate-800">Filter departemen<select aria-label="Filter departemen" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => { setDepartmentFilter(event.target.value); setPage(1); }} value={departmentFilter}><option value="all">Semua departemen</option>{departments.map((department) => <option key={department} value={department}>{department}</option>)}</select></label>
        <label className="block text-sm font-medium text-slate-800">Filter status skor<select aria-label="Filter status skor" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => { setScoreFilter(event.target.value as ScoreStatus | "all"); setPage(1); }} value={scoreFilter}><option value="all">Semua status</option><option value="safe">Aman</option><option value="warning">Waspada</option><option value="critical">Kritis</option></select></label>
        <label className="block text-sm font-medium text-slate-800"><span className="inline-flex items-center gap-1">Urutkan Karyawan <ArrowDownUp aria-hidden="true" className="size-3.5" /></span><select aria-label="Urutkan Karyawan" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => { setSort(event.target.value as EmployeeSort); setPage(1); }} value={sort}><option value="name-asc">Nama A–Z</option><option value="name-desc">Nama Z–A</option><option value="score-desc">Skor tertinggi</option><option value="score-asc">Skor terendah</option></select></label>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600"><p>{filteredEmployees.length === 0 ? "Menampilkan 0 Karyawan" : `Menampilkan ${pageStart + 1}–${Math.min(pageStart + pageSize, filteredEmployees.length)} dari ${filteredEmployees.length} Karyawan`}</p>{filteredEmployees.length > 0 && (query || departmentFilter !== "all" || scoreFilter !== "all" || sort !== "name-asc") && <Button onClick={clearFilters} size="sm" variant="outline">Bersihkan filter Karyawan</Button>}</div>
      {employees.length === 0 ? <div className="mt-4 border border-dashed border-slate-300 bg-white p-6"><p className="font-medium text-slate-900">Belum ada Karyawan</p><p className="mt-1 text-sm text-slate-600">Tambahkan data Karyawan melalui integrasi backend.</p><Button className="mt-4" onClick={clearFilters} variant="outline">Bersihkan filter Karyawan</Button></div> : filteredEmployees.length === 0 ? <div className="mt-4 border border-dashed border-slate-300 bg-white p-6"><p className="font-medium text-slate-900">Tidak ada Karyawan yang cocok.</p><p className="mt-1 text-sm text-slate-600">Bersihkan filter untuk melihat seluruh direktori.</p><Button className="mt-4" onClick={clearFilters} variant="outline">Bersihkan filter Karyawan</Button></div> : <div aria-label="Daftar Karyawan" className="mt-4 grid gap-4 xl:grid-cols-2" role="list">{visibleEmployees.map((employee) => <EmployeeCard employee={employee} escalationThreshold={directory.escalationThreshold} key={employee.id} onSelect={() => setSelectedEmployeeId(employee.id)} />)}</div>}
      {filteredEmployees.length > pageSize && <nav aria-label="Pagination Karyawan" className="mt-5 flex items-center justify-between"><Button disabled={currentPage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" variant="outline"><ChevronLeft aria-hidden="true" className="mr-1 size-4" />Halaman sebelumnya</Button><span className="font-mono text-xs text-slate-500">Halaman {currentPage} dari {totalPages}</span><Button disabled={currentPage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} size="sm" variant="outline">Halaman berikutnya<ChevronRight aria-hidden="true" className="ml-1 size-4" /></Button></nav>}
      {selectedEmployee && <div className="mt-6"><EmployeeDetail employee={selectedEmployee} escalationThreshold={directory.escalationThreshold} /></div>}
    </section>
  );
}

function RestrictedAccess({ persona }: { persona: Persona }) {
  return (
    <section className="mx-auto max-w-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
      <LockKeyhole aria-hidden="true" className="size-6 text-amber-700" />
      <p className="mt-5 font-mono text-xs uppercase tracking-[0.16em] text-amber-800">Hak akses</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Akses terbatas</h1>
      <p className="mt-3 leading-6 text-slate-700">Halaman ini tidak tersedia untuk persona {persona.name}. Pilih ruang kerja yang sesuai dengan peran Anda.</p>
      <Button className="mt-6" onClick={() => window.history.back()} variant="outline">Kembali</Button>
    </section>
  );
}

function ProtectedPage({ persona, allowedRoles, service, title }: { persona: Persona; allowedRoles: Role[]; service: SawService; title: string }) {
  if (!allowedRoles.includes(persona.role)) return <RestrictedAccess persona={persona} />;
  if (title === "Overview") return <Overview service={service} />;
  if (title === "Sumber Kamera") return <Cameras persona={persona} service={service} />;
  if (title === "Karyawan") return <Employees persona={persona} service={service} />;
  return <Page title={title} />;
}

function RoutedApplication({ initialPersona, service }: { initialPersona?: Role; service: SawService }) {
  const [role, setRole] = useState<Role | undefined>(initialPersona);
  const navigate = useNavigate();
  const persona = role ? getPersona(role) : undefined;

  const login = (nextRole: Role) => {
    setRole(nextRole);
    navigate(getPersona(nextRole).landingPath, { replace: true });
  };

  const logout = () => {
    setRole(undefined);
    navigate("/login", { replace: true });
  };

  if (!persona) {
    return <Routes><Route path="*" element={<Login onLogin={login} />} /></Routes>;
  }

  return (
    <ApplicationShell onLogout={logout} persona={persona}>
      <Routes>
        <Route path="/login" element={<Navigate replace to={persona.landingPath} />} />
        <Route path="/" element={<Navigate replace to={persona.landingPath} />} />
        {pages.map((page) => <Route element={<ProtectedPage allowedRoles={page.roles} persona={persona} service={service} title={page.title} />} key={page.path} path={page.path} />)}
        <Route path="*" element={<Navigate replace to={persona.landingPath} />} />
      </Routes>
    </ApplicationShell>
  );
}

const defaultService = createMockSawService();

export function App({ initialEntries, initialPersona, service = defaultService }: { initialEntries?: string[]; initialPersona?: Role; service?: SawService }) {
  if (initialEntries) return <MemoryRouter initialEntries={initialEntries}><RoutedApplication initialPersona={initialPersona} service={service} /></MemoryRouter>;
  return <BrowserRouter><RoutedApplication initialPersona={initialPersona} service={service} /></BrowserRouter>;
}
