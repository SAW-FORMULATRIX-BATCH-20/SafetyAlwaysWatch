import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "../../components/ui/button";
import type {
  Camera,
  Employee,
  EmployeeDirectoryData,
  HazardousZoneWithViolationHistory,
  ViolationRecord,
} from "../../services/saw-service";
import { formatRelativeWib, formatWib } from "../../shared/formatters";

type ViolationHistoryService = {
  getCameras(): Promise<Camera[]>;
  getEmployeeDirectory(): Promise<EmployeeDirectoryData>;
  getHazardousZone(): Promise<HazardousZoneWithViolationHistory[]>;
  getViolationHistory(): Promise<ViolationRecord[]>;
};
type ViolationHistoryData = {
  cameras: Camera[];
  employees: Employee[];
  violations: ViolationRecord[];
  zones: HazardousZoneWithViolationHistory[];
};
type Sort = "oldest" | "newest" | "confidence-desc";

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
}: {
  violation: ViolationRecord;
  employee?: Employee;
  camera?: Camera;
  zone?: HazardousZoneWithViolationHistory;
}) {
  return (
    <section
      aria-label={`Violation Event details ${violation.id}`}
      className="mt-6 border border-slate-200 bg-white p-5 sm:p-6"
      role="region"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">
            Audit record
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Violation Event details
          </h2>
          <p className="mt-2 font-mono text-sm text-slate-600">
            {violation.id} · {violation.episodeId ?? "Demo Violation Episode"}
          </p>
        </div>
        <span className="border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium">
          {statusLabels[violation.status]}
        </span>
      </div>
      <p className="mt-5 border-l-2 border-amber-400 pl-3 text-sm leading-6 text-slate-700">
        The audit trail records metadata, a timeline, and Safety Score changes.
      </p>
      <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2 xl:grid-cols-3">
        <div>
          <dt className="text-slate-500">Identity</dt>
          <dd className="mt-1 font-medium text-slate-950">
            {employee ? employeeName(employee) : "Unknown"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Hazardous Zone</dt>
          <dd className="mt-1 text-slate-950">
            {zone?.name ?? violation.zoneId ?? "Unavailable"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Camera Source</dt>
          <dd className="mt-1 text-slate-950">
            {camera
              ? `${camera.name} · ${camera.location}`
              : (violation.cameraId ?? "Unavailable")}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Missing Canonical PPE Classes</dt>
          <dd className="mt-1 text-slate-950">
            {violation.missingCanonicalPpeClasses?.join(", ") || "Unavailable"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Detection Confidence</dt>
          <dd className="mt-1 font-mono text-slate-950">
            {violation.confidence === undefined
              ? "Unavailable"
              : `${Math.round(violation.confidence * 100)}%`}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Safety Score change</dt>
          <dd className="mt-1 font-mono text-slate-950">
            {violation.scoreChange
              ? `${violation.scoreChange.before} → ${violation.scoreChange.after}`
              : "Not applied to Unknown"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Detected</dt>
          <dd className="mt-1 font-mono text-slate-950">
            {violation.detectedAt
              ? `${formatWib(violation.detectedAt)} · ${formatRelativeWib(violation.detectedAt)}`
              : "Unavailable"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Latest audit</dt>
          <dd className="mt-1 font-mono text-slate-950">
            {violation.updatedAt
              ? `${formatWib(violation.updatedAt)} · ${formatRelativeWib(violation.updatedAt)}`
              : "Unavailable"}
          </dd>
        </div>
      </dl>
      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <section>
          <h3 className="font-semibold text-slate-950">
            Violation Episode timeline
          </h3>
          {violation.timeline?.length ? (
            <ol className="mt-4 space-y-4 border-l border-slate-200 pl-4">
              {violation.timeline.map((entry, index) => (
                <li key={`${entry.occurredAt}-${index}`}>
                  <p className="text-sm font-medium text-slate-950">
                    {entry.status === "candidate"
                      ? "Pending Confirmation"
                      : statusLabels[entry.status]}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {entry.description}
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-500">
                    {formatWib(entry.occurredAt)}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-slate-600">
              No timeline is available.
            </p>
          )}
        </section>
        <section>
          <h3 className="font-semibold text-slate-950">
            Notification recipients
          </h3>
          {violation.notificationRecipients?.length ? (
            <ul className="mt-4 space-y-3">
              {violation.notificationRecipients.map((recipient) => (
                <li
                  className="border border-slate-200 p-3 text-sm"
                  key={`${recipient.role}-${recipient.name}`}
                >
                  <p className="font-medium text-slate-950">{recipient.name}</p>
                  <p className="mt-1 text-slate-600">
                    {recipient.role} · {recipient.deliveryStatus}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-600">
              No simulated recipients.
            </p>
          )}
        </section>
      </div>
    </section>
  );
}

export function Violations({ service }: { service: ViolationHistoryService }) {
  const [data, setData] = useState<ViolationHistoryData>();
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState("");
  const [zoneId, setZoneId] = useState("all");
  const [cameraId, setCameraId] = useState("all");
  const [employeeId, setEmployeeId] = useState("all");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState<ViolationRecord["status"] | "all">(
    "all",
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState<Sort>("oldest");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string>();
  useEffect(() => {
    let active = true;
    Promise.all([
      service.getViolationHistory(),
      service.getCameras(),
      service.getHazardousZone(),
      service.getEmployeeDirectory(),
    ])
      .then(([violations, cameras, zones, directory]) => {
        if (active)
          setData({
            violations,
            cameras,
            zones,
            employees: directory.employees,
          });
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "Violation History could not be loaded.",
          );
      });
    return () => {
      active = false;
    };
  }, [service]);
  if (error)
    return (
      <section aria-live="polite">
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Violation History
        </h1>
        <div className="mt-6 border border-red-200 bg-red-50 p-6">
          <p className="font-medium text-red-900">
            Violation History could not be loaded
          </p>
          <p className="mt-1 text-sm text-red-800">{error}</p>
        </div>
      </section>
    );
  if (!data)
    return (
      <section aria-busy="true" aria-live="polite">
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Violation History
        </h1>
        <p className="mt-6 text-slate-600">Loading Violation History…</p>
      </section>
    );
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
  const totalPages = Math.max(1, Math.ceil(filtered.length / 3));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * 3, currentPage * 3);
  const selected = data.violations.find(
    (violation) => violation.id === selectedId,
  );
  const resetPage = () => {
    setPage(1);
    setSelectedId(undefined);
  };
  const clear = () => {
    setQuery("");
    setZoneId("all");
    setCameraId("all");
    setEmployeeId("all");
    setDepartment("all");
    setStatus("all");
    setStartDate("");
    setEndDate("");
    setSort("oldest");
    resetPage();
  };
  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">
            Operational audit
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Violation History
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Investigate confirmed Violation Events through metadata and the
            audit timeline.
          </p>
        </div>
        <span className="border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          {data.violations.length} Violation Events
        </span>
      </div>
      <div className="mt-8 grid gap-3 border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
        <label>
          Search
          <input
            aria-label="Search Violation History"
            onChange={(event) => {
              setQuery(event.target.value);
              resetPage();
            }}
            value={query}
          />
        </label>
        <label>
          Hazardous Zone
          <select
            aria-label="Hazardous Zone filter"
            onChange={(event) => {
              setZoneId(event.target.value);
              resetPage();
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
        </label>
        <label>
          Camera Source
          <select
            aria-label="Camera Source filter"
            onChange={(event) => {
              setCameraId(event.target.value);
              resetPage();
            }}
            value={cameraId}
          >
            <option value="all">All Camera Sources</option>
            {data.cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Employee
          <select
            aria-label="Employee filter"
            onChange={(event) => {
              setEmployeeId(event.target.value);
              resetPage();
            }}
            value={employeeId}
          >
            <option value="all">All Employees</option>
            <option value="unidentified">Unknown</option>
            {data.employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employeeName(employee)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Department
          <select
            aria-label="Department filter"
            onChange={(event) => {
              setDepartment(event.target.value);
              resetPage();
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
        </label>
        <label>
          Episode status
          <select
            aria-label="Episode status filter"
            onChange={(event) => {
              setStatus(
                event.target.value as ViolationRecord["status"] | "all",
              );
              resetPage();
            }}
            value={status}
          >
            <option value="all">All statuses</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Start date
          <input
            aria-label="Violation start date"
            onChange={(event) => {
              setStartDate(event.target.value);
              resetPage();
            }}
            type="date"
            value={startDate}
          />
        </label>
        <label>
          End date
          <input
            aria-label="Violation end date"
            onChange={(event) => {
              setEndDate(event.target.value);
              resetPage();
            }}
            type="date"
            value={endDate}
          />
        </label>
        <label>
          Sort
          <select
            aria-label="Violation history sort"
            onChange={(event) => {
              setSort(event.target.value as Sort);
              resetPage();
            }}
            value={sort}
          >
            <option value="oldest">Oldest</option>
            <option value="newest">Newest</option>
            <option value="confidence-desc">
              Highest Detection Confidence
            </option>
          </select>
        </label>
      </div>
      <div className="mt-4 flex justify-between gap-3 text-sm text-slate-600">
        <p>
          {filtered.length
            ? `Showing ${(currentPage - 1) * 3 + 1}–${Math.min(currentPage * 3, filtered.length)} of ${filtered.length} Violation Events`
            : "No matching Violation Events."}
        </p>
        <Button onClick={clear} size="sm" variant="outline">
          Clear filters
        </Button>
      </div>
      {data.violations.length === 0 ? (
        <p className="mt-4">No Violation Events</p>
      ) : filtered.length === 0 ? (
        <p className="mt-4">No matching Violation Events.</p>
      ) : (
        <div
          aria-label="Violation history"
          className="mt-4 space-y-3"
          role="list"
        >
          {visible.map((violation) => (
            <article
              className="border border-slate-200 bg-white p-4"
              key={violation.id}
              role="listitem"
            >
              <p className="font-mono text-xs">{violation.id}</p>
              <h2>
                {employeeFor(violation)
                  ? employeeName(employeeFor(violation)!)
                  : "Unknown"}
              </h2>
              <p>
                {zoneFor(violation)?.name ?? violation.zoneId} ·{" "}
                {cameraFor(violation)?.name ?? violation.cameraId}
              </p>
              <Button
                aria-label={`View details ${violation.id}`}
                onClick={() => setSelectedId(violation.id)}
                size="sm"
                variant="outline"
              >
                View details {violation.id}
              </Button>
            </article>
          ))}
        </div>
      )}
      {filtered.length > 3 && (
        <nav
          aria-label="Violation pagination"
          className="mt-5 flex justify-between"
        >
          <Button
            disabled={currentPage === 1}
            onClick={() => {
              setPage((value) => value - 1);
              setSelectedId(undefined);
            }}
            size="sm"
            variant="outline"
          >
            <ChevronLeft />
            Previous page
          </Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            disabled={currentPage === totalPages}
            onClick={() => {
              setPage((value) => value + 1);
              setSelectedId(undefined);
            }}
            size="sm"
            variant="outline"
          >
            Next page
            <ChevronRight />
          </Button>
        </nav>
      )}
      {selected && (
        <ViolationEventDetails
          camera={cameraFor(selected)}
          employee={employeeFor(selected)}
          violation={selected}
          zone={zoneFor(selected)}
        />
      )}
    </section>
  );
}
