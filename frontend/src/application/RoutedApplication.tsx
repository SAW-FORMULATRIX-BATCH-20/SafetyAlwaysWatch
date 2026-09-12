import { animate, createScope } from "animejs";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Link,
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

import { Button } from "../components/ui/button";
import industrialMonitoringScene from "../assets/industrial-monitoring.svg";
import {
  type Camera,
  type CameraMetadata,
  type CameraScope,
  type CameraSourceCapability,
  type CameraStatus,
  type ComplianceReportData,
  type ComplianceReportingCapability,
  type CanonicalPpeClassConfiguration,
  type CanonicalPpeClassMapping,
  type CanonicalPpeClassCapability,
  type Employee,
  type EmployeeDirectoryCapability,
  type EmployeeDirectoryData,
  type EmployeeScope,
  type EpisodeStatus,
  type HazardousZoneCapability,
  type MonitoringCapability,
  type MonitoringScenario,
  type MonitoringSimulation,
  type NormalizedZoneBounds,
  type NotificationCapability,
  type NotificationRecipient,
  type NotificationRecipientRole,
  type NotificationRecipientScope,
  type NotificationSimulationLog,
  type OverviewCapability,
  type OverviewData,
  type SafetyScoreAudit,
  type SafetyScoreCapability,
  type SafetyScoreResetReason,
  type SafetyScoreResetResult,
  type SafetySettings,
  type SafetySettingsCapability,
  type SawApplicationCapabilities,
  type ViolationHistoryCapability,
  type ViolationRecord,
  type HazardousZone,
  type HazardousZoneInput,
  type HazardousZoneWithViolationHistory,
  safetyScoreResetReasonLabels,
  safetyScoreResetReasons,
} from "../services/saw-service";

const ReportCharts = lazy(() => import("../components/report-charts").then((module) => ({ default: module.ReportCharts })));

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
  render: (persona: Persona, service: SawApplicationCapabilities) => React.ReactNode;
};

const personas: Persona[] = [
  {
    role: "admin",
    name: "Admin/Safety Officer",
    description: "Manage SAW safety operations and configuration.",
    landingPath: "/overview",
  },
  {
    role: "supervisor",
    name: "Area Supervisor",
    description: "Monitor the Hazardous Zones assigned to you.",
    landingPath: "/monitoring/live",
    assignedArea: "Production",
  },
  {
    role: "hrd",
    name: "Human Resources (HR)",
    description: "Review PPE Compliance trends and Employee safety records.",
    landingPath: "/compliance-report",
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
  { group: "Overview", path: "/overview", title: "Overview", roles: ["admin"], render: (_persona, service) => <Overview service={service} /> },
  { group: "Overview", path: "/compliance-report", title: "Compliance Report", roles: ["admin", "hrd"], render: (_persona, service) => <ComplianceReport service={service} /> },
  { group: "Monitoring", path: "/monitoring/live", title: "Live Monitoring", roles: ["admin", "supervisor"], render: (persona, service) => <LiveMonitoring persona={persona} service={service} /> },
  { group: "Safety Operations", path: "/violations", title: "Violations", roles: ["admin", "supervisor", "hrd"], render: (_persona, service) => <Violations service={service} /> },
  { group: "Safety Operations", path: "/employees", title: "Employees", roles: ["admin", "supervisor", "hrd"], render: (persona, service) => <Employees persona={persona} service={service} /> },
  { group: "Configuration", path: "/camera-sources", title: "Camera Sources", roles: ["admin", "supervisor"], render: (persona, service) => <Cameras persona={persona} service={service} /> },
  { group: "Configuration", path: "/hazardous-zones", title: "Hazardous Zones", roles: ["admin"], render: (_persona, service) => <HazardousZoneEditor service={service} /> },
  { group: "Configuration", path: "/canonical-ppe-classes", title: "Canonical PPE Classes", roles: ["admin"], render: (_persona, service) => <CanonicalPpeClasses service={service} /> },
  { group: "Administration", path: "/safety-parameters", title: "Safety Parameters", roles: ["admin"], render: (_persona, service) => <SafetyParameters service={service} /> },
  { group: "Administration", path: "/score-reset", title: "Score Reset", roles: ["admin"], render: (_persona, service) => <SafetyScoreReset service={service} /> },
  { group: "Administration", path: "/notifications", title: "Notifications", roles: ["admin", "hrd"], render: (persona, service) => <NotificationConfiguration persona={persona} service={service} /> },
];

const legacyRouteRedirects = {
  "/laporan-kepatuhan": "/compliance-report",
  "/pelanggaran": "/violations",
  "/karyawan": "/employees",
  "/konfigurasi/kamera": "/camera-sources",
  "/konfigurasi/zona": "/hazardous-zones",
  "/konfigurasi/apd": "/canonical-ppe-classes",
  "/administrasi/parameter": "/safety-parameters",
  "/administrasi/reset-skor": "/score-reset",
  "/administrasi/notifikasi": "/notifications",
} as const;

function getPersona(role: Role) {
  return personas.find((persona) => persona.role === role)!;
}

function cameraScopeFor(persona: Persona): CameraScope {
  return persona.role === "supervisor"
    ? { type: "supervisor-area", area: persona.assignedArea ?? "" }
    : "all";
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
            Run workplace safety operations with clarity.
          </h1>
          <p className="mt-4 max-w-lg text-slate-400">
            Enter the demo environment to review the SAW experience for your operational role.
          </p>
        </div>
        <p className="font-mono text-xs text-slate-500">DEMO ENVIRONMENT · ENGLISH</p>
      </section>

      <section className="flex items-center bg-white p-6 text-slate-900 sm:p-10">
        <div className="mx-auto w-full max-w-md">
          <div className="font-mono text-sm tracking-[0.24em] text-slate-950 lg:hidden">SAW</div>
          <p className="mt-8 font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Demo access</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Sign in to SAW</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Choose a persona to open the workspace with the appropriate access.
          </p>
          <fieldset className="mt-8 space-y-3">
            <legend className="sr-only">Demo persona</legend>
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
            Sign in to SAW
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
      <aside className="bg-slate-950 px-4 py-5 text-slate-200 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <Link aria-label="SAW home" className="font-mono text-lg font-medium tracking-[0.2em] text-white" to={persona.landingPath}>
            SAW
          </Link>
          <span className="rounded bg-amber-400 px-2 py-1 font-mono text-[10px] font-medium tracking-[0.12em] text-slate-950">DEMO</span>
        </div>
        <nav aria-label="Main navigation" className="mt-6 space-y-6">
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
          <div className="flex items-center gap-2 text-sm text-slate-500"><Activity aria-hidden="true" className="size-4 text-amber-600" />Safety operations</div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right text-sm sm:block"><span className="block font-medium text-slate-800">{persona.name}</span><span className="font-mono text-xs text-slate-500">DEMO-ROLE</span></span>
            <Button aria-label="Sign out of SAW" onClick={onLogout} size="sm" variant="outline"><LogOut aria-hidden="true" className="mr-1.5 size-3.5" />Sign out</Button>
          </div>
        </header>
        <main className="flex-1 p-5 sm:p-8" data-shell-content>{children}</main>
      </div>
    </div>
  );
}

function PageState({ title }: { title: string }) {
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

function AccessibleDialog({
  children,
  label,
  onDismiss,
}: {
  children: React.ReactNode;
  label: string;
  onDismiss: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const initialFocus = dialogRef.current?.querySelector<HTMLElement>("[data-dialog-initial-focus], button, [href], input, select, textarea");
    initialFocus?.focus();
    return () => previousFocusRef.current?.focus();
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onDismiss();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])") ?? [])];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return <section aria-label={label} aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-5" onKeyDown={handleKeyDown} ref={dialogRef} role="dialog">{children}</section>;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const update = () => setMatches(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, [query]);

  return matches;
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

function Overview({ service }: { service: OverviewCapability }) {
  const [overview, setOverview] = useState<OverviewData | null>();
  const [error, setError] = useState<string>();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    service.getOverview().then((nextOverview) => {
      if (active) setOverview(nextOverview);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "SAW demo data could not be loaded.");
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
    return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Overview</h1><div className="mt-6 border border-red-200 bg-red-50 p-6"><p className="font-medium text-red-900">SAW demo data could not be loaded</p><p className="mt-1 text-sm text-red-800">{error}</p><Button className="mt-4" onClick={retryLoad} variant="outline">Try again</Button></div></section>;
  }

  if (overview === undefined) {
    return <section aria-busy="true" aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Overview</h1><p className="mt-6 text-slate-600">Loading safety overview…</p></section>;
  }

  if (overview === null) {
    return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Overview</h1><div className="mt-6 border border-dashed border-slate-300 bg-white p-6"><p className="font-medium">No data demo</p><p className="mt-1 text-sm text-slate-600">Addkan data SAW untuk melihat ringkasan keselamatan.</p></div></section>;
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Operational overview</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Overview</h1><p className="mt-2 text-sm text-slate-600">Current SAW safety condition.</p></div>
        <Button onClick={() => setConfirmingReset(true)} variant="outline">Reset data demo</Button>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Active Camera Sources</p><Metric suffix={` / ${overview.totalCameras}`} value={overview.activeCameras} /></article>
        <article className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Active Violations</p><Metric value={overview.activeViolations} /></article>
        <article className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Today's PPE Compliance</p><Metric suffix="%" value={overview.ppeCompliance} /></article>
        <article className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Employee di bawah Escalation Threshold</p><Metric value={overview.employeesBelowEscalationThreshold} /></article>
      </div>
      {confirmingReset && <AccessibleDialog label="Reset data demo?" onDismiss={() => setConfirmingReset(false)}><div className="w-full max-w-md bg-white p-6 shadow-xl"><h2 className="text-xl font-semibold">Reset data demo?</h2><p className="mt-2 text-sm leading-6 text-slate-600">All demo changes will be restored to the initial seed.</p><div className="mt-6 flex justify-end gap-3"><Button data-dialog-initial-focus onClick={() => setConfirmingReset(false)} variant="outline">Cancel</Button><Button onClick={() => void resetDemoData()}>Reset data</Button></div></div></AccessibleDialog>}
    </section>
  );
}

const cameraStatusDetailss: Record<CameraStatus, {
  label: string;
  Icon: typeof CheckCircle2;
  className: string;
}> = {
  online: { label: "Active", Icon: CheckCircle2, className: "text-emerald-700" },
  degraded: { label: "Terganggu", Icon: TriangleAlert, className: "text-amber-700" },
  offline: { label: "Offline", Icon: WifiOff, className: "text-slate-600" },
};

const reportSafetyStatusLabels: Record<ScoreStatus, string> = {
  safe: "Safe",
  warning: "Warning",
  critical: "Critical",
};

const reportSafetyStatusColors: Record<ScoreStatus, string> = {
  safe: "#047857",
  warning: "#b45309",
  critical: "#b91c1c",
};

function reportDate(timestamp: string) {
  return timestamp.slice(0, 10);
}

function formatReportDate(timestamp: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(timestamp));
}

function ComplianceReport({ service }: { service: ComplianceReportingCapability }) {
  const [report, setReport] = useState<ComplianceReportData>();
  const [error, setError] = useState<string>();
  const [zoneId, setZoneId] = useState("all");
  const [departmentId, setDepartmentId] = useState("all");
  const [employeeId, setEmployeeId] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    let active = true;
    service.getComplianceReport().then((nextReport) => {
      if (active) setReport(nextReport);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "The Compliance Report could not be loaded.");
    });
    return () => {
      active = false;
    };
  }, [service]);

  const clearFilters = () => {
    setZoneId("all");
    setDepartmentId("all");
    setEmployeeId("all");
    setFromDate("");
    setToDate("");
  };

  if (error) {
    return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Compliance Report</h1><div className="mt-6 border border-red-200 bg-red-50 p-6"><p className="font-medium text-red-900">The Compliance Report could not be loaded</p><p className="mt-1 text-sm text-red-800">{error}</p></div></section>;
  }
  if (report === undefined) {
    return <section aria-busy="true" aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Compliance Report</h1><p className="mt-6 text-slate-600">Loading Compliance Report…</p></section>;
  }
  if (report.observations.length === 0) {
    return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Compliance Report</h1><div className="mt-6 border border-dashed border-slate-300 bg-white p-6"><p className="font-medium text-slate-900">No PPE Compliance observations yet</p><p className="mt-1 text-sm text-slate-600">Observation data is needed before safety trends and distributions can be shown.</p></div></section>;
  }

  const zones = [...report.zones].sort((left, right) => left.name.localeCompare(right.name));
  const departments = [...new Set(report.observations.map((observation) => observation.departmentId))].sort((left, right) => left.localeCompare(right));
  const employees = report.employees.filter((employee) => report.observations.some((observation) => observation.employeeId === employee.id));
  const filtered = report.observations.filter((observation) => {
    const observedDate = reportDate(observation.observedAt);
    return (zoneId === "all" || observation.zoneId === zoneId)
      && (departmentId === "all" || observation.departmentId === departmentId)
      && (employeeId === "all" || observation.employeeId === employeeId)
      && (!fromDate || observedDate >= fromDate)
      && (!toDate || observedDate <= toDate);
  });
  const hasFilters = zoneId !== "all" || departmentId !== "all" || employeeId !== "all" || fromDate !== "" || toDate !== "";

  const trend = [...new Set(filtered.map((observation) => reportDate(observation.observedAt)))].sort().map((date) => {
    const observations = filtered.filter((observation) => reportDate(observation.observedAt) === date);
    const compliant = observations.filter((observation) => observation.isCompliant).length;
    return { date: formatReportDate(`${date}T00:00:00+07:00`), compliant, total: observations.length, rate: Math.round((compliant / observations.length) * 100) };
  });
  const ppeBreakdown = [...new Set(filtered.map((observation) => observation.canonicalPpeClass))].sort((left, right) => left.localeCompare(right)).map((canonicalPpeClass) => {
    const observations = filtered.filter((observation) => observation.canonicalPpeClass === canonicalPpeClass);
    return { canonicalPpeClass, compliant: observations.filter((observation) => observation.isCompliant).length, violation: observations.filter((observation) => !observation.isCompliant).length };
  });
  const latestSafetyScoreByEmployee = new Map<string, number>();
  [...filtered].sort((left, right) => left.observedAt.localeCompare(right.observedAt)).forEach((observation) => {
    if (observation.employeeId) latestSafetyScoreByEmployee.set(observation.employeeId, observation.safetyScore);
  });
  const safetyDistribution = (Object.keys(reportSafetyStatusLabels) as ScoreStatus[]).map((status) => ({
    status: reportSafetyStatusLabels[status],
    count: [...latestSafetyScoreByEmployee.values()].filter((score) => getScoreStatus(score, report.escalationThreshold) === status).length,
    color: reportSafetyStatusColors[status],
  }));
  const compliantObservations = filtered.filter((observation) => observation.isCompliant).length;
  const complianceRate = filtered.length === 0 ? 0 : Math.round((compliantObservations / filtered.length) * 100);
  const sortedDates = [...filtered].sort((left, right) => left.observedAt.localeCompare(right.observedAt));
  const period = sortedDates.length === 0 ? "No period" : `${formatReportDate(sortedDates[0].observedAt)} – ${formatReportDate(sortedDates[sortedDates.length - 1].observedAt)}`;

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Operational analysis</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Compliance Report</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Review PPE Compliance trends, Canonical PPE Classes, and Safety Score conditions from the same observations.</p></div><span className="border border-amber-300 bg-amber-50 px-3 py-2 font-mono text-xs font-medium tracking-[0.12em] text-amber-950">SIMULATION</span></div>

      <div className="mt-8 grid gap-3 border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-3">
        <label className="block text-sm font-medium text-slate-800">Hazardous Zones<select aria-label="Report Hazardous Zone filter" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => setZoneId(event.target.value)} value={zoneId}><option value="all">All Hazardous Zones</option>{zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label>
        <label className="block text-sm font-medium text-slate-800">Department<select aria-label="Report department filter" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => setDepartmentId(event.target.value)} value={departmentId}><option value="all">All departments</option>{departments.map((department) => <option key={department} value={department}>{department}</option>)}</select></label>
        <label className="block text-sm font-medium text-slate-800">Employee<select aria-label="Report Employee filter" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => setEmployeeId(event.target.value)} value={employeeId}><option value="all">All Employees</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employeeName(employee)}</option>)}</select></label>
        <label className="block text-sm font-medium text-slate-800">From date<input aria-label="Report start date" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => setFromDate(event.target.value)} type="date" value={fromDate} /></label>
        <label className="block text-sm font-medium text-slate-800">To date<input aria-label="Report end date" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => setToDate(event.target.value)} type="date" value={toDate} /></label>
        <div className="flex items-end">{hasFilters && filtered.length > 0 && <Button onClick={clearFilters} variant="outline">Clear report filters</Button>}</div>
      </div>

      {filtered.length === 0 ? <div className="mt-5 border border-dashed border-slate-300 bg-white p-6"><p className="font-medium text-slate-900">No matching report results.</p><p className="mt-1 text-sm text-slate-600">Change or clear filters to see PPE Compliance observations.</p><Button className="mt-4" onClick={clearFilters} variant="outline">Clear report filters</Button></div> : <>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><article className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">PPE Compliance</p><p className="mt-2 font-mono text-3xl font-semibold text-slate-950">{complianceRate}%</p><p className="mt-2 text-sm text-slate-600">{compliantObservations} patuh dari {filtered.length} observasi</p></article><article className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Report observations</p><p className="mt-2 font-mono text-3xl font-semibold text-slate-950">{filtered.length}</p><p className="mt-2 text-sm text-slate-600">{filtered.length} PPE Compliance observations</p></article><article className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Violation PPE</p><p className="mt-2 font-mono text-3xl font-semibold text-slate-950">{filtered.length - compliantObservations}</p><p className="mt-2 text-sm text-slate-600">Non-compliant PPE observations</p></article><article className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Period</p><p className="mt-2 font-mono text-lg font-semibold text-slate-950">{period}</p><p className="mt-2 text-sm text-slate-600">WIB · active filters</p></article></div>
        <Suspense fallback={<p aria-busy="true" className="mt-8 text-sm text-slate-600">Loading visualisasi laporan…</p>}><ReportCharts ppeBreakdown={ppeBreakdown} filteredObservationCount={filtered.length} period={period} safetyDistribution={safetyDistribution} trend={trend} /></Suspense>
      </>}
    </section>
  );
}

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

