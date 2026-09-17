import {
  ArrowDownUp,
  Building2,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import { type Persona } from "../../application/personas";
import { Button } from "../../components/ui/button";
import { Pagination } from "../../components/ui/pagination";
import { useEmployeesQuery } from "../../hooks/queries/useEmployeesQuery";
import type { Employee, EmployeeDirectoryCapability } from "../../services/saw-service";
import { useAuthStore } from "../../stores/useAuthStore";
import {
  type EmployeeSort,
  type ScoreStatus,
  useEmployeeStore,
} from "../../stores/useEmployeeStore";

const employeeName = (employee: Employee) =>
  employee.name ?? `Employee ${employee.id}`;
const scoreStatus = (score: number, threshold: number): ScoreStatus =>
  score < threshold ? "critical" : score < 80 ? "warning" : "safe";
const enrollmentLabels = {
  enrolled: "Enrolled",
  pending: "Enrollment pending",
  "not-enrolled": "Not enrolled",
} as const;

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const statusStyles = {
  safe: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    bar: "bg-emerald-500",
  },
  warning: {
    badge: "bg-amber-50 text-amber-700 border-amber-200/80",
    bar: "bg-amber-500",
  },
  critical: {
    badge: "bg-rose-50 text-rose-700 border-rose-200/80",
    bar: "bg-rose-500",
  },
} as const;

const enrollmentStyles = {
  enrolled: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  pending: "bg-amber-50 text-amber-700 border-amber-200/60",
  "not-enrolled": "bg-slate-100 text-slate-600 border-slate-200/60",
} as const;

const DEFAULT_PAGE_SIZE = 6;

export type EmployeesProps = {
  persona?: Persona;
  service?: EmployeeDirectoryCapability;
  pageSize?: number;
};

