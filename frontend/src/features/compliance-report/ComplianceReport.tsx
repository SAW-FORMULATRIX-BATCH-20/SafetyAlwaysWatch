import { lazy, Suspense, useEffect, useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  Building2,
  Calendar,
  CalendarDays,
  Filter,
  FilterX,
  MapPin,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import { Button } from "../../components/ui/button";
import { EnsureQueryClient } from "../../providers/EnsureQueryClient";
import type { ComplianceReportingCapability, Employee } from "../../services/saw-service";
import { useComplianceReportQuery } from "../../hooks/queries/useComplianceReportQuery";
import { useComplianceReportStore } from "../../stores/useComplianceReportStore";

const ReportCharts = lazy(() =>
  import("./ReportCharts").then((module) => ({ default: module.ReportCharts }))
);

type ScoreStatus = "safe" | "warning" | "critical";

const scoreStatusLabels: Record<ScoreStatus, string> = {
  safe: "Safe",
  warning: "Warning",
  critical: "Critical",
};
const scoreStatusColors: Record<ScoreStatus, string> = {
  safe: "#10b981",
  warning: "#f59e0b",
  critical: "#f43f5e",
};

function employeeName(employee: Employee) {
  return employee.name ?? employee.id;
}

function reportDate(timestamp: string) {
  return timestamp.slice(0, 10);
}

function formatReportDate(timestamp: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(timestamp));
}

function scoreStatus(score: number, escalationThreshold: number): ScoreStatus {
  if (score < escalationThreshold) return "critical";
  if (score < escalationThreshold + 20) return "warning";
  return "safe";
}

export function ComplianceReport({
  service,
}: {
  service?: ComplianceReportingCapability;
}) {
  return (
    <EnsureQueryClient>
      <ComplianceReportContent service={service} />
    </EnsureQueryClient>
  );
}

