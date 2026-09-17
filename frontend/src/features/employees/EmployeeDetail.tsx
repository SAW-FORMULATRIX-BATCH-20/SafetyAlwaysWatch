import {
  Activity,
  Building2,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  UserCheck,
} from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";

import type { Persona } from "../../application/personas";
import { useEmployeeDetailQuery } from "../../hooks/queries/useEmployeesQuery";
import { EnsureQueryClient } from "../../providers/EnsureQueryClient";
import type { EmployeeDirectoryCapability } from "../../services/saw-service";
import { useAuthStore } from "../../stores/useAuthStore";

export type EmployeeDetailProps = {
  persona?: Persona;
  service?: EmployeeDirectoryCapability;
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getScoreStyles = (score: number) => {
  if (score < 60) {
    return {
      level: "critical",
      badge: "bg-rose-50 text-rose-700 border-rose-200/80",
      bar: "bg-rose-500",
      icon: ShieldX,
    };
  }
  if (score < 80) {
    return {
      level: "warning",
      badge: "bg-amber-50 text-amber-700 border-amber-200/80",
      bar: "bg-amber-500",
      icon: ShieldAlert,
    };
  }
  return {
    level: "safe",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    bar: "bg-emerald-500",
    icon: ShieldCheck,
  };
};

function EmployeeDetailContent({ persona: propPersona, service }: EmployeeDetailProps) {
  const { employeeId } = useParams();
  const location = useLocation();
  const authPersona = useAuthStore((state) => state.persona);
  const persona = propPersona ?? authPersona;

  const { employee, supervisor, isLoading, isError } = useEmployeeDetailQuery({
    employeeId,
    persona,
    service,
  });

  const notice = (location.state as { notice?: string } | null)?.notice;

  if (isError || (!isLoading && !employee && employeeId)) {
    return (
      <section className="mx-auto max-w-4xl py-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Employee details
        </h1>
        <div
          className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800"
          role="alert"
        >
          The requested Employee could not be found.
        </div>
      </section>
    );
  }

  if (isLoading || !employee) {
    return (
      <section aria-busy="true" className="mx-auto max-w-4xl py-6">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">
          Employee record
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
          Employee details
        </h1>
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-slate-500 shadow-xs">
          <div className="size-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="text-sm font-medium">Loading Employee details…</p>
        </div>
      </section>
    );
  }

  const displayName = employee.name ?? employee.id;
  const displayCode = employee.employeeCode ?? employee.id;
  const scoreConfig = getScoreStyles(employee.safetyScore);
  const StatusIcon = scoreConfig.icon;

  return (
    <section className="mx-auto max-w-4xl py-2 sm:py-6">
      <div className="mb-4">
        <Link
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-amber-800"
          to="/employees"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          <span>Back to Employees</span>
        </Link>
      </div>

      {notice && (
        <div
          aria-live="polite"
          className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-2xs"
          role="status"
        >
          <CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      <div>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">
          Employee record
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          Employee details
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          View safety compliance standing, supervisor hierarchy, and facial enrollment status.
        </p>
      </div>

      <div
        aria-label="Employee details"
        className="mt-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs"
        role="region"
      >
        {/* Profile Card Banner */}
        <div className="border-b border-slate-100 bg-gradient-to-r from-amber-500/10 via-amber-100/30 to-amber-50/10 p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
              <div className="flex size-14 sm:size-16 shrink-0 items-center justify-center rounded-2xl bg-amber-100 font-mono text-xl sm:text-2xl font-bold text-amber-900 ring-4 ring-white shadow-xs">
                {getInitials(displayName)}
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 truncate sm:overflow-visible sm:whitespace-normal">
                  {displayName}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
                  <span className="rounded-md border border-slate-300/80 bg-white px-2 py-0.5 font-mono font-medium text-slate-700 shadow-2xs">
                    {displayCode}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="rounded-md border border-amber-200/60 bg-amber-50 px-2 py-0.5 font-medium text-amber-800">
                    {employee.departmentId}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                      employee.status === "inactive"
                        ? "border-slate-200 bg-slate-100 text-slate-600"
                        : "border-emerald-200/80 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        employee.status === "inactive"
                          ? "bg-slate-400"
                          : "animate-pulse bg-emerald-500"
                      }`}
                    />
                    {employee.status === "inactive" ? "Inactive" : "Active"}
                  </span>
                </div>
              </div>
            </div>

            {persona?.role === "admin" && (
              <Link
                className="inline-flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 text-sm font-semibold text-slate-950 shadow-xs transition-all hover:-translate-y-0.5 hover:bg-amber-500 hover:shadow"
                to={`/employees/${employee.id}/face-enrollment`}
              >
                <Camera aria-hidden="true" className="size-4" />
                <span>Enroll face</span>
              </Link>
            )}
          </div>
        </div>

        {/* Operational Attributes Grid */}
        <div className="p-5 sm:p-8">
          <dl className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Department */}
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/40 p-4 transition-colors hover:border-slate-300 hover:bg-slate-50">
              <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Building2 aria-hidden="true" className="size-4 text-amber-600" />
                Department
              </dt>
              <dd className="mt-2 text-base font-semibold text-slate-900">
                {employee.departmentId}
              </dd>
            </div>

            {/* Direct supervisor */}
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/40 p-4 transition-colors hover:border-slate-300 hover:bg-slate-50">
              <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <UserCheck aria-hidden="true" className="size-4 text-amber-600" />
                Direct supervisor
              </dt>
              <dd className="mt-2 text-base font-semibold text-slate-900">
                {supervisor?.name ?? "Unassigned"}
              </dd>
            </div>

            {/* Status */}
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/40 p-4 transition-colors hover:border-slate-300 hover:bg-slate-50">
              <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Activity aria-hidden="true" className="size-4 text-amber-600" />
                Status
              </dt>
              <dd className="mt-2 text-base font-semibold text-slate-900">
                {employee.status === "inactive" ? "Inactive" : "Active"}
              </dd>
            </div>

            {/* Safety Score */}
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/40 p-4 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:col-span-2 lg:col-span-1">
              <dt className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
                <span className="flex items-center gap-1.5">
                  <StatusIcon aria-hidden="true" className="size-4 text-amber-600" />
                  Safety Score
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${scoreConfig.badge}`}
                >
                  {scoreConfig.level.toUpperCase()}
                </span>
              </dt>
              <dd className="mt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold tracking-tight text-slate-900">
                    {employee.safetyScore}
                  </span>
                  <span className="text-xs text-slate-400">/ 100</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${scoreConfig.bar}`}
                    style={{
                      width: `${Math.min(100, Math.max(0, employee.safetyScore))}%`,
                    }}
                  />
                </div>
              </dd>
            </div>

            {/* Enrollment status */}
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/40 p-4 transition-colors hover:border-slate-300 hover:bg-slate-50">
              <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <ShieldCheck aria-hidden="true" className="size-4 text-amber-600" />
                Enrollment status
              </dt>
              <dd className="mt-2">
                <span
                  className={`inline-block rounded-md border px-2.5 py-1 text-xs font-semibold ${
                    employee.faceSampleCount
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-100 text-slate-600"
                  }`}
                >
                  {employee.faceSampleCount ? "Enrolled" : "Not enrolled"}
                </span>
              </dd>
            </div>

            {/* Active Face Samples */}
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/40 p-4 transition-colors hover:border-slate-300 hover:bg-slate-50">
              <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Camera aria-hidden="true" className="size-4 text-amber-600" />
                Active Face Samples
              </dt>
              <dd className="mt-2 flex items-baseline gap-1 text-slate-900">
                <span className="text-2xl font-bold tracking-tight">
                  {employee.faceSampleCount ?? 0}
                </span>
                <span className="text-xs text-slate-400">active samples</span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

export function EmployeeDetail(props: EmployeeDetailProps) {
  return (
    <EnsureQueryClient>
      <EmployeeDetailContent {...props} />
    </EnsureQueryClient>
  );
}