export function Employees({
  persona: propPersona,
  service,
  pageSize = DEFAULT_PAGE_SIZE,
}: EmployeesProps) {
  const authPersona = useAuthStore((state) => state.persona);
  const persona = propPersona ?? authPersona;

  const {
    data: directory,
    isLoading,
    error: queryError,
  } = useEmployeesQuery({ persona, service });
  const error = queryError?.message;

  const {
    query,
    department,
    status,
    sort,
    page,
    setQuery,
    setDepartment,
    setStatus,
    setSort,
    setPage,
    clearFilters,
  } = useEmployeeStore();

  if (error)
    return (
      <section aria-live="polite">
        <h1>Employees</h1>
        <p>The Employees directory could not be loaded</p>
        <p>{error}</p>
      </section>
    );
  if (isLoading || !directory)
    return (
      <section aria-busy="true">
        <h1>Employees</h1>
        <p>Loading Employees directory…</p>
      </section>
    );

  const departments = [
    ...new Set(directory.employees.map((employee) => employee.departmentId)),
  ].sort();
  const normalizedQuery = query.toLowerCase().trim();
  const filteredEmployees = directory.employees
    .filter(
      (employee) =>
        (!normalizedQuery ||
          [
            employeeName(employee),
            employee.employeeCode ?? employee.id,
            employee.departmentId,
            employee.supervisorArea,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery)) &&
        (department === "all" || employee.departmentId === department) &&
        (status === "all" ||
          scoreStatus(employee.safetyScore, directory.escalationThreshold) ===
            status),
    )
    .sort((left, right) => {
      if (sort === "score-asc") return left.safetyScore - right.safetyScore;
      if (sort === "score-desc") return right.safetyScore - left.safetyScore;
      return (
        (sort === "name-desc" ? -1 : 1) *
        employeeName(left).localeCompare(employeeName(right))
      );
    });
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const clear = () => {
    clearFilters();
  };

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">
            Operational directory
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold">Employees</h1>
          <p className="mt-2 text-sm text-slate-600">
            Find Employees, their Safety Score position, and audit context
            without biometric capture.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <span className="text-xs sm:text-sm font-medium text-slate-600">
            <UserRound className="inline size-4 mr-1 text-slate-400" /> {directory.employees.length} Employees
          </span>
          {persona?.role === "admin" && (
            <Link
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-800 shadow-2xs transition-colors hover:border-slate-400 hover:bg-slate-50"
              to="/employees/new"
            >
              Add employee
            </Link>
          )}
        </div>
      </div>
      <div className="mt-6 sm:mt-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Search Employees
            <div className="relative flex items-center">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 size-4 text-slate-400" />
              <input
                aria-label="Search Employees"
                className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50/50 pl-9 pr-3 text-sm font-normal normal-case text-slate-900 transition-colors placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, code, area..."
                value={query}
              />
            </div>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Department
            <div className="relative flex items-center">
              <Building2 aria-hidden="true" className="pointer-events-none absolute left-3 size-4 text-slate-400" />
              <select
                aria-label="Department filter"
                className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-slate-50/50 pl-9 pr-8 text-sm font-normal normal-case text-slate-900 transition-colors focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                onChange={(event) => setDepartment(event.target.value)}
                value={department}
              >
                <option value="all">All departments</option>
                {departments.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 size-4 text-slate-400" />
            </div>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Safety Score status
            <div className="relative flex items-center">
              <ShieldAlert aria-hidden="true" className="pointer-events-none absolute left-3 size-4 text-slate-400" />
              <select
                aria-label="Safety Score status filter"
                className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-slate-50/50 pl-9 pr-8 text-sm font-normal normal-case text-slate-900 transition-colors focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                onChange={(event) => setStatus(event.target.value as ScoreStatus | "all")}
                value={status}
              >
                <option value="all">All statuses</option>
                <option value="safe">Safe</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 size-4 text-slate-400" />
            </div>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span className="flex items-center gap-1">
              Sort <ArrowDownUp aria-hidden="true" className="size-3 text-slate-400" />
            </span>
            <div className="relative flex items-center">
              <ArrowDownUp aria-hidden="true" className="pointer-events-none absolute left-3 size-4 text-slate-400" />
              <select
                aria-label="Employee sort"
                className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-slate-50/50 pl-9 pr-8 text-sm font-normal normal-case text-slate-900 transition-colors focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                onChange={(event) => setSort(event.target.value as EmployeeSort)}
                value={sort}
              >
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
                <option value="score-desc">Highest Safety Score</option>
                <option value="score-asc">Lowest Safety Score</option>
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 size-4 text-slate-400" />
            </div>
          </label>
        </div>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        {filteredEmployees.length > 0 ? (
          <p className="text-sm font-medium text-slate-600">
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, filteredEmployees.length)} of{" "}
            {filteredEmployees.length} Employees
          </p>
        ) : (
          <div />
        )}
        <Button
          className="w-full sm:w-auto justify-center gap-1.5 text-slate-700 hover:border-slate-400 hover:text-slate-900"
          onClick={clear}
          size="sm"
          variant="outline"
        >
          <RotateCcw aria-hidden="true" className="size-3.5 text-slate-500" />
          Clear Employee filters
        </Button>
      </div>
      {directory.employees.length === 0 ? (
        <p>No Employees</p>
      ) : filteredEmployees.length === 0 ? (
        <p>No matching Employees.</p>
      ) : (
        <div
          aria-label="Employee directory"
          className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2"
          role="list"
        >
          {visible.map((employee) => {
            const state = scoreStatus(
              employee.safetyScore,
              directory.escalationThreshold,
            );
            const Icon =
              state === "safe"
                ? ShieldCheck
                : state === "warning"
                  ? ShieldAlert
                  : ShieldX;
            return (
              <article
                aria-label={employeeName(employee)}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md"
                key={employee.id}
                role="listitem"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 font-mono text-xs font-semibold text-amber-800 ring-1 ring-amber-200/60">
                        {getInitials(employeeName(employee))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base font-semibold text-slate-900 transition-colors group-hover:text-amber-700 truncate">
                          {employeeName(employee)}
                        </h2>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-medium text-slate-600">
                            {employee.employeeCode ?? employee.id}
                          </span>
                          <span>·</span>
                          <span className="font-medium text-slate-700">
                            {employee.departmentId}
                          </span>
                          {employee.supervisorArea && (
                            <>
                              <span>·</span>
                              <span className="truncate">{employee.supervisorArea}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyles[state].badge}`}
                    >
                      <Icon
                        aria-label={`Safety Score status ${state}`}
                        className="size-3.5 shrink-0"
                        role="img"
                      />
                      <span>{employee.safetyScore}</span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg bg-slate-50 p-3">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-slate-600">
                      <span className="font-medium">Safety Score: {employee.safetyScore}/100</span>
                      <span
                        className={`rounded border px-2 py-0.5 text-[11px] font-medium ${
                          enrollmentStyles[employee.enrollmentStatus ?? "not-enrolled"]
                        }`}
                      >
                        {enrollmentLabels[employee.enrollmentStatus ?? "not-enrolled"]}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${statusStyles[state].bar}`}
                        style={{ width: `${Math.min(100, Math.max(0, employee.safetyScore))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-slate-100 pt-3">
                  <p className="font-mono text-xs text-slate-400 truncate">
                    {employee.departmentId} · {employee.safetyScore} ·{" "}
                    {
                      enrollmentLabels[
                        employee.enrollmentStatus ?? "not-enrolled"
                      ]
                    }
                  </p>
                  <Link
                    aria-label={`View details ${employeeName(employee)}`}
                    className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 shadow-2xs transition-colors hover:border-slate-400 hover:bg-slate-50 w-full sm:w-auto"
                    to={`/employees/${employee.id}`}
                  >
                    <span>View details</span>
                    <ChevronRight className="size-3 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {filteredEmployees.length > pageSize && (
        <Pagination
          ariaLabel="Employee pagination"
          currentPage={currentPage}
          onPageChange={setPage}
          totalPages={totalPages}
        />
      )}
    </section>
  );
}
