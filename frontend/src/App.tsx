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
import { Activity, ChevronRight, LockKeyhole, LogOut } from "lucide-react";

import { Button } from "./components/ui/button";
import { createMockSawService, type OverviewData, type SawService } from "./services/saw-service";

type Role = "admin" | "supervisor" | "hrd";

type Persona = {
  role: Role;
  name: string;
  description: string;
  landingPath: string;
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
  { group: "Configuration", path: "/konfigurasi/kamera", title: "Sumber Kamera", roles: ["admin"] },
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