function formatRelativeWib(timestamp: string) {
  const differenceMinutes = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 60_000));
  if (differenceMinutes < 60) return `${differenceMinutes} menit lalu`;
  const differenceHours = Math.round(differenceMinutes / 60);
  if (differenceHours < 24) return `${differenceHours} jam lalu`;
  return `${Math.round(differenceHours / 24)} hari lalu`;
}

function ConnectionStatus({ status }: { status: CameraStatus }) {
  const { Icon, label, className } = cameraStatusDetailss[status];

  return (
    <span aria-label={`Status koneksi: ${label}`} className={`inline-flex items-center gap-1.5 text-sm font-medium ${className}`}>
      <Icon aria-label={`Ikon status ${label}`} className="size-4" role="img" />
      {label}
    </span>
  );
}

function CameraDetails({
  camera,
  canEdit,
  onSaved,
  zones,
}: {
  camera: Camera;
  canEdit: boolean;
  onSaved: (metadata: CameraMetadata) => void;
  zones: HazardousZone[];
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
      setValidationError("Camera Source name and location are required.");
      return;
    }
    onSaved({ name: draft.name.trim(), location: draft.location.trim() });
  };

  return (
    <section aria-labelledby="camera-detail-title" className="border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Metadata operasional</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950" id="camera-detail-title">Camera Source Details</h2>
        </div>
        <ConnectionStatus status={camera.status} />
      </div>
      {canEdit ? (
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-medium text-slate-800">
            Name Camera Source
            <input
              className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              onChange={(event) => updateDraft("name", event.target.value)}
              value={draft.name}
            />
          </label>
          <label className="block text-sm font-medium text-slate-800">
            Location
            <input
              className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              onChange={(event) => updateDraft("location", event.target.value)}
              value={draft.location}
            />
          </label>
          {validationError && <p className="text-sm text-red-700" role="alert">{validationError}</p>}
          <Button type="submit">Save metadata demo</Button>
        </form>
      ) : (
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">Name Camera Sources</dt><dd className="mt-1 font-medium text-slate-950">{camera.name}</dd></div>
          <div><dt className="text-slate-500">Location</dt><dd className="mt-1 font-medium text-slate-950">{camera.location}</dd></div>
        </dl>
      )}
      <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2">
        <div><dt className="text-slate-500">ID sumber</dt><dd className="mt-1 font-mono text-slate-950">{camera.id}</dd></div>
        <div><dt className="text-slate-500">Area Supervisor scope</dt><dd className="mt-1 text-slate-950">{camera.supervisorArea}</dd></div>
        <div><dt className="text-slate-500">Related Hazardous Zones</dt><dd className="mt-1 text-slate-950">{camera.zoneIds.join(", ")}</dd></div>
        <div><dt className="text-slate-500">Latest update</dt><dd className="mt-1 font-mono text-slate-950">{formatWib(camera.lastUpdatedAt)}</dd></div>
      </dl>
      <ul aria-label="Status Hazardous Zone" className="mt-5 flex flex-wrap gap-2 text-sm">{zones.filter((zone) => camera.zoneIds.includes(zone.id)).map((zone) => <li className="border border-slate-200 bg-slate-50 px-2 py-1" key={zone.id}>{zone.name} · {zone.active ? "Active" : "Inactive"}</li>)}</ul>
      <p className="mt-5 border-l-2 border-amber-400 pl-3 text-sm leading-6 text-slate-600">Connection details show only safe demo metadata.</p>
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
        <div className="flex gap-2"><MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-400" /><span><dt className="text-slate-500">Location</dt><dd className="mt-0.5 text-slate-900">{camera.location}</dd></span></div>
        <div><dt className="text-slate-500">Related Hazardous Zones</dt><dd className="mt-0.5 text-slate-900">{camera.zoneIds.join(", ")}</dd></div>
        <div className="flex gap-2"><Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-400" /><span><dt className="text-slate-500">Latest update</dt><dd className="mt-0.5 font-mono text-xs text-slate-900">{formatWib(camera.lastUpdatedAt)}</dd></span></div>
      </dl>
      <Button className="mt-5" onClick={onSelect} variant="outline">View details {camera.name}</Button>
    </article>
  );
}

function Cameras({ persona, service }: { persona: Persona; service: CameraSourceCapability & HazardousZoneCapability }) {
  const [cameras, setCameras] = useState<Camera[]>();
  const [zones, setZones] = useState<HazardousZone[]>();
  const [error, setError] = useState<string>();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<CameraStatus | "all">("all");
  const [selectedCameraId, setSelectedCameraId] = useState<string>();
  const [notice, setNotice] = useState<string>();

  useEffect(() => {
    let active = true;
    Promise.all([service.getCameras(cameraScopeFor(persona)), service.getHazardousZone()]).then(([nextCameras, nextZones]) => {
      if (active) {
        setCameras(nextCameras);
        setZones(nextZones);
      }
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Camera Sources could not be loaded.");
    });
    return () => {
      active = false;
    };
  }, [persona, service]);

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
    setNotice("Metadata Camera Source diperbarui.");
  };

  if (error) {
    return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Camera Sources</h1><div className="mt-6 border border-red-200 bg-red-50 p-6"><p className="font-medium text-red-900">Camera Source tidak dapat dimuat</p><p className="mt-1 text-sm text-red-800">{error}</p></div></section>;
  }
  if (cameras === undefined || zones === undefined) {
    return <section aria-busy="true" aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Camera Sources</h1><p className="mt-6 text-slate-600">Loading Camera Source…</p></section>;
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Operational configuration</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Camera Sources</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Monitor pilot video sources, locations, observed zones, and data freshness.</p></div>
        <span className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"><CameraIcon aria-hidden="true" className="size-4" />{cameras.length} sources registered</span>
      </div>
      <div className="mt-8 grid gap-3 border border-slate-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <label className="block text-sm font-medium text-slate-800">Search Camera Sources<div className="relative mt-1"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" /><input aria-label="Search Camera Source" className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => setSearchTerm(event.target.value)} placeholder="Name, location, ID, or zone" value={searchTerm} /></div></label>
        <label className="block text-sm font-medium text-slate-800">Filter status<select aria-label="Filter status" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => setStatusFilter(event.target.value as CameraStatus | "all")} value={statusFilter}><option value="all">All statuses</option><option value="online">Active</option><option value="degraded">Degraded</option><option value="offline">Offline</option></select></label>
      </div>
      <p className="mt-4 text-sm text-slate-600">Showing {filteredCameras.length} of {cameras.length} Camera Sources</p>
      {notice && <p aria-live="polite" className="mt-3 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {cameras.length === 0 ? <div className="mt-4 border border-dashed border-slate-300 bg-white p-6"><p className="font-medium text-slate-900">No Camera Sources are registered</p><p className="mt-1 text-sm text-slate-600">Add Camera Sources to start monitoring coverage.</p></div> : filteredCameras.length === 0 ? <div className="mt-4 border border-dashed border-slate-300 bg-white p-6"><p className="font-medium text-slate-900">No Camera Sources match.</p><p className="mt-1 text-sm text-slate-600">Change the search term or status filter.</p></div> : <div aria-label="Camera Source list" className="mt-4 grid gap-4 xl:grid-cols-2" role="list">{filteredCameras.map((camera) => <CameraCard camera={camera} key={camera.id} onSelect={() => { setSelectedCameraId(camera.id); setNotice(undefined); }} />)}</div>}
      {selectedCamera && <div className="mt-6"><CameraDetails camera={selectedCamera} canEdit={persona.role === "admin"} key={selectedCamera.id} onSaved={(metadata) => void saveMetadata(selectedCamera, metadata)} zones={zones} /></div>}
    </section>
  );
}