function ComplianceReportContent({
  service,
}: {
  service?: ComplianceReportingCapability;
}) {
  const { report, isLoading, isError, refetch } = useComplianceReportQuery({ service });

  const zoneId = useComplianceReportStore((state) => state.zoneId);
  const setZoneId = useComplianceReportStore((state) => state.setZoneId);
  const departmentId = useComplianceReportStore((state) => state.departmentId);
  const setDepartmentId = useComplianceReportStore((state) => state.setDepartmentId);
  const employeeId = useComplianceReportStore((state) => state.employeeId);
  const setEmployeeId = useComplianceReportStore((state) => state.setEmployeeId);
  const fromDate = useComplianceReportStore((state) => state.fromDate);
  const setFromDate = useComplianceReportStore((state) => state.setFromDate);
  const toDate = useComplianceReportStore((state) => state.toDate);
  const setToDate = useComplianceReportStore((state) => state.setToDate);
  const clearFilters = useComplianceReportStore((state) => state.clearFilters);
  const reset = useComplianceReportStore((state) => state.reset);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const zones = useMemo(
    () => (report ? [...report.zones].sort((left, right) => left.name.localeCompare(right.name)) : []),
    [report]
  );

  const departments = useMemo(
    () => (report ? [...new Set(report.observations.map((observation) => observation.departmentId))].sort() : []),
    [report]
  );

  const employees = useMemo(
    () =>
      report
        ? report.employees.filter((employee) =>
            report.observations.some((observation) => observation.employeeId === employee.id)
          )
        : [],
    [report]
  );

  const filtered = useMemo(() => {
    if (!report) return [];
    return report.observations.filter((observation) => {
      const observedDate = reportDate(observation.observedAt);
      return (
        (zoneId === "all" || observation.zoneId === zoneId) &&
        (departmentId === "all" || observation.departmentId === departmentId) &&
        (employeeId === "all" || observation.employeeId === employeeId) &&
        (!fromDate || observedDate >= fromDate) &&
        (!toDate || observedDate <= toDate)
      );
    });
  }, [report, zoneId, departmentId, employeeId, fromDate, toDate]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (zoneId !== "all") count++;
    if (departmentId !== "all") count++;
    if (employeeId !== "all") count++;
    if (fromDate !== "") count++;
    if (toDate !== "") count++;
    return count;
  }, [zoneId, departmentId, employeeId, fromDate, toDate]);

  const hasFilters = activeFilterCount > 0;

  const compliantObservations = useMemo(
    () => filtered.filter((observation) => observation.isCompliant).length,
    [filtered]
  );

  const complianceRate = filtered.length
    ? Math.round((compliantObservations / filtered.length) * 100)
    : 0;

  const trend = useMemo(() => {
    return [...new Set(filtered.map((observation) => reportDate(observation.observedAt)))]
      .sort()
      .map((date) => {
        const observations = filtered.filter((observation) => reportDate(observation.observedAt) === date);
        const compliant = observations.filter((observation) => observation.isCompliant).length;
        return {
          date: formatReportDate(`${date}T00:00:00+07:00`),
          compliant,
          total: observations.length,
          rate: Math.round((compliant / observations.length) * 100),
        };
      });
  }, [filtered]);

  const ppeBreakdown = useMemo(() => {
    return [...new Set(filtered.map((observation) => observation.canonicalPpeClass))]
      .sort()
      .map((canonicalPpeClass) => {
        const observations = filtered.filter(
          (observation) => observation.canonicalPpeClass === canonicalPpeClass
        );
        return {
          canonicalPpeClass,
          compliant: observations.filter((observation) => observation.isCompliant).length,
          nonCompliant: observations.filter((observation) => !observation.isCompliant).length,
        };
      });
  }, [filtered]);

  const safetyDistribution = useMemo(() => {
    if (!report) return [];
    const latestScores = new Map<string, number>();
    [...filtered]
      .sort((left, right) => left.observedAt.localeCompare(right.observedAt))
      .forEach((observation) => {
        if (observation.employeeId) latestScores.set(observation.employeeId, observation.safetyScore);
      });

    return (Object.keys(scoreStatusLabels) as ScoreStatus[]).map((status) => ({
      status: scoreStatusLabels[status],
      count: [...latestScores.values()].filter(
        (score) => scoreStatus(score, report.escalationThreshold) === status
      ).length,
      color: scoreStatusColors[status],
    }));
  }, [filtered, report]);

  const sortedDates = useMemo(
    () => [...filtered].sort((left, right) => left.observedAt.localeCompare(right.observedAt)),
    [filtered]
  );

  const period = sortedDates.length
    ? `${formatReportDate(sortedDates[0].observedAt)} – ${formatReportDate(sortedDates[sortedDates.length - 1].observedAt)}`
    : "No period";

  const observationDates = useMemo(() => {
    if (!report?.observations.length) return { first: "", last: "" };
    const dates = [...new Set(report.observations.map((obs) => reportDate(obs.observedAt)))].sort();
    return { first: dates[0] ?? "", last: dates[dates.length - 1] ?? "" };
  }, [report]);

  if (isError) {
    return (
      <section aria-live="polite">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Operational analysis</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950">Compliance Report</h1>
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle aria-hidden="true" className="size-5 text-rose-600 shrink-0" />
            <p className="font-semibold text-rose-900">The Compliance Report could not be loaded.</p>
          </div>
          <p className="mt-2 text-sm text-rose-800">Please try again.</p>
          <Button className="mt-4 gap-1.5" onClick={() => void refetch()} variant="outline">
            <RotateCcw aria-hidden="true" className="size-3.5" />
            Try again
          </Button>
        </div>
      </section>
    );
  }

  if (isLoading || report === undefined) {
    return (
      <section aria-busy="true" aria-live="polite">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Operational analysis</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950">Compliance Report</h1>
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-slate-500 shadow-xs">
          <div className="size-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="text-sm font-medium">Loading Compliance Report…</p>
        </div>
      </section>
    );
  }

  if (!report.observations.length) {
    return (
      <section aria-live="polite">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Operational analysis</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950">Compliance Report</h1>
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-xs">
          <ShieldAlert aria-hidden="true" className="mx-auto size-8 text-slate-400" />
          <p className="mt-3 font-semibold text-slate-900">No PPE Compliance observations yet</p>
          <p className="mt-1 text-sm text-slate-600">
            Observation data is needed before safety trends and distributions can be shown.
          </p>
        </div>
      </section>
    );
  }

  const selectedEmployee = employees.find((e) => e.id === employeeId);
  const selectedZone = zones.find((z) => z.id === zoneId);

  return (
    <section>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Operational analysis</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950">
            Compliance Report
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            Review PPE Compliance trends, Canonical PPE Classes, and Safety Score conditions from the same observations.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <span className="rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-1.5 font-mono text-xs font-semibold tracking-[0.12em] text-amber-900 shadow-2xs">
            SIMULATION
          </span>
        </div>
      </div>

      {/* Modern Filter Panel */}
      <div className="mt-6 sm:mt-8 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-200/60">
              <Filter aria-hidden="true" className="size-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">Filter Observations</h2>
            {hasFilters ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                {activeFilterCount} Active
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                All Data
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {/* Hazardous Zone */}
          <label className="block text-xs font-medium text-slate-700">
            <span className="flex items-center gap-1.5 mb-1 text-slate-600">
              <MapPin aria-hidden="true" className="size-3.5 text-amber-600" />
              Hazardous Zones
            </span>
            <select
              aria-label="Report Hazardous Zone filter"
              className="h-9 w-full rounded-lg border border-slate-300 bg-slate-50/50 px-2.5 text-xs font-normal text-slate-900 transition-all hover:bg-white focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
              onChange={(event) => setZoneId(event.target.value)}
              value={zoneId}
            >
              <option value="all">All Hazardous Zones</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </label>

          {/* Department */}
          <label className="block text-xs font-medium text-slate-700">
            <span className="flex items-center gap-1.5 mb-1 text-slate-600">
              <Building2 aria-hidden="true" className="size-3.5 text-amber-600" />
              Department
            </span>
            <select
              aria-label="Report department filter"
              className="h-9 w-full rounded-lg border border-slate-300 bg-slate-50/50 px-2.5 text-xs font-normal text-slate-900 transition-all hover:bg-white focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
              onChange={(event) => setDepartmentId(event.target.value)}
              value={departmentId}
            >
              <option value="all">All departments</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>

          {/* Employee */}
          <label className="block text-xs font-medium text-slate-700">
            <span className="flex items-center gap-1.5 mb-1 text-slate-600">
              <Users aria-hidden="true" className="size-3.5 text-amber-600" />
              Employee
            </span>
            <select
              aria-label="Report Employee filter"
              className="h-9 w-full rounded-lg border border-slate-300 bg-slate-50/50 px-2.5 text-xs font-normal text-slate-900 transition-all hover:bg-white focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
              onChange={(event) => setEmployeeId(event.target.value)}
              value={employeeId}
            >
              <option value="all">All Employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employeeName(employee)}
                </option>
              ))}
            </select>
          </label>

          {/* From Date */}
          <label className="block text-xs font-medium text-slate-700">
            <span className="flex items-center justify-between mb-1 text-slate-600">
              <span className="flex items-center gap-1.5">
                <Calendar aria-hidden="true" className="size-3.5 text-amber-600" />
                From date
              </span>
            
            </span>
            <input
              aria-label="Report start date"
              className="h-9 w-full cursor-pointer rounded-lg border border-slate-300 bg-slate-50/50 px-2.5 text-xs font-normal text-slate-900 transition-all hover:bg-white hover:border-amber-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
              onChange={(event) => setFromDate(event.target.value)}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker?.();
                } catch {}
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  try {
                    e.currentTarget.showPicker?.();
                  } catch {}
                }
              }}
              title="Click here to open calendar picker"
              type="date"
              value={fromDate}
            />
          </label>

          {/* To Date */}
          <label className="block text-xs font-medium text-slate-700">
            <span className="flex items-center justify-between mb-1 text-slate-600">
              <span className="flex items-center gap-1.5">
                <Calendar aria-hidden="true" className="size-3.5 text-amber-600" />
                To date
              </span>
              
            </span>
            <input
              aria-label="Report end date"
              className="h-9 w-full cursor-pointer rounded-lg border border-slate-300 bg-slate-50/50 px-2.5 text-xs font-normal text-slate-900 transition-all hover:bg-white hover:border-amber-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
              onChange={(event) => setToDate(event.target.value)}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker?.();
                } catch {}
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  try {
                    e.currentTarget.showPicker?.();
                  } catch {}
                }
              }}
              title="Click here to open calendar picker"
              type="date"
              value={toDate}
            />
          </label>
        </div>

        {/* Quick Date Presets */}
        {observationDates.first && observationDates.last && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2.5 text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Quick date presets:</span>
            <button
              type="button"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
                !fromDate && !toDate
                  ? "bg-slate-200 text-slate-800 font-medium"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              All dates
            </button>
            <button
              type="button"
              onClick={() => {
                setFromDate(observationDates.last);
                setToDate(observationDates.last);
              }}
              className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
                fromDate === observationDates.last && toDate === observationDates.last
                  ? "bg-amber-100 text-amber-900 font-medium ring-1 ring-amber-300"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              Latest day ({formatReportDate(`${observationDates.last}T00:00:00+07:00`)})
            </button>
            <button
              type="button"
              onClick={() => {
                setFromDate(observationDates.first);
                setToDate(observationDates.last);
              }}
              className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
                fromDate === observationDates.first && toDate === observationDates.last
                  ? "bg-amber-100 text-amber-900 font-medium ring-1 ring-amber-300"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              Full range ({formatReportDate(`${observationDates.first}T00:00:00+07:00`)} – {formatReportDate(`${observationDates.last}T00:00:00+07:00`)})
            </button>
          </div>
        )}

        {/* Active Filter Badges */}
        {hasFilters && (
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-slate-400 mr-1">Applied:</span>
              {zoneId !== "all" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200/70">
                  <span className="text-slate-400 font-normal">Zone:</span>
                  <span className="text-slate-800 font-medium">{selectedZone?.name ?? zoneId}</span>
                  <button
                    type="button"
                    onClick={() => setZoneId("all")}
                    className="rounded-full p-0.5 text-slate-400 hover:bg-slate-300 hover:text-slate-700 focus:outline-none transition-colors"
                    aria-label="Remove zone filter"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              {departmentId !== "all" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200/70">
                  <span className="text-slate-400 font-normal">Dept:</span>
                  <span className="text-slate-800 font-medium">{departmentId}</span>
                  <button
                    type="button"
                    onClick={() => setDepartmentId("all")}
                    className="rounded-full p-0.5 text-slate-400 hover:bg-slate-300 hover:text-slate-700 focus:outline-none transition-colors"
                    aria-label="Remove department filter"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              {employeeId !== "all" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200/70">
                  <span className="text-slate-400 font-normal">Employee:</span>
                  <span className="text-slate-800 font-medium">
                    {selectedEmployee ? employeeName(selectedEmployee) : employeeId}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEmployeeId("all")}
                    className="rounded-full p-0.5 text-slate-400 hover:bg-slate-300 hover:text-slate-700 focus:outline-none transition-colors"
                    aria-label="Remove employee filter"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              {fromDate && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200/70">
                  <span className="text-slate-400 font-normal">From:</span>
                  <span className="text-slate-800 font-medium">{fromDate}</span>
                  <button
                    type="button"
                    onClick={() => setFromDate("")}
                    className="rounded-full p-0.5 text-slate-400 hover:bg-slate-300 hover:text-slate-700 focus:outline-none transition-colors"
                    aria-label="Remove from date filter"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              {toDate && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200/70">
                  <span className="text-slate-400 font-normal">To:</span>
                  <span className="text-slate-800 font-medium">{toDate}</span>
                  <button
                    type="button"
                    onClick={() => setToDate("")}
                    className="rounded-full p-0.5 text-slate-400 hover:bg-slate-300 hover:text-slate-700 focus:outline-none transition-colors"
                    aria-label="Remove to date filter"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors py-1 px-2 rounded-lg hover:bg-rose-50/60"
            >
              <RotateCcw className="size-3" />
              <span>Clear all</span>
            </button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-xs">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
            <FilterX aria-hidden="true" className="size-6" />
          </div>
          <p className="mt-4 font-semibold text-slate-900">No matching report results.</p>
          <p className="mt-1 max-w-sm text-sm text-slate-600">
            Change or clear filters to see PPE Compliance observations.
          </p>
          <Button className="mt-5 gap-1.5" onClick={clearFilters} variant="outline">
            <RotateCcw aria-hidden="true" className="size-3.5" />
            Clear report filters
          </Button>
        </div>
      ) : (
        <>
          {/* KPI Metric Cards */}
          <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {/* PPE Compliance Rate */}
            <article className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    PPE Compliance
                  </p>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 transition-colors group-hover:bg-emerald-100">
                    <ShieldCheck aria-hidden="true" className="size-4.5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">
                    {complianceRate}%
                  </span>
                  <span
                    className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ${
                      complianceRate >= 80
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : complianceRate >= 60
                        ? "bg-amber-50 text-amber-700 ring-amber-200"
                        : "bg-rose-50 text-rose-700 ring-rose-200"
                    }`}
                  >
                    {complianceRate >= 80 ? "Optimal" : complianceRate >= 60 ? "Warning" : "Critical"}
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      complianceRate >= 80
                        ? "bg-emerald-600"
                        : complianceRate >= 60
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, complianceRate))}%` }}
                  />
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {compliantObservations} compliant of {filtered.length} observations
              </p>
            </article>

            {/* Total Observations */}
            <article className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Report observations
                  </p>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-200/60 transition-colors group-hover:bg-blue-100">
                    <Activity aria-hidden="true" className="size-4.5" />
                  </div>
                </div>
                <p className="mt-3 font-mono text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">
                  {filtered.length}
                </p>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {filtered.length} PPE Compliance observations
              </p>
            </article>

            {/* Non-compliant Observations */}
            <article className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Non-compliant observations
                  </p>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700 ring-1 ring-rose-200/60 transition-colors group-hover:bg-rose-100">
                    <ShieldAlert aria-hidden="true" className="size-4.5" />
                  </div>
                </div>
                <p className="mt-3 font-mono text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">
                  {filtered.length - compliantObservations}
                </p>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Non-compliant PPE observations
              </p>
            </article>

            {/* Period */}
            <article className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Period
                  </p>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 ring-1 ring-slate-200 transition-colors group-hover:bg-slate-200">
                    <CalendarDays aria-hidden="true" className="size-4.5" />
                  </div>
                </div>
                <p className="mt-3 font-mono text-base sm:text-lg font-bold tracking-tight text-slate-950 truncate" title={period}>
                  {period}
                </p>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                WIB · active filters
              </p>
            </article>
          </div>

          <Suspense
            fallback={
              <div className="mt-8 flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-slate-500 shadow-xs">
                <div className="size-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                <p className="ml-3 text-sm font-medium">Loading report charts…</p>
              </div>
            }
          >
            <ReportCharts
              filteredObservationCount={filtered.length}
              period={period}
              ppeBreakdown={ppeBreakdown}
              safetyDistribution={safetyDistribution}
              trend={trend}
            />
          </Suspense>
        </>
      )}
    </section>
  );
}
