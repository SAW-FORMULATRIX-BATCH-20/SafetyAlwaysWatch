import { lazy, Suspense, useEffect, useState } from "react";

import { Button } from "../../components/ui/button";
import type { ComplianceReportData, ComplianceReportingCapability, Employee } from "../../services/saw-service";

const ReportCharts = lazy(() => import("./ReportCharts").then((module) => ({ default: module.ReportCharts })));

type ScoreStatus = "safe" | "warning" | "critical";

const scoreStatusLabels: Record<ScoreStatus, string> = { safe: "Safe", warning: "Warning", critical: "Critical" };
const scoreStatusColors: Record<ScoreStatus, string> = { safe: "#047857", warning: "#b45309", critical: "#b91c1c" };

function employeeName(employee: Employee) {
  return employee.name ?? employee.id;
}

function reportDate(timestamp: string) {
  return timestamp.slice(0, 10);
}

function formatReportDate(timestamp: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "Asia/Jakarta" }).format(new Date(timestamp));
}

function scoreStatus(score: number, escalationThreshold: number): ScoreStatus {
  if (score < escalationThreshold) return "critical";
  if (score < escalationThreshold + 20) return "warning";
  return "safe";
}

export function ComplianceReport({ service }: { service: ComplianceReportingCapability }) {
  const [report, setReport] = useState<ComplianceReportData>();
  const [hasError, setHasError] = useState(false);
  const [zoneId, setZoneId] = useState("all");
  const [departmentId, setDepartmentId] = useState("all");
  const [employeeId, setEmployeeId] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    let active = true;
    service.getComplianceReport().then((nextReport) => {
      if (active) setReport(nextReport);
    }).catch(() => {
      if (active) setHasError(true);
    });
    return () => { active = false; };
  }, [service]);

  const clearFilters = () => {
    setZoneId("all"); setDepartmentId("all"); setEmployeeId("all"); setFromDate(""); setToDate("");
  };

  if (hasError) return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Compliance Report</h1><div className="mt-6 border border-red-200 bg-red-50 p-6"><p className="font-medium text-red-900">The Compliance Report could not be loaded.</p><p className="mt-1 text-sm text-red-800">Please try again.</p></div></section>;
  if (report === undefined) return <section aria-busy="true" aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Compliance Report</h1><p className="mt-6 text-slate-600">Loading Compliance Report…</p></section>;
  if (!report.observations.length) return <section aria-live="polite"><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Compliance Report</h1><div className="mt-6 border border-dashed border-slate-300 bg-white p-6"><p className="font-medium text-slate-900">No PPE Compliance observations yet</p><p className="mt-1 text-sm text-slate-600">Observation data is needed before safety trends and distributions can be shown.</p></div></section>;

  const zones = [...report.zones].sort((left, right) => left.name.localeCompare(right.name));
  const departments = [...new Set(report.observations.map((observation) => observation.departmentId))].sort();
  const employees = report.employees.filter((employee) => report.observations.some((observation) => observation.employeeId === employee.id));
  const filtered = report.observations.filter((observation) => {
    const observedDate = reportDate(observation.observedAt);
    return (zoneId === "all" || observation.zoneId === zoneId)
      && (departmentId === "all" || observation.departmentId === departmentId)
      && (employeeId === "all" || observation.employeeId === employeeId)
      && (!fromDate || observedDate >= fromDate) && (!toDate || observedDate <= toDate);
  });
  const hasFilters = [zoneId, departmentId, employeeId].some((value) => value !== "all") || fromDate !== "" || toDate !== "";
  const compliantObservations = filtered.filter((observation) => observation.isCompliant).length;
  const complianceRate = filtered.length ? Math.round((compliantObservations / filtered.length) * 100) : 0;
  const trend = [...new Set(filtered.map((observation) => reportDate(observation.observedAt)))].sort().map((date) => {
    const observations = filtered.filter((observation) => reportDate(observation.observedAt) === date);
    const compliant = observations.filter((observation) => observation.isCompliant).length;
    return { date: formatReportDate(`${date}T00:00:00+07:00`), compliant, total: observations.length, rate: Math.round((compliant / observations.length) * 100) };
  });
  const ppeBreakdown = [...new Set(filtered.map((observation) => observation.canonicalPpeClass))].sort().map((canonicalPpeClass) => {
    const observations = filtered.filter((observation) => observation.canonicalPpeClass === canonicalPpeClass);
    return { canonicalPpeClass, compliant: observations.filter((observation) => observation.isCompliant).length, nonCompliant: observations.filter((observation) => !observation.isCompliant).length };
  });
  const latestScores = new Map<string, number>();
  [...filtered].sort((left, right) => left.observedAt.localeCompare(right.observedAt)).forEach((observation) => {
    if (observation.employeeId) latestScores.set(observation.employeeId, observation.safetyScore);
  });
  const safetyDistribution = (Object.keys(scoreStatusLabels) as ScoreStatus[]).map((status) => ({
    status: scoreStatusLabels[status],
    count: [...latestScores.values()].filter((score) => scoreStatus(score, report.escalationThreshold) === status).length,
    color: scoreStatusColors[status],
  }));
  const sortedDates = [...filtered].sort((left, right) => left.observedAt.localeCompare(right.observedAt));
  const period = sortedDates.length ? `${formatReportDate(sortedDates[0].observedAt)} – ${formatReportDate(sortedDates[sortedDates.length - 1].observedAt)}` : "No period";

  return <section>
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Operational analysis</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Compliance Report</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Review PPE Compliance trends, Canonical PPE Classes, and Safety Score conditions from the same observations.</p></div><span className="border border-amber-300 bg-amber-50 px-3 py-2 font-mono text-xs font-medium tracking-[0.12em] text-amber-950">SIMULATION</span></div>
    <div className="mt-8 grid gap-3 border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-3">
      <label className="block text-sm font-medium text-slate-800">Hazardous Zones<select aria-label="Report Hazardous Zone filter" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => setZoneId(event.target.value)} value={zoneId}><option value="all">All Hazardous Zones</option>{zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label>
      <label className="block text-sm font-medium text-slate-800">Department<select aria-label="Report department filter" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => setDepartmentId(event.target.value)} value={departmentId}><option value="all">All departments</option>{departments.map((department) => <option key={department} value={department}>{department}</option>)}</select></label>
      <label className="block text-sm font-medium text-slate-800">Employee<select aria-label="Report Employee filter" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => setEmployeeId(event.target.value)} value={employeeId}><option value="all">All Employees</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employeeName(employee)}</option>)}</select></label>
      <label className="block text-sm font-medium text-slate-800">From date<input aria-label="Report start date" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => setFromDate(event.target.value)} type="date" value={fromDate} /></label>
      <label className="block text-sm font-medium text-slate-800">To date<input aria-label="Report end date" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200" onChange={(event) => setToDate(event.target.value)} type="date" value={toDate} /></label>
      <div className="flex items-end">{hasFilters && filtered.length > 0 && <Button onClick={clearFilters} variant="outline">Clear report filters</Button>}</div>
    </div>
    {filtered.length === 0 ? <div className="mt-5 border border-dashed border-slate-300 bg-white p-6"><p className="font-medium text-slate-900">No matching report results.</p><p className="mt-1 text-sm text-slate-600">Change or clear filters to see PPE Compliance observations.</p><Button className="mt-4" onClick={clearFilters} variant="outline">Clear report filters</Button></div> : <><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><article className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">PPE Compliance</p><p className="mt-2 font-mono text-3xl font-semibold text-slate-950">{complianceRate}%</p><p className="mt-2 text-sm text-slate-600">{compliantObservations} compliant of {filtered.length} observations</p></article><article className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Report observations</p><p className="mt-2 font-mono text-3xl font-semibold text-slate-950">{filtered.length}</p><p className="mt-2 text-sm text-slate-600">{filtered.length} PPE Compliance observations</p></article><article className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Non-compliant observations</p><p className="mt-2 font-mono text-3xl font-semibold text-slate-950">{filtered.length - compliantObservations}</p><p className="mt-2 text-sm text-slate-600">Non-compliant PPE observations</p></article><article className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Period</p><p className="mt-2 font-mono text-lg font-semibold text-slate-950">{period}</p><p className="mt-2 text-sm text-slate-600">WIB · active filters</p></article></div><Suspense fallback={<p aria-busy="true" className="mt-8 text-sm text-slate-600">Loading report charts…</p>}><ReportCharts ppeBreakdown={ppeBreakdown} filteredObservationCount={filtered.length} period={period} safetyDistribution={safetyDistribution} trend={trend} /></Suspense></>}
  </section>;
}