function LiveMonitoring({ persona, service }: { persona: Persona; service: CameraSourceCapability & HazardousZoneCapability & MonitoringCapability & NotificationCapability & SafetySettingsCapability }) {
  const [cameras, setCameras] = useState<Camera[]>();
  const [zones, setZones] = useState<HazardousZone[]>();
  const [simulation, setSimulation] = useState<MonitoringSimulation>();
  const [settings, setSettings] = useState<SafetySettings>();
  const [selectedCameraId, setSelectedCameraId] = useState<string>();
  const [notificationFeed, setNotificationFeed] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    Promise.all([service.getCameras(cameraScopeFor(persona)), service.getHazardousZone(), service.getMonitoringSimulation(), service.getSafetySettings(), service.getNotificationSimulationLogs()]).then(([nextCameras, nextZones, nextSimulation, nextSettings, notificationLogs]) => {
      if (!active) return;
      setCameras(nextCameras);
      setZones(nextZones);
      setSimulation(nextSimulation);
      setSettings(nextSettings);
      setSelectedCameraId((current) => nextCameras.some((camera) => camera.id === current)
        ? current
        : nextCameras.some((camera) => camera.id === nextSimulation.cameraId)
          ? nextSimulation.cameraId
          : nextCameras[0]?.id);
      if (nextSimulation.eventId && nextSimulation.scoreChange?.crossedEscalationThreshold) {
        const recipientCount = notificationLogs.filter((log) => log.violationId === nextSimulation.eventId).length;
        setNotificationFeed(`Violation Event ${nextSimulation.eventId}: ${recipientCount} penerima simulasi dicatat.`);
      } else {
        setNotificationFeed(undefined);
      }
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Live Monitoring could not be loaded.");
    });

    return () => {
      active = false;
    };
  }, [persona, service]);

  const selectedCamera = cameras?.find((camera) => camera.id === selectedCameraId);
  const activeZoneIds = selectedCamera?.zoneIds.filter((zoneId) => zones?.some((zone) => zone.id === zoneId && zone.active)) ?? [];

  const selectScenario = async (scenario: MonitoringScenario) => {
    const nextSimulation = await service.selectMonitoringScenario(scenario);
    setSimulation(nextSimulation);
    if (cameras?.some((camera) => camera.id === nextSimulation.cameraId)) setSelectedCameraId(nextSimulation.cameraId);
  };

  const processFrame = async (isCompliant: boolean, confidence = 0.96) => {
    if (!settings || !simulation) return;
    const elapsedSeconds = simulation.episodeStatus === "candidate"
      ? settings.confirmThresholdSeconds
      : settings.clearThresholdSeconds;
    const nextSimulation = await service.processMonitoringFrame({ confidence, isCompliant, elapsedSeconds });
    setSimulation(nextSimulation);
    if (nextSimulation.eventId && nextSimulation.scoreChange?.crossedEscalationThreshold) {
      const recipientCount = (await service.getNotificationSimulationLogs()).filter((log) => log.violationId === nextSimulation.eventId).length;
      setNotificationFeed(`Violation Event ${nextSimulation.eventId}: ${recipientCount} penerima simulasi dicatat.`);
    }
  };

  if (error) {
    return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Live Monitoring</h1><div className="mt-6 border border-red-200 bg-red-50 p-6"><p className="font-medium text-red-900">Live Monitoring tidak dapat dimuat</p><p className="mt-1 text-sm text-red-800">{error}</p></div></section>;
  }

  if (cameras === undefined || zones === undefined || simulation === undefined || settings === undefined) {
    return <section aria-busy="true" aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Live Monitoring</h1><p className="mt-6 text-slate-600">Loading Camera Source…</p></section>;
  }

  if (!selectedCamera) {
    return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Live Monitoring</h1><div className="mt-6 border border-dashed border-slate-300 bg-white p-6"><p className="font-medium text-slate-900">No Camera Sources in your scope</p><p className="mt-1 text-sm text-slate-600">Select an assigned area with a Camera Source to start monitoring.</p></div></section>;
  }

  const displayedSimulation = simulation.cameraId === selectedCamera.id ? simulation : undefined;
  const isOffline = selectedCamera.status === "offline" || displayedSimulation?.state === "offline";
  const episode = displayedSimulation?.state === "episode" ? episodePresentation(displayedSimulation.episodeStatus) : undefined;
  const activeEpisode = displayedSimulation?.state === "episode" && ["candidate", "confirmed", "clearing"].includes(displayedSimulation.episodeStatus);

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Operational monitoring</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Live Monitoring</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Simulated monitoring of Hazardous Zones and Detected Persons without a real camera or RTSP connection.</p></div>
        <span className="inline-flex items-center gap-2 border border-amber-300 bg-amber-50 px-3 py-2 font-mono text-xs font-medium tracking-[0.12em] text-amber-950">SIMULASI</span>
      </div>

      <label className="mt-8 block max-w-md text-sm font-medium text-slate-800">Select Camera Source
        <select aria-label="Select Camera Source" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => setSelectedCameraId(event.target.value)} value={selectedCamera.id}>
          {cameras.map((camera) => <option key={camera.id} value={camera.id}>{camera.name} · {camera.location}</option>)}
        </select>
      </label>

      <section aria-label="Simulator Violation Episode" className="mt-5 border border-amber-200 bg-amber-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-950">Simulator Violation Episode</h2><p className="mt-1 text-sm text-slate-700">These controls use deterministic demo data only; they do not send alarms or store snapshots.</p></div><span className="font-mono text-xs font-medium tracking-[0.12em] text-amber-900">SIMULASI</span></div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => void selectScenario("normal")} size="sm" type="button" variant="outline">Skenario operasi normal</Button>
          <Button onClick={() => void selectScenario("missing-ppe")} size="sm" type="button" variant="outline">Skenario PPE hilang</Button>
          <Button onClick={() => void selectScenario("unidentified")} size="sm" type="button" variant="outline">Unidentified person scenario</Button>
          <Button onClick={() => void selectScenario("camera-offline")} size="sm" type="button" variant="outline">Camera offline scenario</Button>
          <Button onClick={() => void selectScenario("score-escalation")} size="sm" type="button" variant="outline">Skenario skor melewati ambang</Button>
        </div>
        {simulation.state === "episode" && <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => void processFrame(false)} size="sm" type="button">Proses kondisi melanggar</Button><Button onClick={() => void processFrame(true)} size="sm" type="button" variant="outline">Proses kondisi patuh</Button><Button onClick={() => void processFrame(false, 0.2)} size="sm" type="button" variant="outline">Frame confidence rendah</Button></div>}
      </section>
      {notificationFeed && <section aria-label="Simulation notification feed" className="mt-5 border-l-2 border-amber-500 bg-amber-50 p-4" role="status"><p className="font-mono text-xs font-medium tracking-[0.12em] text-amber-950">SIMULASI</p><p className="mt-2 text-sm font-medium text-slate-950">{notificationFeed}</p><p className="mt-1 text-sm text-slate-700">No real Telegram messages or audible alarms are sent.</p></section>}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <section aria-label={`Stage Live Monitoring ${selectedCamera.name}`} className="overflow-hidden border border-slate-800 bg-slate-950">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 px-4 py-3 text-sm text-slate-200"><span className="font-medium">{selectedCamera.name}</span><span className="font-mono text-xs text-slate-400">{selectedCamera.id}</span></div>
          <div className="relative aspect-video overflow-hidden bg-slate-900">
            <img alt={isOffline ? "Ilustrasi area industri fiktif - frame latest diredupkan" : "Ilustrasi area industri fiktif"} className={`h-full w-full object-cover ${isOffline ? "opacity-35 grayscale" : ""}`} src={industrialMonitoringScene} />
            <span className="absolute right-4 top-4 border border-amber-300 bg-slate-950/90 px-2 py-1 font-mono text-[10px] font-medium tracking-[0.12em] text-amber-200">SIMULASI</span>
            {isOffline ? (
              <div className="absolute inset-0 grid place-items-center bg-slate-950/30 p-6 text-center"><div className="border border-slate-400 bg-slate-950/90 px-5 py-4 text-slate-100"><p className="font-mono text-sm font-medium tracking-[0.14em]">CAMERA OFFLINE</p><p className="mt-2 text-sm text-slate-300">Latest update: {formatWib(selectedCamera.lastUpdatedAt)}</p></div></div>
            ) : (
              <>
                {displayedSimulation?.state === "episode" && displayedSimulation.episodeStatus === "cleared" ? null : activeEpisode && episode ? <div aria-label={`Orang Terdeteksi · ${episode.label}`} className={`absolute left-[23%] top-[25%] h-[43%] w-[18%] border-2 ${episode.borderClass}`}><span className={`absolute -top-12 left-0 whitespace-nowrap px-2 py-1 text-xs font-medium ${episode.labelClass}`}>{episode.label} · {displayedSimulation.identityLabel} · {Math.round(displayedSimulation.confidence * 100)}%</span></div> : <div className="absolute left-[23%] top-[25%] h-[43%] w-[18%] border-2 border-emerald-400" aria-label="Orang Terdeteksi"><span className="absolute -top-7 left-0 whitespace-nowrap bg-emerald-500 px-2 py-1 text-xs font-medium text-slate-950">PPE Compliance · Orang Terdeteksi · 96%</span></div>}
                <div className="absolute bottom-4 left-4 border border-slate-500 bg-slate-950/90 px-3 py-2 text-xs text-slate-100"><p>Latest update: {formatWib(selectedCamera.lastUpdatedAt)}</p></div>
              </>
            )}
          </div>
        </section>
        <aside className="border border-slate-200 bg-white p-5">
          <ConnectionStatus status={selectedCamera.status} />
          <dl className="mt-5 space-y-4 text-sm"><div><dt className="text-slate-500">Location</dt><dd className="mt-1 font-medium text-slate-950">{selectedCamera.location}</dd></div><div><dt className="text-slate-500">Active Hazardous Zones</dt><dd className="mt-2 flex flex-wrap gap-2">{activeZoneIds.length ? activeZoneIds.map((zoneId) => <span className="border border-slate-300 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-800" key={zoneId}>{zoneId}</span>) : <span className="text-slate-600">No Active Hazardous Zones.</span>}</dd></div><div><dt className="text-slate-500">Area Supervisor scope</dt><dd className="mt-1 text-slate-950">{selectedCamera.supervisorArea}</dd></div></dl>
          {isOffline && <p className="mt-5 border-l-2 border-amber-400 pl-3 text-sm leading-6 text-slate-600">Detection overlays stop when the camera is offline so stale frames are not treated as current.</p>}
          {displayedSimulation?.state === "episode" && displayedSimulation.episodeStatus !== "cleared" && episode && <section aria-label="Episode status" className="mt-5 border-t border-slate-200 pt-5"><p className="text-sm font-medium text-slate-950">{episode.label}</p><p className="mt-1 text-sm text-slate-600">Identity: {displayedSimulation.identityLabel}</p>{displayedSimulation.episodeStatus === "candidate" && <p className="mt-1 text-sm text-slate-600">Confirmation countdown: {Math.max(0, settings.confirmThresholdSeconds - displayedSimulation.confirmationElapsedSeconds)} seconds</p>}{displayedSimulation.episodeStatus === "clearing" && <p className="mt-1 text-sm text-slate-600">Clearing countdown: {Math.max(0, settings.clearThresholdSeconds - displayedSimulation.clearingElapsedSeconds)} seconds</p>}{displayedSimulation.missingCanonicalPpeClasses.length > 0 && <p className="mt-2 text-sm text-slate-600">Missing PPE: {displayedSimulation.missingCanonicalPpeClasses.join(", ")}</p>}{displayedSimulation.confidence < settings.minimumConfidence && <p className="mt-2 text-sm text-slate-600">Frame di bawah confidence minimum tidak mengubah Episode status.</p>}{displayedSimulation.eventId && <p className="mt-3 border-l-2 border-red-500 pl-3 text-sm font-medium text-slate-900">Violation Event {displayedSimulation.eventId}</p>}{displayedSimulation.scoreChange && <><p className="mt-2 font-mono text-xs text-slate-700">Safety Score: {displayedSimulation.scoreChange.before} → {displayedSimulation.scoreChange.after}</p>{displayedSimulation.scoreChange.crossedEscalationThreshold && <p className="mt-2 border-l-2 border-red-500 pl-3 text-sm font-medium text-red-800">Escalation Threshold crossed: {settings.escalationThreshold}</p>}</>}</section>}
          {displayedSimulation?.state === "episode" && displayedSimulation.episodeStatus === "cleared" && <section aria-label="Episode status" className="mt-5 border-t border-slate-200 pt-5"><p className="text-sm font-medium text-slate-950">Cleared</p><p className="mt-1 text-sm text-slate-600">The active overlay has stopped; the Violation Event remains recorded for audit history.</p><p className="mt-3 border-l-2 border-red-500 pl-3 text-sm font-medium text-slate-900">Violation Event {displayedSimulation.eventId}</p>{displayedSimulation.scoreChange && <p className="mt-2 font-mono text-xs text-slate-700">Safety Score: {displayedSimulation.scoreChange.before} → {displayedSimulation.scoreChange.after}</p>}</section>}
        </aside>
      </div>
    </section>
  );
}

type ViolationHistoryData = {
  cameras: Camera[];
  employees: Employee[];
  violations: ViolationRecord[];
  zones: HazardousZoneWithViolationHistory[];
};

const violationStatusLabels: Record<ViolationRecord["status"], string> = {
  confirmed: "Violation",
  clearing: "Clearing",
  cleared: "Cleared",
};

function ViolationDetails({
  violation,
  camera,
  employee,
  zone,
}: {
  violation: ViolationRecord;
  camera?: Camera;
  employee?: Employee;
  zone?: HazardousZoneWithViolationHistory;
}) {
  const identity = employee ? employeeName(employee) : "Unknown";

  return (
    <section aria-label={`Details ${violation.id}`} className="mt-6 border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Jejak audit</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Details Violation Event</h2><p className="mt-2 font-mono text-sm text-slate-600">{violation.id} · {violation.episodeId ?? "Violation Episode demo"}</p></div>
        <span className={`border px-3 py-1.5 text-sm font-medium ${violation.status === "confirmed" ? "border-red-200 bg-red-50 text-red-800" : violation.status === "clearing" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-300 bg-slate-50 text-slate-700"}`}>{violationStatusLabels[violation.status]}</span>
      </div>
      <p className="mt-5 border-l-2 border-amber-400 pl-3 text-sm leading-6 text-slate-700">Bukti audit memakai metadata, timeline, dan perubahan Safety Score.</p>
      <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2 xl:grid-cols-3">
        <div><dt className="text-slate-500">Identitas</dt><dd className="mt-1 font-medium text-slate-950">{identity}</dd></div>
        <div><dt className="text-slate-500">Hazardous Zones</dt><dd className="mt-1 text-slate-950">{zone?.name ?? violation.zoneId ?? "Tidak tersedia"}</dd></div>
        <div><dt className="text-slate-500">Camera Sources</dt><dd className="mt-1 text-slate-950">{camera ? `${camera.name} · ${camera.location}` : violation.cameraId ?? "Tidak tersedia"}</dd></div>
        <div><dt className="text-slate-500">PPE tidak terpenuhi</dt><dd className="mt-1 text-slate-950">{violation.missingCanonicalPpeClasses?.join(", ") || "Tidak tersedia"}</dd></div>
        <div><dt className="text-slate-500">Detection Confidence</dt><dd className="mt-1 font-mono text-slate-950">{violation.confidence === undefined ? "Tidak tersedia" : `${Math.round(violation.confidence * 100)}%`}</dd></div>
        <div><dt className="text-slate-500">Perubahan Safety Score</dt><dd className="mt-1 font-mono text-slate-950">{violation.scoreChange ? `${violation.scoreChange.before} → ${violation.scoreChange.after}` : "Tidak diterapkan untuk Unknown"}</dd></div>
        <div><dt className="text-slate-500">Terdeteksi</dt><dd className="mt-1 font-mono text-slate-950">{violation.detectedAt ? `${formatWib(violation.detectedAt)} · ${formatRelativeWib(violation.detectedAt)}` : "Tidak tersedia"}</dd></div>
        <div><dt className="text-slate-500">Latest audit</dt><dd className="mt-1 font-mono text-slate-950">{violation.updatedAt ? `${formatWib(violation.updatedAt)} · ${formatRelativeWib(violation.updatedAt)}` : "Tidak tersedia"}</dd></div>
      </dl>
      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <section><h3 className="font-semibold text-slate-950">Timeline Violation Episode</h3>{violation.timeline?.length ? <ol className="mt-4 space-y-4 border-l border-slate-200 pl-4">{violation.timeline.map((entry, index) => <li key={`${entry.occurredAt}-${index}`}><p className="text-sm font-medium text-slate-950">{episodePresentation(entry.status).label}</p><p className="mt-1 text-sm text-slate-600">{entry.description}</p><p className="mt-1 font-mono text-xs text-slate-500">{formatWib(entry.occurredAt)}</p></li>)}</ol> : <p className="mt-4 text-sm text-slate-600">Timeline Violation Episode belum tersedia.</p>}</section>
        <section><h3 className="font-semibold text-slate-950">Penerima notifikasi</h3>{violation.notificationRecipients?.length ? <ul className="mt-4 space-y-3">{violation.notificationRecipients.map((recipient) => <li className="border border-slate-200 p-3 text-sm" key={`${recipient.role}-${recipient.name}`}><p className="font-medium text-slate-950">{recipient.name}</p><p className="mt-1 text-slate-600">{recipient.role} · {recipient.deliveryStatus === "sent" ? "Sent" : recipient.deliveryStatus === "failed" ? "Failed" : "Menunggu"}</p></li>)}</ul> : <p className="mt-4 text-sm text-slate-600">No penerima simulasi.</p>}</section>
      </div>
    </section>
  );
}

