import {
  ArrowDownUp,
  Building2,
  Calendar,
  Camera,
  ChevronDown,
  Clock,
  Eye,
  MapPin,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
} from "lucide-react";

import { Button } from "../../components/ui/button";
import { Pagination } from "../../components/ui/pagination";
import { AccessibleDialog } from "../../shared/AccessibleDialog";
import { EnsureQueryClient } from "../../providers/EnsureQueryClient";
import type {
  Camera as CameraType,
  Employee,
  HazardousZoneWithViolationHistory,
  ViolationRecord,
} from "../../services/saw-service";
import { formatRelativeWib, formatWib } from "../../shared/formatters";
import {
  useViolationsQuery,
  type ViolationHistoryData,
  type ViolationHistoryService,
} from "../../hooks/queries/useViolationsQuery";
import {
  useViolationsStore,
  type ViolationSort,
} from "../../stores/useViolationsStore";

export type { ViolationHistoryData, ViolationHistoryService };
export type Sort = ViolationSort;

const statusLabels: Record<ViolationRecord["status"], string> = {
  confirmed: "Violation",
  clearing: "Clearing",
  cleared: "Cleared",
};

const employeeName = (employee: Employee) =>
  employee.name ?? `Employee ${employee.id}`;

function ViolationEventDetails({
  violation,
  employee,
  camera,
  zone,
  onClose,
}: {
  violation: ViolationRecord;
  employee?: Employee;
  camera?: CameraType;
  zone?: HazardousZoneWithViolationHistory;
  onClose: () => void;
}) {
  const statusBadgeColor =
    violation.status === "confirmed"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : violation.status === "clearing"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <AccessibleDialog
      label={`Violation Event details ${violation.id}`}
      onDismiss={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700 font-semibold">
                Audit record
              </span>
            </div>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              Violation Event details
            </h2>
            <p className="mt-1 font-mono text-xs sm:text-sm text-slate-500">
              {violation.id} · {violation.episodeId ?? "Demo Violation Episode"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeColor}`}
            >
              {statusLabels[violation.status]}
            </span>
            <button
              aria-label="Close details"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
              onClick={onClose}
              type="button"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">
          <p className="border-l-2 border-amber-400 pl-3.5 text-sm leading-6 text-slate-700 bg-amber-50/40 py-2 rounded-r-lg">
            The audit trail records metadata, a timeline, and Safety Score changes.
          </p>

          <dl className="grid gap-3.5 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
              <dt className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <User className="size-3.5 text-slate-400" /> Identity
              </dt>
              <dd className="mt-1 font-semibold text-slate-950 truncate">
                {employee ? employeeName(employee) : "Unknown"}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
              <dt className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <MapPin className="size-3.5 text-slate-400" /> Hazardous Zone
              </dt>
              <dd className="mt-1 font-medium text-slate-950 truncate">
                {zone?.name ?? violation.zoneId ?? "Unavailable"}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
              <dt className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Camera className="size-3.5 text-slate-400" /> Camera Source
              </dt>
              <dd className="mt-1 font-medium text-slate-950 truncate">
                {camera
                  ? `${camera.name} · ${camera.location}`
                  : (violation.cameraId ?? "Unavailable")}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
              <dt className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <ShieldAlert className="size-3.5 text-slate-400" /> Missing Canonical PPE Classes
              </dt>
              <dd className="mt-1 font-medium text-rose-700 truncate">
                {violation.missingCanonicalPpeClasses?.join(", ") || "Unavailable"}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
              <dt className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-slate-400" /> Detection Confidence
              </dt>
              <dd className="mt-1 font-mono font-medium text-slate-950">
                {violation.confidence === undefined
                  ? "Unavailable"
                  : `${Math.round(violation.confidence * 100)}%`}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
              <dt className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <ArrowDownUp className="size-3.5 text-slate-400" /> Safety Score change
              </dt>
              <dd className="mt-1 font-mono font-medium text-slate-950">
                {violation.scoreChange
                  ? `${violation.scoreChange.before} → ${violation.scoreChange.after}`
                  : "Not applied to Unknown"}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
              <dt className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Clock className="size-3.5 text-slate-400" /> Detected
              </dt>
              <dd className="mt-1 font-mono text-xs font-medium text-slate-950">
                {violation.detectedAt
                  ? `${formatWib(violation.detectedAt)} · ${formatRelativeWib(violation.detectedAt)}`
                  : "Unavailable"}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
              <dt className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Calendar className="size-3.5 text-slate-400" /> Latest audit
              </dt>
              <dd className="mt-1 font-mono text-xs font-medium text-slate-950">
                {violation.updatedAt
                  ? `${formatWib(violation.updatedAt)} · ${formatRelativeWib(violation.updatedAt)}`
                  : "Unavailable"}
              </dd>
            </div>
          </dl>

          <div className="grid gap-6 lg:grid-cols-2 border-t border-slate-100 pt-6">
            <section>
              <h3 className="text-base font-semibold text-slate-950 flex items-center gap-2">
                <Clock className="size-4 text-amber-600" />
                Violation Episode timeline
              </h3>
              {violation.timeline?.length ? (
                <ol className="mt-4 space-y-4 border-l-2 border-amber-200 pl-4 ml-2">
                  {violation.timeline.map((entry, index) => (
                    <li className="relative" key={`${entry.occurredAt}-${index}`}>
                      <div className="absolute -left-[23px] top-1.5 size-2.5 rounded-full border-2 border-white bg-amber-500" />
                      <p className="text-sm font-semibold text-slate-950">
                        {entry.status === "candidate"
                          ? "Pending Confirmation"
                          : statusLabels[entry.status]}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-600">
                        {entry.description}
                      </p>
                      <p className="mt-1 font-mono text-xs text-slate-400 flex items-center gap-1">
                        {formatWib(entry.occurredAt)}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-4 text-sm text-slate-500 italic">
                  No timeline is available.
                </p>
              )}
            </section>

            <section>
              <h3 className="text-base font-semibold text-slate-950 flex items-center gap-2">
                <Building2 className="size-4 text-amber-600" />
                Notification recipients
              </h3>
              {violation.notificationRecipients?.length ? (
                <ul className="mt-4 space-y-2.5">
                  {violation.notificationRecipients.map((recipient) => (
                    <li
                      className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/50 p-3.5 text-sm transition-colors hover:bg-slate-50"
                      key={`${recipient.role}-${recipient.name}`}
                    >
                      <div>
                        <p className="font-semibold text-slate-950">{recipient.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {recipient.role}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 font-mono text-[11px] font-medium text-slate-700">
                        {recipient.deliveryStatus}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-500 italic">
                  No simulated recipients.
                </p>
              )}
            </section>
          </div>
        </div>
      
      </div>
    </AccessibleDialog>
  );
}

export function Violations({ service }: { service?: ViolationHistoryService }) {
  return (
    <EnsureQueryClient>
      <ViolationsContent service={service} />
    </EnsureQueryClient>
  );
}

function ViolationsContent({
  service,
}: {
  service?: ViolationHistoryService;
}) {
  const { data, isLoading, isError, error } = useViolationsQuery({ service });

  const query = useViolationsStore((state) => state.query);
  const setQuery = useViolationsStore((state) => state.setQuery);
  const zoneId = useViolationsStore((state) => state.zoneId);
  const setZoneId = useViolationsStore((state) => state.setZoneId);
  const cameraId = useViolationsStore((state) => state.cameraId);
  const employeeId = useViolationsStore((state) => state.employeeId);
  const department = useViolationsStore((state) => state.department);
  const setDepartment = useViolationsStore((state) => state.setDepartment);
  const status = useViolationsStore((state) => state.status);
  const startDate = useViolationsStore((state) => state.startDate);
  const setStartDate = useViolationsStore((state) => state.setStartDate);
  const endDate = useViolationsStore((state) => state.endDate);
  const setEndDate = useViolationsStore((state) => state.setEndDate);
  const sort = useViolationsStore((state) => state.sort);
  const setSort = useViolationsStore((state) => state.setSort);
  const page = useViolationsStore((state) => state.page);
  const setPage = useViolationsStore((state) => state.setPage);
  const pageSize = useViolationsStore((state) => state.pageSize);
  const setPageSize = useViolationsStore((state) => state.setPageSize);
  const selectedId = useViolationsStore((state) => state.selectedId);
  const setSelectedId = useViolationsStore((state) => state.setSelectedId);
  const clearFilters = useViolationsStore((state) => state.clearFilters);

  if (isError) {
    return (
      <section aria-live="polite">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700 font-semibold">
            Operational audit
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Violation History
        </h1>
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/90 p-6 text-red-900 shadow-xs">
          <div className="flex items-center gap-3">
            <ShieldAlert className="size-5 text-red-600 shrink-0" />
            <p className="font-semibold text-red-900">
              Violation History could not be loaded
            </p>
          </div>
          <p className="mt-2 text-sm text-red-800">
            {error instanceof Error
              ? error.message
              : "Violation History could not be loaded."}
          </p>
        </div>
      </section>
    );
  }

  if (isLoading || !data) {
    return (
      <section aria-busy="true" aria-live="polite">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700 font-semibold">
            Operational audit
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Violation History
        </h1>
        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="size-5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Loading Violation History…</p>
        </div>
      </section>
    );
  }

  const employeeFor = (violation: ViolationRecord) =>
    data.employees.find((employee) => employee.id === violation.employeeId);
  const zoneFor = (violation: ViolationRecord) =>
    data.zones.find((zone) => zone.id === violation.zoneId);
  const cameraFor = (violation: ViolationRecord) =>
    data.cameras.find((camera) => camera.id === violation.cameraId);
  const normalizedQuery = query.trim().toLowerCase();
  const departments = [
    ...new Set(data.employees.map((employee) => employee.departmentId)),
  ].sort();
  const filtered = data.violations
    .filter((violation) => {
      const employee = employeeFor(violation);
      const searchable = [
        violation.id,
        violation.episodeId,
        employee ? employeeName(employee) : "Unknown",
        cameraFor(violation)?.name,
        zoneFor(violation)?.name,
        violation.missingCanonicalPpeClasses?.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const date = violation.detectedAt?.slice(0, 10) ?? "";
      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (zoneId === "all" || violation.zoneId === zoneId) &&
        (cameraId === "all" || violation.cameraId === cameraId) &&
        (employeeId === "all" ||
          (employeeId === "unidentified"
            ? !violation.employeeId
            : violation.employeeId === employeeId)) &&
        (department === "all" || employee?.departmentId === department) &&
        (status === "all" || violation.status === status) &&
        (!startDate || date >= startDate) &&
        (!endDate || date <= endDate)
      );
    })
    .sort((left, right) =>
      sort === "confidence-desc"
        ? (right.confidence ?? 0) - (left.confidence ?? 0)
        : (sort === "newest" ? -1 : 1) *
          (left.detectedAt ?? "").localeCompare(right.detectedAt ?? ""),
    );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = data.violations.find(
    (violation) => violation.id === selectedId,
  );
  const activeFilterCount = [
    Boolean(query),
    zoneId !== "all",
    department !== "all",
    Boolean(startDate || endDate),
  ].filter(Boolean).length;

  return (
    <section>
      {/* Header Section - Compact & Streamlined */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              Violation History
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/80 px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-amber-800">
              <ShieldAlert className="size-3 text-amber-600" />
              Operational audit
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Investigate confirmed Violation Events through metadata and the audit timeline.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-rose-500" />
            </span>
            {data.violations.length} Violation Events
          </span>
        </div>
      </div>

      {/* Filter and Search Panel - 2-Row Spacious & Compact Layout */}
      <div className="mt-3 rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs">
        {/* Row 1: Search & Core Filters */}
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-12 items-end">
          {/* Search: 6 cols on lg */}
          <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:col-span-2 lg:col-span-6">
            Search
            <div className="relative flex items-center">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-2.5 size-3.5 text-slate-400"
              />
              <input
                aria-label="Search Violation History"
                className="h-8 w-full rounded-md border border-slate-300 bg-slate-50/50 pl-8 pr-7 text-xs font-normal normal-case text-slate-900 transition-colors placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
                placeholder="Search ID, episode, employee, zone, PPE..."
                value={query}
              />
              {query && (
                <button
                  aria-label="Clear search input"
                  className="absolute right-2 text-slate-400 hover:text-slate-600"
                  onClick={() => setQuery("")}
                  type="button"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </label>

          {/* Hazardous Zone: 3 cols on lg */}
          <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 lg:col-span-3">
            Hazardous Zone
            <div className="relative flex items-center">
              <MapPin
                aria-hidden="true"
                className="pointer-events-none absolute left-2.5 size-3.5 text-slate-400"
              />
              <select
                aria-label="Hazardous Zone filter"
                className="h-8 w-full appearance-none rounded-md border border-slate-300 bg-slate-50/50 pl-8 pr-6 text-xs font-normal normal-case text-slate-900 transition-colors focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500/20 truncate"
                onChange={(event) => {
                  setZoneId(event.target.value);
                }}
                value={zoneId}
              >
                <option value="all">All Hazardous Zones</option>
                {data.zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-2 size-3 text-slate-400"
              />
            </div>
          </label>

          {/* Department: 3 cols on lg */}
          <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 lg:col-span-3">
            Department
            <div className="relative flex items-center">
              <Building2
                aria-hidden="true"
                className="pointer-events-none absolute left-2.5 size-3.5 text-slate-400"
              />
              <select
                aria-label="Department filter"
                className="h-8 w-full appearance-none rounded-md border border-slate-300 bg-slate-50/50 pl-8 pr-6 text-xs font-normal normal-case text-slate-900 transition-colors focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500/20 truncate"
                onChange={(event) => {
                  setDepartment(event.target.value);
                }}
                value={department}
              >
                <option value="all">All departments</option>
                {departments.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-2 size-3 text-slate-400"
              />
            </div>
          </label>
        </div>

        {/* Row 2: Date Range, Sort, Rows & Reset */}
        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-12 items-end pt-2.5 border-t border-slate-100">
          {/* Date Range: 5 cols on lg */}
          <div className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:col-span-2 lg:col-span-5">
            <span className="flex items-center gap-1">
              <Calendar className="size-3 text-slate-400" />
              Date Range
            </span>
            <div className="flex items-center gap-1.5">
              <input
                aria-label="Violation start date"
                className="h-8 flex-1 min-w-[120px] rounded-md border border-slate-300 bg-slate-50/50 px-2 text-xs font-normal text-slate-900 transition-colors focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                onChange={(event) => {
                  setStartDate(event.target.value);
                }}
                type="date"
                value={startDate}
              />
              <span className="text-slate-400 text-xs font-medium shrink-0">–</span>
              <input
                aria-label="Violation end date"
                className="h-8 flex-1 min-w-[120px] rounded-md border border-slate-300 bg-slate-50/50 px-2 text-xs font-normal text-slate-900 transition-colors focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                onChange={(event) => {
                  setEndDate(event.target.value);
                }}
                type="date"
                value={endDate}
              />
            </div>
          </div>

          {/* Sort: 4 cols on lg */}
          <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 lg:col-span-4">
            <span className="flex items-center gap-1">
              <ArrowDownUp
                aria-hidden="true"
                className="size-2.5 text-slate-400"
              />
              Sort By
            </span>
            <div className="relative flex items-center">
              <ArrowDownUp
                aria-hidden="true"
                className="pointer-events-none absolute left-2.5 size-3.5 text-slate-400"
              />
              <select
                aria-label="Violation history sort"
                className="h-8 w-full appearance-none rounded-md border border-slate-300 bg-slate-50/50 pl-8 pr-6 text-xs font-normal normal-case text-slate-900 transition-colors focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500/20 truncate"
                onChange={(event) => {
                  setSort(event.target.value as ViolationSort);
                }}
                value={sort}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="confidence-desc">Highest Confidence</option>
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-2 size-3 text-slate-400"
              />
            </div>
          </label>

          {/* Page size & Clear: 3 cols on lg */}
          <div className="flex items-end gap-2 lg:col-span-3">
            <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex-1">
              Per Page
              <div className="relative flex items-center">
                <select
                  aria-label="Items per page"
                  className="h-8 w-full appearance-none rounded-md border border-slate-300 bg-slate-50/50 pl-2 pr-6 text-xs font-normal normal-case text-slate-900 transition-colors focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                  onChange={(event) => setPageSize(Number(event.target.value))}
                  value={pageSize}
                >
                  <option value={10}>10 rows</option>
                  <option value={25}>25 rows</option>
                  <option value={50}>50 rows</option>
                  <option value={100}>100 rows</option>
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 size-3 text-slate-400"
                />
              </div>
            </label>

            <Button
              aria-label="Clear filters"
              className="h-8 px-2.5 text-xs text-slate-700 hover:border-slate-400 hover:text-slate-950 shrink-0 gap-1"
              onClick={clearFilters}
              size="sm"
              title="Clear filters"
              variant="outline"
            >
              <RotateCcw aria-hidden="true" className="size-3 text-slate-500" />
              <span>Reset</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main List / Empty states */}
      {data.violations.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-2xs">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <ShieldCheck className="size-5" />
          </div>
          <p className="mt-3 font-semibold text-slate-900">No Violation Events</p>
          <p className="mt-1 text-xs text-slate-500">
            All hazardous zones and workers are fully compliant with safety requirements.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-2xs">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Search className="size-5" />
          </div>
          <p className="mt-3 font-semibold text-slate-900">No matching Violation Events.</p>
          <p className="mt-1 text-xs text-slate-500">
            Try adjusting your search criteria or clear the active filters.
          </p>
          <Button
            className="mt-3 h-8 gap-1.5 text-xs"
            onClick={clearFilters}
            size="sm"
            variant="outline"
          >
            <RotateCcw className="size-3" />
            Clear filters
          </Button>
        </div>
      ) : (
        <div
          aria-label="Violation history"
          className="mt-3 space-y-2"
          role="list"
        >
          {visible.map((violation) => {
            const employee = employeeFor(violation);
            const zone = zoneFor(violation);
            const camera = cameraFor(violation);
            const isSelected = violation.id === selectedId;

            const badgeStyles =
              violation.status === "confirmed"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : violation.status === "clearing"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200";

            return (
              <article
                className={`group relative flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-lg border px-3.5 py-2.5 transition-all duration-150 bg-white shadow-2xs hover:shadow-xs hover:border-amber-300 ${
                  isSelected
                    ? "border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20"
                    : "border-slate-200/90"
                }`}
                key={violation.id}
                role="listitem"
              >
                {/* Left primary information: Status, ID, Employee, Zone, Camera */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 flex-1 min-w-0">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badgeStyles}`}
                  >
                    {statusLabels[violation.status]}
                  </span>

                  <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                    {violation.id}
                  </span>

                  <div className="flex items-center gap-1.5 min-w-[130px]">
                    <span className="text-sm font-semibold text-slate-950 truncate">
                      {employee ? employeeName(employee) : "Unknown"}
                    </span>
                    {employee?.departmentId && (
                      <span className="text-xs text-slate-500">
                        · {employee.departmentId}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3 text-slate-400" />
                      {zone?.name ?? violation.zoneId}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1">
                      <Camera className="size-3 text-slate-400" />
                      {camera?.name ?? violation.cameraId}
                    </span>
                  </div>

                  {violation.missingCanonicalPpeClasses &&
                    violation.missingCanonicalPpeClasses.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-100 px-1.5 py-0.5 text-[11px] font-medium text-rose-700">
                        <ShieldAlert className="size-3 text-rose-500" />
                        Missing: {violation.missingCanonicalPpeClasses.join(", ")}
                      </span>
                    )}
                </div>

                {/* Right metadata and action button */}
                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {violation.confidence !== undefined && (
                      <span className="font-mono text-[11px] text-slate-500">
                        {Math.round(violation.confidence * 100)}%
                      </span>
                    )}
                    {violation.detectedAt && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="size-3 text-slate-400" />
                        {formatRelativeWib(violation.detectedAt)}
                      </span>
                    )}
                  </div>

                  <Button
                    aria-label={`View details ${violation.id}`}
                    className="h-7 gap-1 px-2.5 text-xs hover:border-amber-400 hover:bg-amber-50/50 hover:text-amber-900"
                    onClick={() => setSelectedId(violation.id)}
                    size="sm"
                    variant="outline"
                  >
                    <Eye className="size-3 text-slate-500" />
                    View details
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination & Status Footer */}
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <p className="font-medium text-slate-700">
            {filtered.length
              ? `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length} Violation Events`
              : "No matching Violation Events."}
          </p>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
              {activeFilterCount} active
            </span>
          )}
        </div>

        {filtered.length > pageSize && (
          <Pagination
            ariaLabel="Violation pagination"
            currentPage={currentPage}
            onPageChange={(nextPage) => {
              setPage(nextPage);
              setSelectedId(undefined);
            }}
            totalPages={totalPages}
          />
        )}
      </div>

      {/* Selected Details Pop-up Modal */}
      {selected && (
        <ViolationEventDetails
          camera={cameraFor(selected)}
          employee={employeeFor(selected)}
          onClose={() => setSelectedId(undefined)}
          violation={selected}
          zone={zoneFor(selected)}
        />
      )}
    </section>
  );
}
