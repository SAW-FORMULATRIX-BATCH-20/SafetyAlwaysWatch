import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { employeeScopeFor, type Persona } from "../../application/personas";
import { Button } from "../../components/ui/button";
import type { Employee, EmployeeDirectoryCapability, EmployeeDirectoryData } from "../../services/saw-service";

type ScoreStatus = "safe" | "warning" | "critical";
type EmployeeSort = "name-asc" | "name-desc" | "score-desc" | "score-asc";

const employeeName = (employee: Employee) =>
  employee.name ?? `Employee ${employee.id}`;
const scoreStatus = (score: number, threshold: number): ScoreStatus =>
  score < threshold ? "critical" : score < 80 ? "warning" : "safe";
const enrollmentLabels = {
  enrolled: "Enrolled",
  pending: "Enrollment pending",
  "not-enrolled": "Not enrolled",
} as const;

export function Employees({
  persona,
  service,
}: {
  persona: Persona;
  service: EmployeeDirectoryCapability;
}) {
  const [directory, setDirectory] = useState<EmployeeDirectoryData>();
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState<ScoreStatus | "all">("all");
  const [sort, setSort] = useState<EmployeeSort>("name-asc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    const scope = employeeScopeFor(persona);

    service
      .getEmployeeDirectory(scope)
      .then((value) => {
        if (active) setDirectory(value);
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "The Employees directory could not be loaded.",
          );
      });

    return () => {
      active = false;
    };
  }, [persona, service]);

  const resetPage = () => {
    setPage(1);
  };

  if (error)
    return (
      <section aria-live="polite">
        <h1>Employees</h1>
        <p>The Employees directory could not be loaded</p>
        <p>{error}</p>
      </section>
    );
  if (!directory)
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
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / 5));
  const currentPage = Math.min(page, totalPages);
  const visible = filteredEmployees.slice(
    (currentPage - 1) * 5,
    currentPage * 5,
  );
  const clear = () => {
    setQuery("");
    setDepartment("all");
    setStatus("all");
    setSort("name-asc");
    resetPage();
  };

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">
            Operational directory
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Employees</h1>
          <p className="mt-2 text-sm text-slate-600">
            Find Employees, their Safety Score position, and audit context
            without biometric capture.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span><UserRound className="inline size-4" /> {directory.employees.length} Employees</span>
          {persona.role === "admin" && <Link className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800" to="/employees/new">Add employee</Link>}
        </div>
      </div>
      <div className="mt-8 grid gap-3 border p-4 sm:grid-cols-2 xl:grid-cols-4">
        <label>
          Search Employees
          <input
            aria-label="Search Employees"
            onChange={(event) => {
              setQuery(event.target.value);
              resetPage();
            }}
            value={query}
          />
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
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Safety Score status
          <select
            aria-label="Safety Score status filter"
            onChange={(event) => {
              setStatus(event.target.value as ScoreStatus | "all");
              resetPage();
            }}
            value={status}
          >
            <option value="all">All statuses</option>
            <option value="safe">Safe</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </label>
        <label>
          Sort <ArrowDownUp className="inline size-3" />
          <select
            aria-label="Employee sort"
            onChange={(event) => {
              setSort(event.target.value as EmployeeSort);
              resetPage();
            }}
            value={sort}
          >
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="score-desc">Highest Safety Score</option>
            <option value="score-asc">Lowest Safety Score</option>
          </select>
        </label>
      </div>
      <div className="mt-4 flex justify-between">
        {filteredEmployees.length > 0 && (
          <p>
            Showing {(currentPage - 1) * 5 + 1}–
            {Math.min(currentPage * 5, filteredEmployees.length)} of{" "}
            {filteredEmployees.length} Employees
          </p>
        )}
        <Button onClick={clear} size="sm" variant="outline">
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
          className="mt-4 grid gap-4 xl:grid-cols-2"
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
                className="border p-4"
                key={employee.id}
                role="listitem"
              >
                <h2>{employeeName(employee)}</h2>
                <p>{employee.employeeCode ?? employee.id}</p>
                <Icon
                  aria-label={`Safety Score status ${state}`}
                  className="inline size-4"
                  role="img"
                />
                <p>
                  {employee.departmentId} · {employee.safetyScore} ·{" "}
                  {
                    enrollmentLabels[
                      employee.enrollmentStatus ?? "not-enrolled"
                    ]
                  }
                </p>
                <Link
                  aria-label={`View details ${employeeName(employee)}`}
                  className="mt-3 inline-flex h-8 items-center border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800"
                  to={`/employees/${employee.id}`}
                >
                  View details {employeeName(employee)}
                </Link>
              </article>
            );
          })}
        </div>
      )}
      {filteredEmployees.length > 5 && (
        <nav
          aria-label="Employee pagination"
          className="mt-5 flex justify-between"
        >
          <Button
            disabled={currentPage === 1}
            onClick={() => setPage((value) => value - 1)}
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
            onClick={() => setPage((value) => value + 1)}
            size="sm"
            variant="outline"
          >
            Next page
            <ChevronRight />
          </Button>
        </nav>
      )}
    </section>
  );
}