function Violations({ service }: { service: ViolationHistoryCapability & CameraSourceCapability & HazardousZoneCapability & EmployeeDirectoryCapability }) {
  const [data, setData] = useState<ViolationHistoryData>();
  const [error, setError] = useState<string>();
  const [searchTerm, setSearchTerm] = useState("");
  const [zoneId, setZoneId] = useState("all");
  const [cameraId, setCameraId] = useState("all");
  const [employeeId, setEmployeeId] = useState("all");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState<ViolationRecord["status"] | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState<"oldest" | "newest" | "confidence-desc">("oldest");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string>();
  const pageSize = 3;

  useEffect(() => {
    let active = true;
    Promise.all([service.getViolationHistory(), service.getCameras(), service.getHazardousZone(), service.getEmployeeDirectory()]).then(([violations, cameras, zones, directory]) => {
      if (active) setData({ violations, cameras, zones, employees: directory.employees });
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Violation History tidak dapat dimuat.");
    });
    return () => { active = false; };
  }, [service]);

  if (error) return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Violation History</h1><div className="mt-6 border border-red-200 bg-red-50 p-6"><p className="font-medium text-red-900">Violation History tidak dapat dimuat</p><p className="mt-1 text-sm text-red-800">{error}</p></div></section>;
  if (!data) return <section aria-busy="true" aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Violation History</h1><p className="mt-6 text-slate-600">Loading riwayat Violation…</p></section>;

  const employeeFor = (violation: ViolationRecord) => data.employees.find((employee) => employee.id === violation.employeeId);
  const zoneFor = (violation: ViolationRecord) => data.zones.find((zone) => zone.id === violation.zoneId);
  const cameraFor = (violation: ViolationRecord) => data.cameras.find((camera) => camera.id === violation.cameraId);
  const query = searchTerm.trim().toLowerCase();
  const historyZones = data.zones.filter((zone) => data.violations.some((violation) => violation.zoneId === zone.id));
  const historyCameras = data.cameras.filter((camera) => data.violations.some((violation) => violation.cameraId === camera.id));
  const historyEmployees = data.employees.filter((employee) => data.violations.some((violation) => violation.employeeId === employee.id));
  const departments = [...new Set(historyEmployees.map((employee) => employee.departmentId))].sort((left, right) => left.localeCompare(right));
  const filtered = data.violations.filter((violation) => {
    const employee = employeeFor(violation);
    const camera = cameraFor(violation);
    const zone = zoneFor(violation);
    const searchable = [violation.id, violation.episodeId ?? "", employee ? employeeName(employee) : "Unknown", camera?.name ?? "", zone?.name ?? "", violation.missingCanonicalPpeClasses?.join(" ") ?? ""].join(" ").toLowerCase();
    const date = violation.detectedAt?.slice(0, 10) ?? "";
    return (!query || searchable.includes(query))
      && (zoneId === "all" || violation.zoneId === zoneId)
      && (cameraId === "all" || violation.cameraId === cameraId)
      && (employeeId === "all" || (employeeId === "unidentified" ? !violation.employeeId : violation.employeeId === employeeId))
      && (department === "all" || employee?.departmentId === department)
      && (status === "all" || violation.status === status)
      && (!startDate || date >= startDate)
      && (!endDate || date <= endDate);
  }).sort((left, right) => {
    if (sort === "confidence-desc") return (right.confidence ?? 0) - (left.confidence ?? 0);
    const comparison = (left.detectedAt ?? "").localeCompare(right.detectedAt ?? "");
    return sort === "newest" ? -comparison : comparison;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = data.violations.find((violation) => violation.id === selectedId);
  const updateFilters = (update: () => void) => { update(); setPage(1); setSelectedId(undefined); };
  const clearFilters = () => { setSearchTerm(""); setZoneId("all"); setCameraId("all"); setEmployeeId("all"); setDepartment("all"); setStatus("all"); setStartDate(""); setEndDate(""); setSort("oldest"); setPage(1); setSelectedId(undefined); };
  const hasFilters = query || zoneId !== "all" || cameraId !== "all" || employeeId !== "all" || department !== "all" || status !== "all" || startDate || endDate || sort !== "oldest";

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Audit operasional</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Violation History</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Telusuri Violation Event yang telah dikonfirmasi dari metadata dan timeline audit.</p></div><span className="border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">{data.violations.length} Violation Event</span></div>
      <div className="mt-8 grid gap-3 border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="block text-sm font-medium text-slate-800">Search riwayat<input aria-label="Search riwayat Violation" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => updateFilters(() => setSearchTerm(event.target.value))} placeholder="ID, Employee, PPE, zona" value={searchTerm} /></label>
        <label className="block text-sm font-medium text-slate-800">Filter Hazardous Zones<select aria-label="Filter Hazardous Zone" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => updateFilters(() => setZoneId(event.target.value))} value={zoneId}><option value="all">All Hazardous Zones</option>{historyZones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label>
        <label className="block text-sm font-medium text-slate-800">Filter Camera Sources<select aria-label="Filter Camera Source" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => updateFilters(() => setCameraId(event.target.value))} value={cameraId}><option value="all">All Camera Sources</option>{historyCameras.map((camera) => <option key={camera.id} value={camera.id}>{camera.name}</option>)}</select></label>
        <label className="block text-sm font-medium text-slate-800">Filter Employee<select aria-label="Filter Employee Violation" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => updateFilters(() => setEmployeeId(event.target.value))} value={employeeId}><option value="all">All Employee</option><option value="unidentified">Unknown</option>{historyEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employeeName(employee)}</option>)}</select></label>
        <label className="block text-sm font-medium text-slate-800">Filter department<select aria-label="Filter department Violation" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => updateFilters(() => setDepartment(event.target.value))} value={department}><option value="all">All department</option>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="block text-sm font-medium text-slate-800">Filter Episode status<select aria-label="Filter Episode status" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => updateFilters(() => setStatus(event.target.value as ViolationRecord["status"] | "all"))} value={status}><option value="all">All Episode status</option><option value="confirmed">Violation</option><option value="clearing">Clearing</option><option value="cleared">Cleared</option></select></label>
        <label className="block text-sm font-medium text-slate-800">Dari tanggal<input aria-label="Dari tanggal Violation" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => updateFilters(() => setStartDate(event.target.value))} type="date" value={startDate} /></label>
        <label className="block text-sm font-medium text-slate-800">Sampai tanggal<input aria-label="Sampai tanggal Violation" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => updateFilters(() => setEndDate(event.target.value))} type="date" value={endDate} /></label>
        <label className="block text-sm font-medium text-slate-800">Sort riwayat<select aria-label="Sort riwayat Violation" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => updateFilters(() => setSort(event.target.value as "oldest" | "newest" | "confidence-desc"))} value={sort}><option value="oldest">Oldest</option><option value="newest">Newest</option><option value="confidence-desc">Detection Confidence tertinggi</option></select></label>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600"><p>{filtered.length === 0 ? "No Violation Event yang cocok." : `Menampilkan ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} dari ${filtered.length} Violation Event`}</p>{hasFilters && <Button onClick={clearFilters} size="sm" variant="outline">Bersihkan filter riwayat</Button>}</div>
      {data.violations.length === 0 ? <div className="mt-4 border border-dashed border-slate-300 bg-white p-6"><p className="font-medium text-slate-900">No Violation Event</p><p className="mt-1 text-sm text-slate-600">Violation Episode yang belum mencapai Violation tidak ditampilkan di riwayat.</p></div> : filtered.length === 0 ? <div className="mt-4 border border-dashed border-slate-300 bg-white p-6"><p className="font-medium text-slate-900">No hasil yang cocok.</p><Button className="mt-4" onClick={clearFilters} variant="outline">Bersihkan filter riwayat</Button></div> : <div aria-label="Daftar riwayat Violation" className="mt-4 space-y-3" role="list">{visible.map((violation) => { const employee = employeeFor(violation); const zone = zoneFor(violation); const camera = cameraFor(violation); return <article className="border border-slate-200 bg-white p-4" key={violation.id} role="listitem"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-xs text-slate-500">{violation.id} · {violation.episodeId ?? "Violation Episode demo"}</p><h2 className="mt-1 font-semibold text-slate-950">{employee ? employeeName(employee) : "Unknown"}</h2><p className="mt-1 text-sm text-slate-600">{zone?.name ?? violation.zoneId ?? "Zona tidak tersedia"} · {camera?.name ?? violation.cameraId ?? "Camera Source tidak tersedia"}</p></div><span className={`border px-2 py-1 text-xs font-medium ${violation.status === "confirmed" ? "border-red-200 bg-red-50 text-red-800" : violation.status === "clearing" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-300 bg-slate-50 text-slate-700"}`}>{violationStatusLabels[violation.status]}</span></div><div className="mt-4 flex flex-wrap items-end justify-between gap-3"><p className="font-mono text-xs text-slate-600">{violation.detectedAt ? formatWib(violation.detectedAt) : "Time tidak tersedia"}</p><Button aria-label={`View details ${violation.id}`} onClick={() => setSelectedId(violation.id)} size="sm" variant="outline">View details {violation.id}</Button></div></article>; })}</div>}
      {filtered.length > pageSize && <nav aria-label="Pagination riwayat Violation" className="mt-5 flex items-center justify-between"><Button disabled={currentPage === 1} onClick={() => { setPage((current) => Math.max(1, current - 1)); setSelectedId(undefined); }} size="sm" variant="outline"><ChevronLeft aria-hidden="true" className="mr-1 size-4" />Page sebelumnya</Button><span className="font-mono text-xs text-slate-500">Page {currentPage} dari {totalPages}</span><Button disabled={currentPage === totalPages} onClick={() => { setPage((current) => Math.min(totalPages, current + 1)); setSelectedId(undefined); }} size="sm" variant="outline">Page berikutnya<ChevronRight aria-hidden="true" className="ml-1 size-4" /></Button></nav>}
      {selected && <ViolationDetails camera={cameraFor(selected)} employee={employeeFor(selected)} violation={selected} zone={zoneFor(selected)} />}
    </section>
  );
}

function episodePresentation(status: EpisodeStatus) {
  switch (status) {
    case "candidate":
      return { label: "Pending Confirmation", borderClass: "border-amber-400 border-dashed", labelClass: "bg-amber-400 text-slate-950" };
    case "confirmed":
      return { label: "Violation", borderClass: "border-red-500", labelClass: "bg-red-500 text-white" };
    case "clearing":
      return { label: "Clearing", borderClass: "border-amber-400", labelClass: "bg-amber-400 text-slate-950" };
    case "cleared":
      return { label: "Cleared", borderClass: "border-slate-400", labelClass: "bg-slate-700 text-white" };
  }
}

type ScoreStatus = "safe" | "warning" | "critical";

const scoreStatusDetailss: Record<ScoreStatus, {
  label: string;
  Icon: typeof ShieldCheck;
  className: string;
}> = {
  safe: { label: "Safe", Icon: ShieldCheck, className: "text-emerald-700" },
  warning: { label: "Warning", Icon: ShieldAlert, className: "text-amber-700" },
  critical: { label: "Critical", Icon: ShieldX, className: "text-red-700" },
};

function getScoreStatus(score: number, escalationThreshold: number): ScoreStatus {
  if (score < escalationThreshold) return "critical";
  if (score < 80) return "warning";
  return "safe";
}

function employeeName(employee: Employee) {
  return employee.name ?? `Employee ${employee.id}`;
}

function EmployeeScoreStatus({ score, escalationThreshold }: { score: number; escalationThreshold: number }) {
  const status = getScoreStatus(score, escalationThreshold);
  const { Icon, label, className } = scoreStatusDetailss[status];

  return (
    <span aria-label={`Score status: ${label}`} className={`inline-flex items-center gap-1.5 text-sm font-medium ${className}`}>
      <Icon aria-label={`Score status icon ${label}`} className="size-4" role="img" />
      {label}
    </span>
  );
}

const enrollmentLabels: Record<NonNullable<Employee["enrollmentStatus"]>, string> = {
  enrolled: "Enrolled",
  pending: "Menunggu integrasi",
  "not-enrolled": "Belum terdaftar",
};

function EmployeeDetails({
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
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Operational profile</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950" id="employee-detail-title">Employee Details</h2>
          <p className="mt-1 text-sm text-slate-600">{employeeName(employee)} · {employee.id}</p>
        </div>
        <EmployeeScoreStatus score={employee.safetyScore} escalationThreshold={escalationThreshold} />
      </div>
      <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div><dt className="text-slate-500">Department</dt><dd className="mt-1 font-medium text-slate-950">{employee.departmentId}</dd></div>
        <div><dt className="text-slate-500">Area Supervisor</dt><dd className="mt-1 font-medium text-slate-950">{employee.supervisorArea ?? employee.departmentId}</dd></div>
        <div><dt className="text-slate-500">Safety Score</dt><dd className="mt-1 font-mono font-medium text-slate-950">{employee.safetyScore}</dd></div>
        <div><dt className="text-slate-500">Escalation Threshold</dt><dd className="mt-1 font-mono font-medium text-slate-950">{escalationThreshold}</dd></div>
        <div><dt className="text-slate-500">Enrollment status</dt><dd className="mt-1 font-medium text-slate-950">{enrollmentLabels[enrollmentStatus]}</dd></div>
        <div><dt className="text-slate-500">Latest audit</dt><dd className="mt-1 font-mono text-slate-950">{employee.lastAuditAt ? formatWib(employee.lastAuditAt) : "No audit"}</dd></div>
      </dl>
      <div className="mt-6 border-t border-slate-100 pt-5">
        <h3 className="font-medium text-slate-950">Audit summary</h3>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">Violation Episode</dt><dd className="mt-1 font-mono text-slate-950">{auditSummary.violationCount}</dd></div>
          <div><dt className="text-slate-500">Score Reset</dt><dd className="mt-1 font-mono text-slate-950">{auditSummary.resetCount}</dd></div>
        </dl>
      </div>
      <div className="mt-6 border-l-2 border-amber-400 pl-3 text-sm leading-6 text-slate-600">
        <p>Enrollment requires backend integration and is not performed in the browser demo.</p>
        <Button className="mt-3" onClick={() => setNotice("Enrollment requires backend integration.")} variant="outline">
          Enrollment unavailable
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
        <div><dt className="text-slate-500">Department</dt><dd className="mt-0.5 text-slate-900">{employee.departmentId}</dd></div>
        <div><dt className="text-slate-500">Safety Score</dt><dd className="mt-0.5 font-mono text-slate-900">{employee.safetyScore}</dd></div>
        <div><dt className="text-slate-500">Enrollment</dt><dd className="mt-0.5 text-slate-900">{enrollmentLabels[employee.enrollmentStatus ?? "not-enrolled"]}</dd></div>
      </dl>
      <Button className="mt-5" onClick={onSelect} variant="outline">View details {name}</Button>
    </article>
  );
}

type EmployeeSort = "name-asc" | "name-desc" | "score-desc" | "score-asc";

function Employees({ persona, service }: { persona: Persona; service: EmployeeDirectoryCapability }) {
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
      if (active) setError(reason instanceof Error ? reason.message : "The Employees directory could not be loaded.");
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
    return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Employees</h1><div className="mt-6 border border-red-200 bg-red-50 p-6"><p className="font-medium text-red-900">The Employees directory could not be loaded</p><p className="mt-1 text-sm text-red-800">{error}</p></div></section>;
  }
  if (directory === undefined) {
    return <section aria-busy="true" aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Employees</h1><p className="mt-6 text-slate-600">Loading Employees directory…</p></section>;
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Operational directory</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Employees</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Find Employees, their Safety Score position, and audit context without biometric capture.</p></div>
        <span className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"><UserRound aria-hidden="true" className="size-4" />{employees.length} Employee</span>
      </div>
      <div className="mt-8 grid gap-3 border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_12rem_12rem_13rem]">
        <label className="block text-sm font-medium text-slate-800">Search Employee<div className="relative mt-1"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" /><input aria-label="Search Employee" className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }} placeholder="Name, ID, department, atau area" value={searchTerm} /></div></label>
        <label className="block text-sm font-medium text-slate-800">Filter department<select aria-label="Filter department" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => { setDepartmentFilter(event.target.value); setPage(1); }} value={departmentFilter}><option value="all">All department</option>{departments.map((department) => <option key={department} value={department}>{department}</option>)}</select></label>
        <label className="block text-sm font-medium text-slate-800">Filter status skor<select aria-label="Filter status skor" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => { setScoreFilter(event.target.value as ScoreStatus | "all"); setPage(1); }} value={scoreFilter}><option value="all">All status</option><option value="safe">Safe</option><option value="warning">Warning</option><option value="critical">Critical</option></select></label>
        <label className="block text-sm font-medium text-slate-800"><span className="inline-flex items-center gap-1">Sort Employee <ArrowDownUp aria-hidden="true" className="size-3.5" /></span><select aria-label="Sort Employee" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => { setSort(event.target.value as EmployeeSort); setPage(1); }} value={sort}><option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option><option value="score-desc">Skor tertinggi</option><option value="score-asc">Skor terendah</option></select></label>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600"><p>{filteredEmployees.length === 0 ? "Menampilkan 0 Employee" : `Menampilkan ${pageStart + 1}–${Math.min(pageStart + pageSize, filteredEmployees.length)} dari ${filteredEmployees.length} Employee`}</p>{filteredEmployees.length > 0 && (query || departmentFilter !== "all" || scoreFilter !== "all" || sort !== "name-asc") && <Button onClick={clearFilters} size="sm" variant="outline">Bersihkan filter Employee</Button>}</div>
      {employees.length === 0 ? <div className="mt-4 border border-dashed border-slate-300 bg-white p-6"><p className="font-medium text-slate-900">No Employee</p><p className="mt-1 text-sm text-slate-600">Addkan data Employee melalui integrasi backend.</p><Button className="mt-4" onClick={clearFilters} variant="outline">Bersihkan filter Employee</Button></div> : filteredEmployees.length === 0 ? <div className="mt-4 border border-dashed border-slate-300 bg-white p-6"><p className="font-medium text-slate-900">No Employee yang cocok.</p><p className="mt-1 text-sm text-slate-600">Bersihkan filter untuk melihat seluruh direktori.</p><Button className="mt-4" onClick={clearFilters} variant="outline">Bersihkan filter Employee</Button></div> : <div aria-label="Daftar Employee" className="mt-4 grid gap-4 xl:grid-cols-2" role="list">{visibleEmployees.map((employee) => <EmployeeCard employee={employee} escalationThreshold={directory.escalationThreshold} key={employee.id} onSelect={() => setSelectedEmployeeId(employee.id)} />)}</div>}
      {filteredEmployees.length > pageSize && <nav aria-label="Pagination Employee" className="mt-5 flex items-center justify-between"><Button disabled={currentPage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} size="sm" variant="outline"><ChevronLeft aria-hidden="true" className="mr-1 size-4" />Page sebelumnya</Button><span className="font-mono text-xs text-slate-500">Page {currentPage} dari {totalPages}</span><Button disabled={currentPage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} size="sm" variant="outline">Page berikutnya<ChevronRight aria-hidden="true" className="ml-1 size-4" /></Button></nav>}
      {selectedEmployee && <div className="mt-6"><EmployeeDetails employee={selectedEmployee} escalationThreshold={directory.escalationThreshold} /></div>}
    </section>
  );
}

function SafetyScoreReset({ service }: { service: EmployeeDirectoryCapability & SafetyScoreCapability & SafetySettingsCapability }) {
  const [directory, setDirectory] = useState<EmployeeDirectoryData>();
  const [settings, setSettings] = useState<SafetySettings>();
  const [employeeId, setEmployeeId] = useState("");
  const [reason, setReason] = useState<SafetyScoreResetReason | "">("");
  const [note, setNote] = useState("");
  const [step, setStep] = useState<"form" | "review" | "confirm">("form");
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<SafetyScoreResetResult>();
  const [audit, setAudit] = useState<SafetyScoreAudit>();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    Promise.all([service.getEmployeeDirectory(), service.getSafetySettings()]).then(([nextDirectory, nextSettings]) => {
      if (!isCurrent) return;
      setDirectory(nextDirectory);
      setSettings(nextSettings);
    }).catch((loadError: unknown) => {
      if (isCurrent) setError(loadError instanceof Error ? loadError.message : "Data Score Reset tidak dapat dimuat.");
    });
    return () => { isCurrent = false; };
  }, [service]);

  const employee = directory?.employees.find((item) => item.id === employeeId);

  useEffect(() => {
    let isCurrent = true;
    if (!employeeId) return undefined;
    service.getSafetyScoreAudit(employeeId).then((nextAudit) => {
      if (isCurrent) setAudit(nextAudit);
    }).catch((loadError: unknown) => {
      if (isCurrent) setError(loadError instanceof Error ? loadError.message : "History Score Reset tidak dapat dimuat.");
    });
    return () => { isCurrent = false; };
  }, [employeeId, service]);

  const reviewReset = () => {
    setError(undefined);
    if (!employee) return setError("Select Employee yang akan direset.");
    if (!reason) return setError("Select reason Score Reset.");
    if (reason === "Other" && !note.trim()) return setError("A note is required for the Other reason.");
    setStep("review");
  };

  const confirmReset = async () => {
    if (!employee || !reason) return;
    setIsSaving(true);
    setError(undefined);
    try {
      const nextResult = await service.resetSafetyScore({
        employeeId: employee.id,
        reason,
        ...(note.trim() ? { note } : {}),
        actor: "Admin/Safety Officer",
      });
      const nextAudit = await service.getSafetyScoreAudit(employee.id);
      setResult(nextResult);
      setAudit(nextAudit);
      setDirectory((current) => current ? {
        ...current,
        employees: current.employees.map((item) => item.id === nextResult.employee.id ? nextResult.employee : item),
      } : current);
      setReason("");
      setNote("");
      setStep("form");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Score Reset tidak dapat disimpan.");
      setStep("form");
    } finally {
      setIsSaving(false);
    }
  };

  if (error && !directory) return <PageState title="Score Reset" />;
  if (!directory || !settings) return <PageState title="Loading Score Reset…" />;

  return (
    <section>
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Administrasi keselamatan</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Score Reset</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Tutup Period Skor dan pulihkan Safety Score Employee ke nilai awal melalui alur yang dapat diaudit.</p>
      </div>

      <div className="mt-8 max-w-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <label className="block text-sm font-medium text-slate-800">
          Employee yang direset
          <select aria-label="Employee yang direset" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => { setEmployeeId(event.target.value); setAudit(undefined); setResult(undefined); }} value={employeeId}>
            <option value="">Select Employee</option>
            {directory.employees.map((item) => <option key={item.id} value={item.id}>{employeeName(item)} · {item.id}</option>)}
          </select>
        </label>
        <label className="mt-5 block text-sm font-medium text-slate-800">
          Reason Score Reset
          <select aria-label="Reason Score Reset" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => setReason(event.target.value as SafetyScoreResetReason | "")} value={reason}>
            <option value="">Select reason</option>
            {safetyScoreResetReasons.map((item) => <option key={item} value={item}>{safetyScoreResetReasonLabels[item]}</option>)}
          </select>
        </label>
        {reason === "Other" && <label className="mt-5 block text-sm font-medium text-slate-800">Note reason<input aria-label="Note reason" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => setNote(event.target.value)} value={note} /></label>}
        <p className="mt-5 border-l-2 border-amber-400 pl-3 text-sm leading-6 text-slate-600">Skor setelah Score Reset akan mengikuti nilai awal saat ini: <strong>{settings.initialScore}</strong>.</p>
        {error && <p aria-live="assertive" className="mt-5 border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
        {result && <p aria-live="polite" className="mt-5 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">Score Reset berhasil disimpan.</p>}
        <div className="mt-6 flex flex-wrap gap-3"><Button onClick={reviewReset}>Tinjau Score Reset</Button></div>
      </div>

      {employee && audit && <section aria-label="History Score Reset" className="mt-6 grid max-w-5xl gap-4 lg:grid-cols-3">
        <article className="border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-950">Ringkasan Period Skor</h2>{audit.periods.length === 0 ? <p className="mt-4 text-sm text-slate-600">No Period Skor yang ditutup.</p> : <div className="mt-4 space-y-4 text-sm">{audit.periods.map((period) => <dl className="border-t border-slate-100 pt-4 first:border-0 first:pt-0" key={period.id}><div><dt className="text-slate-500">Period ditutup</dt><dd className="mt-1 font-mono text-slate-950">{formatWib(period.startedAt)} – {formatWib(period.closedAt)}</dd></div><div className="mt-2"><dt className="text-slate-500">Skor akhir sebelum reset</dt><dd className="mt-1 font-mono text-slate-950">{period.finalScoreBeforeReset}</dd></div><div className="mt-2"><dt className="text-slate-500">Total Violation</dt><dd className="mt-1 text-slate-950">{period.totalViolations}</dd></div></dl>)}</div>}</article>
        <article className="border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-950">Ledger Safety Score</h2>{audit.ledger.length === 0 ? <p className="mt-4 text-sm text-slate-600">No perubahan skor dari Score Reset.</p> : <div className="mt-4 space-y-4 text-sm">{audit.ledger.map((entry) => <dl className="border-t border-slate-100 pt-4 first:border-0 first:pt-0" key={entry.id}><div><dt className="text-slate-500">Perubahan skor</dt><dd className="mt-1 font-mono text-slate-950">{entry.scoreBefore} → {entry.scoreAfter}</dd></div><div className="mt-2"><dt className="text-slate-500">Dicatat</dt><dd className="mt-1 font-mono text-slate-950">{formatWib(entry.recordedAt)}</dd></div></dl>)}</div>}</article>
        <article className="border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-950">Log Score Reset</h2>{audit.resetLogs.length === 0 ? <p className="mt-4 text-sm text-slate-600">No log Score Reset.</p> : <div className="mt-4 space-y-4 text-sm">{audit.resetLogs.map((log) => <dl className="border-t border-slate-100 pt-4 first:border-0 first:pt-0" key={log.id}><div><dt className="text-slate-500">Pemicu</dt><dd className="mt-1 text-slate-950">{log.trigger}</dd></div><div className="mt-2"><dt className="text-slate-500">Reason</dt><dd className="mt-1 text-slate-950">{safetyScoreResetReasonLabels[log.reason]}</dd></div>{log.note && <div className="mt-2"><dt className="text-slate-500">Note</dt><dd className="mt-1 text-slate-950">{log.note}</dd></div>}<div className="mt-2"><dt className="text-slate-500">Pelaku</dt><dd className="mt-1 text-slate-950">{log.actor}</dd></div><div className="mt-2"><dt className="text-slate-500">Time</dt><dd className="mt-1 font-mono text-slate-950">{formatWib(log.occurredAt)}</dd></div></dl>)}</div>}</article>
      </section>}

      {step === "review" && employee && reason && <AccessibleDialog label="Tinjau Score Reset" onDismiss={() => setStep("form")}><div className="w-full max-w-xl bg-white p-6 shadow-xl"><p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Tinjau perubahan</p><h2 className="mt-2 text-xl font-semibold text-slate-950">Tinjau Score Reset</h2><dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Employee</dt><dd className="mt-1 font-medium text-slate-950">{employeeName(employee)}</dd></div><div><dt className="text-slate-500">Period Skor yang ditutup</dt><dd className="mt-1 font-mono text-slate-950">{employee.safetyScorePeriodStartedAt ? formatWib(employee.safetyScorePeriodStartedAt) : "Period demo berjalan"} – sekarang</dd></div><div><dt className="text-slate-500">Skor sebelum</dt><dd className="mt-1 font-mono text-slate-950">{employee.safetyScore}</dd></div><div><dt className="text-slate-500">Skor sesudah</dt><dd className="mt-1 font-mono text-slate-950">{settings.initialScore}</dd></div><div><dt className="text-slate-500">Reason</dt><dd className="mt-1 text-slate-950">{safetyScoreResetReasonLabels[reason]}</dd></div>{note.trim() && <div><dt className="text-slate-500">Note</dt><dd className="mt-1 text-slate-950">{note}</dd></div>}</dl><div className="mt-6 flex justify-end gap-3"><Button data-dialog-initial-focus onClick={() => setStep("form")} variant="outline">Back</Button><Button onClick={() => setStep("confirm")}>Lanjut ke konfirmasi</Button></div></div></AccessibleDialog>}
      {step === "confirm" && employee && <AccessibleDialog label="Konfirmasi Score Reset" onDismiss={() => setStep("form")}><div className="w-full max-w-md bg-white p-6 shadow-xl"><p className="font-mono text-xs uppercase tracking-[0.16em] text-red-700">Konfirmasi final</p><h2 className="mt-2 text-xl font-semibold text-slate-950">Konfirmasi Score Reset</h2><p className="mt-3 text-sm leading-6 text-slate-600">Tindakan ini menutup Period Skor {employeeName(employee)}, memperbarui ledger, dan menyimpan log audit.</p><div className="mt-6 flex justify-end gap-3"><Button data-dialog-initial-focus disabled={isSaving} onClick={() => setStep("form")} variant="outline">Cancel</Button><Button disabled={isSaving} onClick={() => void confirmReset()}>Konfirmasi Score Reset</Button></div></div></AccessibleDialog>}
    </section>
  );
}

function copySafetySettings(settings: SafetySettings): SafetySettings {
  return {
    ...settings,
    deductions: settings.deductions.map((deduction) => ({ ...deduction })),
  };
}

function parseParametersNumber(value: string) {
  return value === "" ? Number.NaN : Number(value);
}

function validateSafetySettings(settings: SafetySettings): string | undefined {
  if (!Number.isFinite(settings.initialScore) || settings.initialScore < 0 || settings.initialScore > 100) {
    return "Skor awal harus antara 0 dan 100.";
  }
  if (!Number.isFinite(settings.escalationThreshold) || settings.escalationThreshold < 0 || settings.escalationThreshold > 100) {
    return "Escalation Threshold harus antara 0 dan 100.";
  }
  if (settings.escalationThreshold >= settings.initialScore) {
    return "Escalation Threshold harus lebih rendah dari Skor awal.";
  }
  for (const deduction of settings.deductions) {
    if (!Number.isFinite(deduction.points) || deduction.points < 1 || deduction.points > 100) {
      return `Pengurangan ${deduction.canonicalPpeClass} harus antara 1 dan 100 poin.`;
    }
  }
  if (!Number.isFinite(settings.confirmThresholdSeconds) || settings.confirmThresholdSeconds < 1 || settings.confirmThresholdSeconds > 60) {
    return "Ambang konfirmasi harus antara 1 dan 60 seconds.";
  }
  if (!Number.isFinite(settings.clearThresholdSeconds) || settings.clearThresholdSeconds < 1 || settings.clearThresholdSeconds > 60) {
    return "Ambang pemulihan harus antara 1 dan 60 seconds.";
  }
  if (settings.clearThresholdSeconds >= settings.confirmThresholdSeconds) {
    return "Ambang pemulihan harus lebih rendah dari Ambang konfirmasi.";
  }
  if (!Number.isFinite(settings.minimumConfidence) || settings.minimumConfidence < 0 || settings.minimumConfidence > 1) {
    return "Confidence minimum harus antara 0 dan 1.";
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(settings.resetTime)) {
    return "Jadwal Score Reset harus menggunakan time HH:MM yang valid.";
  }
  if (!Number.isFinite(settings.recapLeadMinutes) || settings.recapLeadMinutes < 0 || settings.recapLeadMinutes > 1440) {
    return "Lead time recap harus antara 0 dan 1440 menit.";
  }
  return undefined;
}

function SafetyParameters({ service }: { service: SafetySettingsCapability }) {
  const [settings, setSettings] = useState<SafetySettings>();
  const [draft, setDraft] = useState<SafetySettings>();
  const [loadError, setLoadError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [feedback, setFeedback] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    service.getSafetySettings().then((nextSettings) => {
      if (!active) return;
      setSettings(nextSettings);
      setDraft(copySafetySettings(nextSettings));
    }).catch((reason: unknown) => {
      if (active) setLoadError(reason instanceof Error ? reason.message : "Parameters keselamatan tidak dapat dimuat.");
    });
    return () => {
      active = false;
    };
  }, [service]);

  const updateNumber = (field: keyof Omit<SafetySettings, "deductions" | "resetTime" | "timeZone">, value: string) => {
    setDraft((current) => current ? { ...current, [field]: parseParametersNumber(value) } : current);
    setFormError(undefined);
    setFeedback(undefined);
  };

  const updateDeduction = (canonicalPpeClass: string, value: string) => {
    setDraft((current) => current ? {
      ...current,
      deductions: current.deductions.map((deduction) => deduction.canonicalPpeClass === canonicalPpeClass
        ? { ...deduction, points: parseParametersNumber(value) }
        : deduction),
    } : current);
    setFormError(undefined);
    setFeedback(undefined);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft) return;
    const validationError = validateSafetySettings(draft);
    if (validationError) {
      setFormError(validationError);
      setFeedback(undefined);
      return;
    }

    setSaving(true);
    setFormError(undefined);
    setFeedback(undefined);
    try {
      const saved = await service.updateSafetySettings(draft);
      setSettings(saved);
      setDraft(copySafetySettings(saved));
      setFeedback("Parameters keselamatan berhasil disimpan.");
    } catch (reason: unknown) {
      setFormError(reason instanceof Error ? reason.message : "Parameters keselamatan tidak dapat disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    if (!settings) return;
    setDraft(copySafetySettings(settings));
    setFormError(undefined);
    setFeedback("Perubahan parameter dibatalkan.");
  };

  if (loadError) {
    return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Safety Parameters</h1><div className="mt-6 border border-red-200 bg-red-50 p-6"><p className="font-medium text-red-900">Parameters keselamatan tidak dapat dimuat</p><p className="mt-1 text-sm text-red-800">{loadError}</p></div></section>;
  }

  if (!draft) {
    return <section aria-busy="true" aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Safety Parameters</h1><p className="mt-6 text-slate-600">Loading parameter keselamatan…</p></section>;
  }

  return (
    <section aria-labelledby="safety-parameters-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Administration · konfigurasi kebijakan</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950" id="safety-parameters-title">Safety Parameters</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Atur kebijakan Safety Score, stabilisasi Violation Episode, confidence deteksi, dan jadwal Score Reset untuk lingkungan demo.</p>
        </div>
        <span className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"><Clock3 aria-hidden="true" className="size-4 text-amber-700" />Time kebijakan: <span className="font-mono">Asia/Jakarta (WIB)</span></span>
      </div>

      <form className="mt-8 space-y-6" noValidate onSubmit={(event) => void submit(event)}>
        <fieldset className="border border-slate-200 bg-white p-5 sm:p-6">
          <legend className="sr-only">Safety Score</legend>
          <h2 className="text-base font-semibold leading-6 text-slate-950 sm:text-lg">Safety Score</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Nilai dalam poin. Escalation Threshold harus lebih rendah dari Skor awal.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-800">Skor awal <span className="font-normal text-slate-500">(0–100 poin)</span><input aria-describedby="initial-score-help" aria-label="Skor awal" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" max="100" min="0" onChange={(event) => updateNumber("initialScore", event.target.value)} step="1" type="number" value={draft.initialScore} /><span className="mt-1 block text-xs font-normal text-slate-500" id="initial-score-help">Nilai awal setiap Period Skor setelah Score Reset.</span></label>
            <label className="block text-sm font-medium text-slate-800">Escalation Threshold <span className="font-normal text-slate-500">(0–100 poin)</span><input aria-describedby="escalation-help" aria-label="Escalation Threshold" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" max="100" min="0" onChange={(event) => updateNumber("escalationThreshold", event.target.value)} step="1" type="number" value={draft.escalationThreshold} /><span className="mt-1 block text-xs font-normal text-slate-500" id="escalation-help">Di bawah nilai ini, penerima eskalasi perlu diberi tahu.</span></label>
          </div>
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="text-sm font-semibold text-slate-900">Pengurangan per Canonical PPE Classes</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">Pengurangan diterapkan ketika Violation Episode menjadi Violation. Nilai 1–100 poin.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {draft.deductions.map((deduction) => <label className="block text-sm font-medium text-slate-800" key={deduction.canonicalPpeClass}><span>Pengurangan {deduction.canonicalPpeClass}</span><div className="relative mt-1"><input aria-label={`Pengurangan ${deduction.canonicalPpeClass}`} className="block h-10 w-full rounded-md border border-slate-300 bg-white px-3 pr-16 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" max="100" min="1" onChange={(event) => updateDeduction(deduction.canonicalPpeClass, event.target.value)} step="1" type="number" value={deduction.points} /><span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">poin</span></div></label>)}
            </div>
          </div>
        </fieldset>

        <fieldset className="border border-slate-200 bg-white p-5 sm:p-6">
          <legend className="sr-only">Stabilisasi Episode dan deteksi</legend>
          <h2 className="text-base font-semibold leading-6 text-slate-950 sm:text-lg">Stabilisasi Episode dan deteksi</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Parameters menentukan kapan sinyal menjadi Violation dan kapan episode selesai.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-sm font-medium text-slate-800">Ambang konfirmasi <span className="font-normal text-slate-500">(1–60 seconds)</span><input aria-describedby="confirm-help" aria-label="Ambang konfirmasi" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" max="60" min="1" onChange={(event) => updateNumber("confirmThresholdSeconds", event.target.value)} step="1" type="number" value={draft.confirmThresholdSeconds} /><span className="mt-1 block text-xs font-normal text-slate-500" id="confirm-help">Durasi minimum status Pending Confirmation.</span></label>
            <label className="block text-sm font-medium text-slate-800">Ambang pemulihan <span className="font-normal text-slate-500">(1–60 seconds)</span><input aria-describedby="clear-help" aria-label="Ambang pemulihan" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" max="60" min="1" onChange={(event) => updateNumber("clearThresholdSeconds", event.target.value)} step="1" type="number" value={draft.clearThresholdSeconds} /><span className="mt-1 block text-xs font-normal text-slate-500" id="clear-help">Durasi patuh sebelum status Clearing menjadi Cleared.</span></label>
            <label className="block text-sm font-medium text-slate-800">Confidence minimum <span className="font-normal text-slate-500">(0–1)</span><input aria-describedby="confidence-help" aria-label="Confidence minimum" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" max="1" min="0" onChange={(event) => updateNumber("minimumConfidence", event.target.value)} step="0.01" type="number" value={draft.minimumConfidence} /><span className="mt-1 block text-xs font-normal text-slate-500" id="confidence-help">Contoh 0,5. Frame di bawah nilai ini tidak mengubah transisi episode.</span></label>
          </div>
        </fieldset>

        <fieldset className="border border-slate-200 bg-white p-5 sm:p-6">
          <legend className="sr-only">Jadwal Score Reset</legend>
          <h2 className="text-base font-semibold leading-6 text-slate-950 sm:text-lg">Jadwal Score Reset</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Jadwal demo memakai time lokal yang eksplisit agar note Period Skor mudah diaudit.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-800" htmlFor="reset-time">Jadwal Score Reset <span className="font-normal text-slate-500">(HH:MM)</span><input aria-describedby="reset-time-help" aria-label="Jadwal Score Reset" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" id="reset-time" onChange={(event) => { setDraft((current) => current ? { ...current, resetTime: event.target.value } : current); setFormError(undefined); setFeedback(undefined); }} type="time" value={draft.resetTime} /><span className="mt-1 block text-xs font-normal text-slate-500" id="reset-time-help">Dieksekusi pada zona time Asia/Jakarta (WIB).</span></label>
            <label className="block text-sm font-medium text-slate-800">Lead time recap <span className="font-normal text-slate-500">(0–1440 menit)</span><input aria-describedby="recap-help" aria-label="Lead time recap" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" max="1440" min="0" onChange={(event) => updateNumber("recapLeadMinutes", event.target.value)} step="1" type="number" value={draft.recapLeadMinutes} /><span className="mt-1 block text-xs font-normal text-slate-500" id="recap-help">Jarak dalam menit untuk menyiapkan ringkasan sebelum Score Reset.</span></label>
          </div>
          <p className="mt-5 inline-flex items-center gap-2 border-l-2 border-amber-400 pl-3 text-sm text-slate-600"><Clock3 aria-hidden="true" className="size-4 text-amber-700" />All timestamp konfigurasi ditampilkan sebagai Asia/Jakarta (WIB).</p>
        </fieldset>

        {formError && <p aria-live="assertive" className="border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{formError}</p>}
        {feedback && <p aria-live="polite" className="border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{feedback}</p>}
        <div className="flex flex-wrap justify-end gap-3"><Button disabled={saving} onClick={cancel} type="button" variant="outline">Cancel</Button><Button disabled={saving} type="submit">{saving ? "Saving…" : "Save parameter"}</Button></div>
      </form>
    </section>
  );
}

type PpeMappingDraft = {
  id?: string;
  yoloIndex: string;
  rawLabel: string;
  canonicalPpeClass: string;
  complianceCategory: CanonicalPpeClassMapping["complianceCategory"];
  active: boolean;
};

function copyCanonicalPpeClassConfiguration(configuration: CanonicalPpeClassConfiguration): CanonicalPpeClassConfiguration {
  return JSON.parse(JSON.stringify(configuration)) as CanonicalPpeClassConfiguration;
}

function createPpeMappingDraft(mapping?: CanonicalPpeClassMapping): PpeMappingDraft {
  return mapping
    ? { ...mapping, yoloIndex: String(mapping.yoloIndex) }
    : { yoloIndex: "", rawLabel: "", canonicalPpeClass: "", complianceCategory: "compliance", active: true };
}

function ppeComplianceCategoryLabel(category: CanonicalPpeClassMapping["complianceCategory"]) {
  return category === "compliance" ? "Compliant" : "Violation";
}

function createPpeMappingId(mappings: CanonicalPpeClassMapping[]) {
  let sequence = mappings.length + 1;
  let id = `PPE-${String(sequence).padStart(2, "0")}`;
  while (mappings.some((mapping) => mapping.id === id)) {
    sequence += 1;
    id = `PPE-${String(sequence).padStart(2, "0")}`;
  }
  return id;
}

function CanonicalPpeClasses({ service }: { service: CanonicalPpeClassCapability }) {
  const [configuration, setConfiguration] = useState<CanonicalPpeClassConfiguration>();
  const [draft, setDraft] = useState<PpeMappingDraft>();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [saving, setSaving] = useState(false);
  const phoneLayout = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    let active = true;
    service.getCanonicalPpeClassConfiguration().then((nextConfiguration) => {
      if (active) setConfiguration(nextConfiguration);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Configuration Canonical PPE Classes tidak dapat dimuat.");
    });
    return () => {
      active = false;
    };
  }, [service]);

  const updateDraft = <Field extends keyof PpeMappingDraft>(field: Field, value: PpeMappingDraft[Field]) => {
    setDraft((current) => current ? { ...current, [field]: value } : current);
    setError(undefined);
    setNotice(undefined);
  };

  const saveConfiguration = async (nextConfiguration: CanonicalPpeClassConfiguration, successMessage: string) => {
    setSaving(true);
    setError(undefined);
    try {
      const saved = await service.updateCanonicalPpeClassConfiguration(nextConfiguration);
      setConfiguration(saved);
      setNotice(successMessage);
      return saved;
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Configuration Canonical PPE Classes tidak dapat disimpan.");
      return undefined;
    } finally {
      setSaving(false);
    }
  };

  const submitMapping = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!configuration || !draft) return;

    const yoloIndex = Number(draft.yoloIndex);
    if (!Number.isInteger(yoloIndex) || yoloIndex < 0) {
      setError("Indeks YOLO harus berupa bilangan bulat nol atau lebih.");
      return;
    }
    if (!draft.rawLabel.trim() || !draft.canonicalPpeClass.trim()) {
      setError("Label mentah dan Canonical PPE Classes wajib diisi.");
      return;
    }
    if (configuration.mappings.some((mapping) => mapping.id !== draft.id && mapping.yoloIndex === yoloIndex)) {
      setError(`Indeks YOLO ${yoloIndex} sudah digunakan.`);
      return;
    }

    const nextMapping: CanonicalPpeClassMapping = {
      id: draft.id ?? createPpeMappingId(configuration.mappings),
      yoloIndex,
      rawLabel: draft.rawLabel.trim(),
      canonicalPpeClass: draft.canonicalPpeClass.trim(),
      complianceCategory: draft.complianceCategory,
      active: draft.active,
    };
    const nextConfiguration = copyCanonicalPpeClassConfiguration(configuration);
    const existingIndex = nextConfiguration.mappings.findIndex((mapping) => mapping.id === nextMapping.id);
    if (existingIndex === -1) nextConfiguration.mappings.push(nextMapping);
    else nextConfiguration.mappings[existingIndex] = nextMapping;

    const saved = await saveConfiguration(nextConfiguration, "Mapping Canonical PPE Classes disimpan.");
    if (saved) setDraft(undefined);
  };

  const selectModelFile = async (file: File | undefined) => {
    if (!file || !configuration) return;
    const nextConfiguration = copyCanonicalPpeClassConfiguration(configuration);
    nextConfiguration.modelFileMetadata = {
      fileName: file.name,
      sizeBytes: file.size,
      mimeType: file.type || "application/octet-stream",
    };
    await saveConfiguration(nextConfiguration, "Metadata model ONNX demo disimpan.");
  };

  if (error && !configuration) {
    return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Canonical PPE Classes</h1><div className="mt-6 border border-red-200 bg-red-50 p-6"><p className="font-medium text-red-900">Configuration Canonical PPE Classes tidak dapat dimuat</p><p className="mt-1 text-sm text-red-800">{error}</p></div></section>;
  }
  if (!configuration) {
    return <section aria-busy="true" aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Canonical PPE Classes</h1><p className="mt-6 text-slate-600">Loading konfigurasi Canonical PPE Classes…</p></section>;
  }

  const preview = draft ?? createPpeMappingDraft();
  const modelFileMetadata = configuration.modelFileMetadata;
  const yoloIndexError = error?.startsWith("Indeks YOLO") ? error : undefined;

  return (
    <section aria-labelledby="canonical-ppe-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Configuration interpretasi model</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950" id="canonical-ppe-title">Canonical PPE Classes</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Terjemahkan label keluaran model menjadi Canonical PPE Classes yang dapat dipakai konsisten oleh Hazardous Zone.</p></div>
        <Button onClick={() => { setDraft(createPpeMappingDraft()); setError(undefined); setNotice(undefined); }}>Add mapping</Button>
      </div>

      {notice && <p aria-live="polite" className="mt-5 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{notice}</p>}
      {error && !yoloIndexError && <p aria-live="assertive" className="mt-5 border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}

      {!phoneLayout && <div className="mt-8 overflow-x-auto border border-slate-200 bg-white">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <caption className="sr-only">Daftar mapping Canonical PPE Classes</caption>
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Indeks YOLO</th><th className="px-4 py-3">Label mentah</th><th className="px-4 py-3">Canonical PPE Classes</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"><span className="sr-only">Tindakan</span></th></tr></thead>
          <tbody>{configuration.mappings.map((mapping) => <tr className="border-b border-slate-100 last:border-0" key={mapping.id}><td className="px-4 py-3 font-mono text-slate-950">{mapping.yoloIndex}</td><td className="px-4 py-3 font-mono text-slate-700">{mapping.rawLabel}</td><td className="px-4 py-3 font-medium text-slate-950">{mapping.canonicalPpeClass}</td><td className="px-4 py-3">{ppeComplianceCategoryLabel(mapping.complianceCategory)}</td><td className="px-4 py-3">{mapping.active ? "Active" : "Inactive"}</td><td className="px-4 py-3 text-right"><Button onClick={() => { setDraft(createPpeMappingDraft(mapping)); setError(undefined); setNotice(undefined); }} size="sm" variant="outline">Edit mapping {mapping.rawLabel}</Button></td></tr>)}</tbody>
        </table>
      </div>}
      {phoneLayout && <div aria-label="Daftar mapping Canonical PPE Classes untuk ponsel" className="mt-8 space-y-3" role="list">
        {configuration.mappings.map((mapping) => <article aria-label={mapping.rawLabel} className="border border-slate-200 bg-white p-4" key={mapping.id} role="listitem"><dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm"><div><dt className="text-slate-500">Indeks YOLO</dt><dd className="mt-1 font-mono text-slate-950">{mapping.yoloIndex}</dd></div><div><dt className="text-slate-500">Status</dt><dd className="mt-1 font-medium text-slate-950">{mapping.active ? "Active" : "Inactive"}</dd></div><div><dt className="text-slate-500">Label mentah</dt><dd className="mt-1 text-slate-950">{mapping.rawLabel}</dd></div><div><dt className="text-slate-500">Canonical PPE Classes</dt><dd className="mt-1 font-medium text-slate-950">{mapping.canonicalPpeClass}</dd></div><div className="col-span-2"><dt className="text-slate-500">Kategori</dt><dd className="mt-1 text-slate-950">{ppeComplianceCategoryLabel(mapping.complianceCategory)}</dd></div></dl><Button className="mt-4" onClick={() => { setDraft(createPpeMappingDraft(mapping)); setError(undefined); setNotice(undefined); }} size="sm" variant="outline">Edit mapping {mapping.rawLabel}</Button></article>)}
      </div>}

      {draft && <form className="mt-6 border border-slate-200 bg-white p-5 sm:p-6" noValidate onSubmit={(event) => void submitMapping(event)}>
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-semibold text-slate-950">{draft.id ? "Edit mapping" : "Add mapping"}</h2><p className="mt-1 text-sm text-slate-600">Setiap indeks YOLO hanya boleh digunakan satu kali.</p></div><Button onClick={() => setDraft(undefined)} type="button" variant="outline">Cancel</Button></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-800">Indeks YOLO<input aria-describedby={yoloIndexError ? "yolo-index-error" : undefined} aria-invalid={Boolean(yoloIndexError)} aria-label="Indeks YOLO" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" min="0" onChange={(event) => updateDraft("yoloIndex", event.target.value)} step="1" type="number" value={draft.yoloIndex} />{yoloIndexError && <span className="mt-1 block text-xs font-normal text-red-700" id="yolo-index-error" role="alert">{yoloIndexError}</span>}</label>
          <label className="block text-sm font-medium text-slate-800">Label mentah<input aria-label="Label mentah" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => updateDraft("rawLabel", event.target.value)} value={draft.rawLabel} /></label>
          <label className="block text-sm font-medium text-slate-800">Canonical PPE Classes<input aria-label="Canonical PPE Classes" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => updateDraft("canonicalPpeClass", event.target.value)} value={draft.canonicalPpeClass} /></label>
          <label className="block text-sm font-medium text-slate-800">Interpretation category<select aria-label="Interpretation category" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => updateDraft("complianceCategory", event.target.value as CanonicalPpeClassMapping["complianceCategory"])} value={draft.complianceCategory}><option value="compliance">Compliant</option><option value="violation">Violation</option></select></label>
        </div>
        <label className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-800"><input checked={draft.active} onChange={(event) => updateDraft("active", event.target.checked)} type="checkbox" />Mapping aktif</label>
        <aside aria-label="Preview interpretasi mapping" className="mt-5 border-l-2 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-slate-700"><span className="font-medium">Preview interpretasi: </span>{preview.rawLabel.trim() || "Label mentah"} akan dipahami sebagai <span className="font-medium">{preview.canonicalPpeClass.trim() || "Canonical PPE Classes"}</span> dengan kategori {ppeComplianceCategoryLabel(preview.complianceCategory).toLowerCase()}.</aside>
        <div className="mt-5 flex justify-end"><Button disabled={saving} type="submit">{saving ? "Saving…" : "Save mapping"}</Button></div>
      </form>}

      <section aria-labelledby="onnx-metadata-title" className="mt-6 border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-slate-950" id="onnx-metadata-title">Metadata model ONNX</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Pemilih file ini hanya menyimpan name dan metadata demo. Validasi maupun inferensi model ONNX memerlukan backend dan tidak dilakukan di browser.</p>
        <label className="mt-5 block text-sm font-medium text-slate-800">Select file ONNX demo<input accept=".onnx,application/octet-stream" aria-label="Select file ONNX demo" className="mt-1 block w-full text-sm text-slate-700" onChange={(event) => void selectModelFile(event.target.files?.[0])} type="file" /></label>
        {modelFileMetadata && <dl className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3"><div><dt className="text-slate-500">Name file</dt><dd className="mt-1 font-mono text-slate-950">{modelFileMetadata.fileName}</dd></div><div><dt className="text-slate-500">Ukuran</dt><dd className="mt-1 text-slate-950">{Math.round(modelFileMetadata.sizeBytes / 1024)} KB</dd></div><div><dt className="text-slate-500">Tipe</dt><dd className="mt-1 font-mono text-slate-950">{modelFileMetadata.mimeType}</dd></div></dl>}
      </section>
    </section>
  );
}

type HazardousZoneDraft = HazardousZoneInput;
type ZoneDrag = {
  kind: "move" | "resize";
  pointer: { x: number; y: number };
  bounds: NormalizedZoneBounds;
};
type ZoneLifecycleAction = {
  kind: "deactivate" | "delete";
  zone: HazardousZone;
};

const zonePatterns = ["border-amber-300 bg-amber-400/15", "border-sky-300 bg-sky-400/15 border-dashed", "border-violet-300 bg-violet-400/15", "border-emerald-300 bg-emerald-400/15 border-dashed"];

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(Math.max(value, minimum), maximum);
}

function normalized(value: number) {
  return Number(value.toFixed(4));
}

function pointInZone(event: React.PointerEvent<HTMLElement>, canvas: HTMLElement) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: clamp((event.clientX - rect.left) / rect.width),
    y: clamp((event.clientY - rect.top) / rect.height),
  };
}

function createHazardousZoneDraft(camera: Camera, canonicalClasses: string[]): HazardousZoneDraft {
  return {
    name: "",
    cameraId: camera.id,
    active: true,
    bounds: { x: 0.2, y: 0.2, width: 0.3, height: 0.3 },
    requiredCanonicalPpeClasses: canonicalClasses.slice(0, 1),
    supervisorAreas: [camera.supervisorArea],
  };
}

function copyHazardousZone(zone: HazardousZone): HazardousZoneDraft {
  return {
    ...zone,
    bounds: { ...zone.bounds },
    requiredCanonicalPpeClasses: [...zone.requiredCanonicalPpeClasses],
    supervisorAreas: [...zone.supervisorAreas],
  };
}

function HazardousZoneEditor({ service }: { service: CameraSourceCapability & HazardousZoneCapability & CanonicalPpeClassCapability }) {
  const [cameras, setCameras] = useState<Camera[]>();
  const [zones, setZones] = useState<HazardousZoneWithViolationHistory[]>();
  const [configuration, setConfiguration] = useState<CanonicalPpeClassConfiguration>();
  const [selectedCameraId, setSelectedCameraId] = useState<string>();
  const [draft, setDraft] = useState<HazardousZoneDraft>();
  const [drag, setDrag] = useState<ZoneDrag>();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [zoneStatusFilter, setZoneStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [lifecycleAction, setLifecycleAction] = useState<ZoneLifecycleAction>();
  const [changingLifecycle, setChangingLifecycle] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const phoneZoneEditor = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    let active = true;
    Promise.all([service.getCameras(), service.getHazardousZone(), service.getCanonicalPpeClassConfiguration()])
      .then(([nextCameras, nextZones, nextConfiguration]) => {
        if (!active) return;
        setCameras(nextCameras);
        setZones(nextZones);
        setConfiguration(nextConfiguration);
        setSelectedCameraId(nextCameras[0]?.id);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Hazardous Zone tidak dapat dimuat.");
      });
    return () => {
      active = false;
    };
  }, [service]);

  const selectedCamera = cameras?.find((camera) => camera.id === selectedCameraId);
  const canonicalClasses = [...new Set(configuration?.mappings.filter((mapping) => mapping.active).map((mapping) => mapping.canonicalPpeClass) ?? [])];
  const supervisorAreas = [...new Set(cameras?.map((camera) => camera.supervisorArea) ?? [])];
  const cameraZones = zones?.filter((zone) => zone.cameraId === selectedCameraId && (zoneStatusFilter === "all" || zone.active === (zoneStatusFilter === "active"))) ?? [];
  const draftZone = draft?.id ? zones?.find((zone) => zone.id === draft.id) : undefined;

  const updateDraft = <Field extends keyof HazardousZoneDraft>(field: Field, value: HazardousZoneDraft[Field]) => {
    setDraft((current) => current ? { ...current, [field]: value } : current);
    setError(undefined);
  };

  const setBounds = (bounds: NormalizedZoneBounds) => updateDraft("bounds", bounds);

  const openDraft = (zone?: HazardousZone) => {
    if (!selectedCamera || !configuration) return;
    setDraft(zone ? copyHazardousZone(zone) : createHazardousZoneDraft(selectedCamera, canonicalClasses));
    setError(undefined);
    setNotice(undefined);
  };

  const toggleSelection = (field: "requiredCanonicalPpeClasses" | "supervisorAreas", value: string) => {
    setDraft((current) => {
      if (!current) return current;
      const values = current[field];
      return { ...current, [field]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value] };
    });
    setError(undefined);
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError(undefined);
    try {
      const saved = await service.saveHazardousZone(draft);
      setZones((current) => {
        const existing = current?.findIndex((zone) => zone.id === saved.id) ?? -1;
        if (existing === -1) return [...(current ?? []), saved];
        return current!.map((zone) => zone.id === saved.id ? saved : zone);
      });
      setDraft(undefined);
      setNotice(`Hazardous Zone ${saved.name} disimpan.`);
      setCameras(await service.getCameras());
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Hazardous Zone tidak dapat disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const confirmLifecycleAction = async () => {
    if (!lifecycleAction) return;
    setChangingLifecycle(true);
    setError(undefined);
    try {
      if (lifecycleAction.kind === "deactivate") {
        const saved = await service.deactivateHazardousZone(lifecycleAction.zone.id);
        setZones((current) => current?.map((zone) => zone.id === saved.id ? saved : zone));
        setNotice(`Hazardous Zone ${saved.name} dinonaktifkan.`);
      } else {
        await service.deleteHazardousZone(lifecycleAction.zone.id);
        setZones((current) => current?.filter((zone) => zone.id !== lifecycleAction.zone.id));
        setNotice(`Hazardous Zone ${lifecycleAction.zone.name} dihapus permanen.`);
      }
      setDraft(undefined);
      setCameras(await service.getCameras());
      setLifecycleAction(undefined);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Lifecycle Hazardous Zone tidak dapat diperbarui.");
    } finally {
      setChangingLifecycle(false);
    }
  };

  const beginDrawing = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draft || draft.id || !selectedCamera || phoneZoneEditor) return;
    const point = pointInZone(event, event.currentTarget);
    setBounds({ x: point.x, y: point.y, width: 0.01, height: 0.01 });
    setDrag({ kind: "resize", pointer: point, bounds: { x: point.x, y: point.y, width: 0.01, height: 0.01 } });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const movePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draft || !drag || phoneZoneEditor) return;
    const point = pointInZone(event, event.currentTarget);
    if (drag.kind === "move") {
      const deltaX = point.x - drag.pointer.x;
      const deltaY = point.y - drag.pointer.y;
      setBounds({ ...drag.bounds, x: normalized(clamp(drag.bounds.x + deltaX, 0, 1 - drag.bounds.width)), y: normalized(clamp(drag.bounds.y + deltaY, 0, 1 - drag.bounds.height)) });
      return;
    }
    setBounds({ ...drag.bounds, width: normalized(clamp(point.x - drag.bounds.x, 0.01, 1 - drag.bounds.x)), height: normalized(clamp(point.y - drag.bounds.y, 0.01, 1 - drag.bounds.y)) });
  };

  if (error && !cameras) {
    return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Hazardous Zones</h1><div className="mt-6 border border-red-200 bg-red-50 p-6"><p className="font-medium text-red-900">Hazardous Zones could not be loaded</p><p className="mt-1 text-sm text-red-800">{error}</p></div></section>;
  }
  if (!cameras || !zones || !configuration || !selectedCamera) {
    return <section aria-busy="true" aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Hazardous Zones</h1><p className="mt-6 text-slate-600">Loading Zone Editor…</p></section>;
  }

  return (
    <section aria-labelledby="hazardous-zones-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Operational configuration</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950" id="hazardous-zones-title">Hazardous Zones</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Configure PPE coverage on a simulated Camera Source frame. Coordinates are stored in normalized form so they remain consistent at every screen size.</p></div>
        <Button onClick={() => openDraft()}>Add Hazardous Zone</Button>
      </div>
      {notice && <p aria-live="polite" className="mt-5 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{notice}</p>}
      {error && <p aria-live="assertive" className="mt-5 border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}

      <label className="mt-8 block max-w-md text-sm font-medium text-slate-800">Select Camera Sources<select aria-label="Select Camera Source" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => { setSelectedCameraId(event.target.value); setDraft(undefined); setError(undefined); }} value={selectedCamera.id}>{cameras.map((camera) => <option key={camera.id} value={camera.id}>{camera.name} · {camera.location}</option>)}</select></label>
      <label className="mt-4 block max-w-md text-sm font-medium text-slate-800">Filter status<select aria-label="Filter Hazardous Zone status" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => setZoneStatusFilter(event.target.value as "all" | "active" | "inactive")} value={zoneStatusFilter}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <section aria-label={`Frame Zone Editor ${selectedCamera.name}`} className="overflow-hidden border border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3 text-sm text-slate-200"><span className="font-medium">{selectedCamera.name}</span><span className="font-mono text-xs text-slate-400">{selectedCamera.id}</span></div>
          <div aria-disabled={phoneZoneEditor} aria-label="Hazardous Zone canvas" className="relative aspect-video touch-none overflow-hidden bg-slate-900" onPointerDown={beginDrawing} onPointerMove={movePointer} onPointerUp={() => setDrag(undefined)} ref={canvasRef}>
            <img alt="Illustration of a fictional industrial area for the Hazardous Zone editor" className="pointer-events-none h-full w-full object-cover" src={industrialMonitoringScene} />
            <span className="absolute right-4 top-4 border border-amber-300 bg-slate-950/90 px-2 py-1 font-mono text-[10px] font-medium tracking-[0.12em] text-amber-200">SIMULASI</span>
            {cameraZones.map((zone, index) => {
              const displayedZone = draft?.id === zone.id ? draft : zone;
              return <div className={`absolute border-2 ${zonePatterns[index % zonePatterns.length]} pointer-events-none md:pointer-events-auto`} key={zone.id} style={{ left: `${displayedZone.bounds.x * 100}%`, top: `${displayedZone.bounds.y * 100}%`, width: `${displayedZone.bounds.width * 100}%`, height: `${displayedZone.bounds.height * 100}%` }}><button aria-label={`Move ${zone.name}`} className="absolute inset-0 w-full cursor-move text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" onClick={() => openDraft(zone)} onPointerDown={(event) => { event.stopPropagation(); const point = pointInZone(event, canvasRef.current ?? event.currentTarget); setDraft(copyHazardousZone(zone)); setDrag({ kind: "move", pointer: point, bounds: zone.bounds }); event.currentTarget.setPointerCapture?.(event.pointerId); }} type="button"><span className="absolute -top-6 left-0 whitespace-nowrap bg-slate-950/90 px-2 py-1 text-xs font-medium text-white">{zone.name}</span><span className="sr-only">Move zone with pointer.</span></button><button aria-label={`Resize ${zone.name}`} className="absolute -bottom-1 -right-1 z-10 size-3 cursor-se-resize border border-white bg-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" onPointerDown={(event) => { event.stopPropagation(); setDraft(copyHazardousZone(zone)); setDrag({ kind: "resize", pointer: { x: 0, y: 0 }, bounds: zone.bounds }); event.currentTarget.setPointerCapture?.(event.pointerId); }} type="button"><span className="sr-only">Resize zone</span></button></div>;
            })}
            {draft && !draft.id && <div aria-label="New Hazardous Zone" className="pointer-events-none absolute border-2 border-dashed border-amber-300 bg-amber-400/15" style={{ left: `${draft.bounds.x * 100}%`, top: `${draft.bounds.y * 100}%`, width: `${draft.bounds.width * 100}%`, height: `${draft.bounds.height * 100}%` }} />}
          </div>
          <p className="border-t border-slate-700 px-4 py-3 text-xs leading-5 text-slate-300"><span className="hidden md:inline">Draw a new zone, or drag an existing zone to move it.</span><span className="md:hidden">On a phone, the frame is view-only. Use the coordinate inputs below.</span></p>
        </section>
        <aside className="border border-slate-200 bg-white p-5"><h2 className="text-lg font-semibold text-slate-950">Zones in frame</h2><p className="mt-1 text-sm text-slate-600">{cameraZones.length} zones configured.</p><div className="mt-5 space-y-3">{cameraZones.map((zone, index) => <article aria-label={zone.name} className="border border-slate-200 p-3" key={zone.id}><div className="flex items-start gap-2"><span aria-hidden="true" className={`mt-1 size-3 border-2 ${zonePatterns[index % zonePatterns.length]}`} /><div><p className="font-medium text-slate-950">{zone.name}</p><p className="mt-1 text-xs text-slate-600">{zone.active ? "Active" : "Inactive"} · {zone.requiredCanonicalPpeClasses.join(", ")}</p></div></div><Button className="mt-3" onClick={() => openDraft(zone)} size="sm" variant="outline">Edit {zone.name}</Button></article>)}</div></aside>
      </div>

      {draft && <form className="mt-6 border border-slate-200 bg-white p-5 sm:p-6" noValidate onSubmit={(event) => void save(event)}>
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-semibold text-slate-950">{draft.id ? "Edit Hazardous Zone" : "Add Hazardous Zone"}</h2><p className="mt-1 text-sm text-slate-600">Assign PPE and a Area Supervisor before saving the zone.</p></div><Button onClick={() => setDraft(undefined)} type="button" variant="outline">Cancel</Button></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-800">Hazardous Zone name<input aria-label="Hazardous Zone name" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => updateDraft("name", event.target.value)} value={draft.name} /></label><label className="block text-sm font-medium text-slate-800">Camera Source<select aria-label="Hazardous Zone Camera Source" className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => updateDraft("cameraId", event.target.value)} value={draft.cameraId}>{cameras.map((camera) => <option key={camera.id} value={camera.id}>{camera.name}</option>)}</select></label></div>
        <fieldset className="mt-5"><legend className="text-sm font-medium text-slate-800">Required PPE</legend><div className="mt-2 flex flex-wrap gap-3">{canonicalClasses.map((item) => <label className="inline-flex items-center gap-2 text-sm text-slate-800" key={item}><input checked={draft.requiredCanonicalPpeClasses.includes(item)} onChange={() => toggleSelection("requiredCanonicalPpeClasses", item)} type="checkbox" />{item}</label>)}</div></fieldset>
        <fieldset className="mt-5"><legend className="text-sm font-medium text-slate-800">Area Supervisor</legend><div className="mt-2 flex flex-wrap gap-3">{supervisorAreas.map((item) => <label className="inline-flex items-center gap-2 text-sm text-slate-800" key={item}><input checked={draft.supervisorAreas.includes(item)} onChange={() => toggleSelection("supervisorAreas", item)} type="checkbox" />{item}</label>)}</div></fieldset>
        {draft.id ? <p className="mt-5 text-sm text-slate-700">Current status: <span className="font-medium">{draftZone?.active ? "Active" : "Inactive"}</span>. Use the lifecycle action below to deactivate this Hazardous Zone.</p> : <label className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-800"><input checked={draft.active} onChange={(event) => updateDraft("active", event.target.checked)} type="checkbox" />Active Hazardous Zone</label>}
        <fieldset className="mt-5"><legend className="text-sm font-medium text-slate-800">Normalized coordinates <span className="font-normal text-slate-500">(0–1)</span></legend><div className="mt-2 grid gap-3 grid-cols-2 sm:grid-cols-4">{(["x", "y", "width", "height"] as const).map((field) => <label className="text-xs font-medium text-slate-600" key={field}>{field === "x" ? "X" : field === "y" ? "Y" : field === "width" ? "Width" : "Height"}<input aria-label={`Coordinate ${field}`} className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" max="1" min="0" onChange={(event) => setBounds({ ...draft.bounds, [field]: Number(event.target.value) })} step="0.01" type="number" value={draft.bounds[field]} /></label>)}</div></fieldset>
        {draftZone && <section aria-label="Hazardous Zone lifecycle" className="mt-6 border-t border-slate-200 pt-5"><h3 className="font-medium text-slate-950">Hazardous Zone lifecycle</h3><p className="mt-1 text-sm leading-6 text-slate-600">Deactivation is the primary action: the Hazardous Zone remains stored so its audit and configuration context can be traced.</p>{draftZone.active ? <Button className="mt-4" onClick={() => setLifecycleAction({ kind: "deactivate", zone: draftZone })} type="button" variant="outline">Deactivate Hazardous Zone</Button> : <p className="mt-4 text-sm font-medium text-slate-700">This Hazardous Zone is already inactive.</p>}{draftZone.hasViolationHistory ? <p className="mt-4 border-l-2 border-amber-400 pl-3 text-sm leading-6 text-slate-700">This Hazardous Zone has Violation History and cannot be permanently deleted, in accordance with ADR-0002.</p> : <div className="mt-4"><p className="text-sm leading-6 text-slate-600">This zone has no Violation History and can be permanently deleted.</p><Button className="mt-3" onClick={() => setLifecycleAction({ kind: "delete", zone: draftZone })} type="button" variant="outline">Permanently delete Hazardous Zone</Button></div>}</section>}
        <div className="mt-6 flex justify-end"><Button disabled={saving} type="submit">{saving ? "Saving…" : "Save Hazardous Zone"}</Button></div>
      </form>}
      {lifecycleAction && <AccessibleDialog label={`${lifecycleAction.kind === "deactivate" ? "Confirm deactivation" : "Confirm deletion"} ${lifecycleAction.zone.name}`} onDismiss={() => setLifecycleAction(undefined)}><div className="w-full max-w-lg border border-slate-200 bg-white p-6 shadow-xl"><h2 className="text-xl font-semibold text-slate-950">{lifecycleAction.kind === "deactivate" ? "Deactivate Hazardous Zone?" : "Permanently delete Hazardous Zone?"}</h2><p className="mt-3 text-sm leading-6 text-slate-700">{lifecycleAction.kind === "deactivate" ? `Hazardous Zone ${lifecycleAction.zone.name} is no longer used by active monitoring, but remains available in configuration and retains its audit context.` : `Hazardous Zone ${lifecycleAction.zone.name} will be removed from configuration and its Camera Source. This action cannot be undone.`}</p><div className="mt-6 flex justify-end gap-3"><Button data-dialog-initial-focus disabled={changingLifecycle} onClick={() => setLifecycleAction(undefined)} type="button" variant="outline">Cancel</Button><Button disabled={changingLifecycle} onClick={() => void confirmLifecycleAction()} type="button">{changingLifecycle ? "Processing…" : lifecycleAction.kind === "deactivate" ? "Confirm deactivation" : "Confirm permanent deletion"}</Button></div></div></AccessibleDialog>}
    </section>
  );
}

type NotificationScopeType = NotificationRecipientScope["type"];

function notificationScopeLabel(recipient: NotificationRecipient, zones: HazardousZone[]) {
  const scope = recipient.scope;
  if (scope.type === "global") return "Global";
  if (scope.type === "zone") return `Hazardous Zone: ${zones.find((zone) => zone.id === scope.zoneId)?.name ?? scope.zoneId}`;
  return `Department: ${scope.departmentId}`;
}

function NotificationConfiguration({ persona, service }: { persona: Persona; service: EmployeeDirectoryCapability & HazardousZoneCapability & NotificationCapability }) {
  const [recipients, setRecipients] = useState<NotificationRecipient[]>();
  const [logs, setLogs] = useState<NotificationSimulationLog[]>();
  const [zones, setZones] = useState<HazardousZone[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [chatId, setChatId] = useState("");
  const [role, setRole] = useState<NotificationRecipientRole>("Human Resources (HR)");
  const [scopeType, setScopeType] = useState<NotificationScopeType>("global");
  const [scopeTarget, setScopeTarget] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<NotificationRecipient>();

  const load = () => {
    Promise.all([service.getNotificationRecipients(), service.getNotificationSimulationLogs(), service.getHazardousZone(), service.getEmployeeDirectory()])
      .then(([nextRecipients, nextLogs, nextZones, directory]) => {
        setRecipients(nextRecipients);
        setLogs(nextLogs);
        setZones(nextZones);
        setDepartments([...new Set(directory.employees.map((employee) => employee.departmentId))].sort());
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Notifications tidak dapat dimuat."));
  };

  useEffect(load, [service]);

  const isAdmin = persona.role === "admin";
  const selectedScope = (): NotificationRecipientScope => {
    if (scopeType === "zone") return { type: "zone", zoneId: scopeTarget };
    if (scopeType === "department") return { type: "department", departmentId: scopeTarget };
    return { type: "global" };
  };
  const resetForm = () => {
    setAdding(false);
    setName("");
    setChatId("");
    setRole("Human Resources (HR)");
    setScopeType("global");
    setScopeTarget("");
  };
  const saveRecipient = async () => {
    setError(undefined);
    try {
      await service.saveNotificationRecipient({ name, chatId, role, scope: selectedScope() });
      resetForm();
      setNotice("Penerima notifikasi simulasi disimpan. Chat ID telah dimasking.");
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Penerima notifikasi tidak dapat disimpan.");
    }
  };
  const simulate = async (recipient: NotificationRecipient, deliveryStatus: "sent" | "failed") => {
    setError(undefined);
    try {
      await service.simulateNotification(recipient.id, deliveryStatus);
      setNotice(`Uji SIMULASI ${deliveryStatus === "sent" ? "berhasil" : "gagal"} untuk ${recipient.name} dicatat.`);
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Uji notifikasi tidak dapat dijalankan.");
    }
  };
  const removeRecipient = async (recipient: NotificationRecipient) => {
    setError(undefined);
    try {
      await service.deleteNotificationRecipient(recipient.id);
      setNotice(`Penerima ${recipient.name} dihapus dari konfigurasi simulasi.`);
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Penerima notifikasi tidak dapat dihapus.");
    }
  };

  if (error && recipients === undefined) return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Notifications</h1><p className="mt-6 border border-red-200 bg-red-50 p-5 text-red-900">{error}</p></section>;
  if (recipients === undefined || logs === undefined) return <section aria-busy="true" aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Notifications</h1><p className="mt-6 text-slate-600">Loading konfigurasi notifikasi simulasi…</p></section>;

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Simulasi aman</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Notifications</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Kelola pemetaan penerima dan tinjau hasil pengiriman demo. No token bot, Chat ID mentah, atau pesan Telegram nyata pada aplikasi ini.</p></div><span className="border border-amber-300 bg-amber-50 px-3 py-2 font-mono text-xs font-medium tracking-[0.12em] text-amber-950">SIMULASI</span></div>
      {notice && <p aria-live="polite" className="mt-5 border-l-2 border-emerald-500 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
      {error && <p aria-live="polite" className="mt-5 border-l-2 border-red-500 bg-red-50 p-3 text-sm text-red-900">{error}</p>}

      {isAdmin && <section className="mt-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-slate-950">Simulation recipients</h2><p className="mt-1 text-sm text-slate-600">Human Resources (HR) uses global scope; an Area Supervisor must be assigned to a Hazardous Zone or department.</p></div><Button onClick={() => setAdding(true)} type="button">Add recipient</Button></div>
        {adding && <section className="mt-5 border border-amber-200 bg-amber-50 p-5"><h3 className="font-semibold text-slate-950">Add recipient simulasi</h3><div className="mt-4 grid gap-4 md:grid-cols-2"><label className="text-sm font-medium text-slate-800">Recipient name<input aria-label="Recipient name" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" onChange={(event) => setName(event.target.value)} value={name} /></label><label className="text-sm font-medium text-slate-800">Chat ID Telegram<input aria-label="Chat ID Telegram" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 font-mono text-sm" inputMode="numeric" onChange={(event) => setChatId(event.target.value)} value={chatId} /></label><label className="text-sm font-medium text-slate-800">Recipient role<select aria-label="Recipient role" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" onChange={(event) => { const nextRole = event.target.value as NotificationRecipientRole; setRole(nextRole); setScopeType(nextRole === "Human Resources (HR)" ? "global" : "zone"); setScopeTarget(""); }} value={role}><option value="Human Resources (HR)">Human Resources (HR)</option><option value="Area Supervisor">Area Supervisor</option></select></label><label className="text-sm font-medium text-slate-800">Recipient scope<select aria-label="Recipient scope" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" disabled={role === "Human Resources (HR)"} onChange={(event) => { setScopeType(event.target.value as NotificationScopeType); setScopeTarget(""); }} value={scopeType}><option value="global">Global</option><option value="zone">Hazardous Zones</option><option value="department">Department</option></select></label>{scopeType === "zone" && <label className="text-sm font-medium text-slate-800">Target Hazardous Zones<select aria-label="Target Hazardous Zone" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" onChange={(event) => setScopeTarget(event.target.value)} value={scopeTarget}><option value="">Select Hazardous Zones</option>{zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label>}{scopeType === "department" && <label className="text-sm font-medium text-slate-800">Target department<select aria-label="Target department" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" onChange={(event) => setScopeTarget(event.target.value)} value={scopeTarget}><option value="">Select department</option>{departments.map((department) => <option key={department} value={department}>{department}</option>)}</select></label>}</div><div className="mt-5 flex justify-end gap-3"><Button onClick={resetForm} type="button" variant="outline">Cancel</Button><Button disabled={!name.trim() || !chatId.trim() || (scopeType !== "global" && !scopeTarget)} onClick={() => void saveRecipient()} type="button">Save recipient</Button></div></section>}
        <div className="mt-5 grid gap-4 lg:grid-cols-2">{recipients.map((recipient) => <article aria-label={recipient.name} className="border border-slate-200 bg-white p-5" key={recipient.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-950">{recipient.name}</h3><p className="mt-1 text-sm text-slate-600">{recipient.role} · {notificationScopeLabel(recipient, zones)}</p><p className="mt-2 font-mono text-sm text-slate-700">Chat ID: {recipient.maskedChatId}</p></div><span className="border border-amber-300 bg-amber-50 px-2 py-1 font-mono text-[10px] font-medium text-amber-950">SIMULASI</span></div><div className="mt-5 flex flex-wrap gap-2"><Button aria-label={`View details ${recipient.name}`} onClick={() => setSelectedRecipient(recipient)} size="sm" type="button" variant="outline">View details</Button><Button onClick={() => void simulate(recipient, "sent")} size="sm" type="button" variant="outline">Uji berhasil</Button><Button onClick={() => void simulate(recipient, "failed")} size="sm" type="button" variant="outline">Uji gagal</Button><Button onClick={() => void removeRecipient(recipient)} size="sm" type="button" variant="outline">Delete penerima</Button></div></article>)}</div>
      </section>}

      <section className="mt-8"><div><h2 className="text-xl font-semibold text-slate-950">Log notifikasi simulasi</h2><p className="mt-1 text-sm text-slate-600">Hasil agregat pengujian dan eskalasi demo yang terkait Violation Event.</p></div>{logs.length === 0 ? <p className="mt-5 border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">No log notifikasi simulasi.</p> : <div className="mt-5 space-y-3">{[...logs].reverse().map((log) => <article className="flex flex-wrap items-start justify-between gap-4 border border-slate-200 bg-white p-4" key={log.id}><div className="flex gap-3">{log.deliveryStatus === "sent" ? <CheckCircle2 aria-label="Ikon Sent" className="mt-0.5 size-5 shrink-0 text-emerald-600" role="img" /> : <ShieldX aria-label="Ikon Failed" className="mt-0.5 size-5 shrink-0 text-red-600" role="img" />}<div><p className="font-medium text-slate-950">{log.recipientName}</p><p className="mt-1 text-sm text-slate-600">{log.recipientRole} · Violation Event {log.violationId}</p><p className="mt-1 font-mono text-xs text-slate-500">{formatWib(log.occurredAt)}</p></div></div><span className={`border px-2 py-1 text-xs font-medium ${log.deliveryStatus === "sent" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>{log.deliveryStatus === "sent" ? "Sent" : "Failed"} · SIMULASI</span></article>)}</div>}</section>
      {selectedRecipient && <AccessibleDialog label={`Details ${selectedRecipient.name}`} onDismiss={() => setSelectedRecipient(undefined)}><div className="w-full max-w-lg border border-slate-200 bg-white p-6 shadow-xl"><p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">SIMULASI</p><h2 className="mt-2 text-xl font-semibold text-slate-950">Details {selectedRecipient.name}</h2><dl className="mt-6 space-y-4 text-sm"><div><dt className="text-slate-500">Peran</dt><dd className="mt-1 font-medium text-slate-950">{selectedRecipient.role}</dd></div><div><dt className="text-slate-500">Cakupan</dt><dd className="mt-1 text-slate-950">{notificationScopeLabel(selectedRecipient, zones)}</dd></div><div><dt className="text-slate-500">Chat ID Telegram</dt><dd className="mt-1 font-mono text-slate-950">{selectedRecipient.maskedChatId}</dd></div></dl><p className="mt-5 border-l-2 border-amber-400 pl-3 text-sm leading-6 text-slate-700">Chat ID mentah tidak disimpan atau ditampilkan pada demo.</p><div className="mt-6 flex justify-end"><Button data-dialog-initial-focus onClick={() => setSelectedRecipient(undefined)} type="button" variant="outline">Tutup detail</Button></div></div></AccessibleDialog>}
    </section>
  );
}

function RestrictedAccess({ persona }: { persona: Persona }) {
  return (
    <section className="mx-auto max-w-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
      <LockKeyhole aria-hidden="true" className="size-6 text-amber-700" />
      <p className="mt-5 font-mono text-xs uppercase tracking-[0.16em] text-amber-800">Access control</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Restricted access</h1>
      <p className="mt-3 leading-6 text-slate-700">This page is not available to the {persona.name} persona. Choose a workspace that matches your role.</p>
      <Button className="mt-6" onClick={() => window.history.back()} variant="outline">Go back</Button>
    </section>
  );
}

function ProtectedPage({ page, persona, service }: { page: Page; persona: Persona; service: SawApplicationCapabilities }) {
  if (!page.roles.includes(persona.role)) return <RestrictedAccess persona={persona} />;
  return page.render(persona, service);
}

export function RoutedApplication({ initialPersona, service }: { initialPersona?: Role; service: SawApplicationCapabilities }) {
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
        {Object.entries(legacyRouteRedirects).map(([legacyPath, canonicalPath]) => (
          <Route element={<Navigate replace to={canonicalPath} />} key={legacyPath} path={legacyPath} />
        ))}
        {pages.map((page) => <Route element={<ProtectedPage page={page} persona={persona} service={service} />} key={page.path} path={page.path} />)}
        <Route path="*" element={<Navigate replace to={persona.landingPath} />} />
      </Routes>
    </ApplicationShell>
  );
}
