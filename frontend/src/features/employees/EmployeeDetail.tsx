import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { employeeScopeFor, type Persona } from "../../application/personas";
import type { Employee, EmployeeDirectoryCapability } from "../../services/saw-service";

export function EmployeeDetail({ persona, service }: { persona: Persona; service: EmployeeDirectoryCapability }) {
  const { employeeId } = useParams();
  const location = useLocation();
  const [employee, setEmployee] = useState<Employee>();
  const [supervisor, setSupervisor] = useState<Employee>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    if (!employeeId) return undefined;
    service.getEmployee(employeeId, employeeScopeFor(persona)).then(async (value) => {
      if (!active) return;
      setEmployee(value);
      if (value.supervisorId) {
        try { setSupervisor(await service.getEmployee(value.supervisorId)); } catch { setSupervisor(undefined); }
      }
    }).catch(() => active && setError("The requested Employee could not be found."));
    return () => { active = false; };
  }, [employeeId, persona, service]);

  const notice = (location.state as { notice?: string } | null)?.notice;
  if (error) return <section><h1>Employee details</h1><p role="alert">{error}</p></section>;
  if (!employee) return <section aria-busy="true"><h1>Employee details</h1><p>Loading Employee details…</p></section>;

  return (
    <section>
      {notice && <p aria-live="polite" className="mb-5 border-l-2 border-emerald-500 bg-emerald-50 p-3 text-sm" role="status">{notice}</p>}
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Employee record</p>
      <h1 className="mt-2 text-3xl font-semibold">Employee details</h1>
      <div aria-label="Employee details" className="mt-6 border border-slate-200 bg-white p-5 sm:p-6" role="region">
        <h2 className="text-2xl font-semibold">{employee.name ?? employee.id}</h2>
        <p className="mt-1 font-mono text-sm text-slate-600">{employee.employeeCode ?? employee.id}</p>
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2"><div><dt>Department</dt><dd>{employee.departmentId}</dd></div><div><dt>Direct supervisor</dt><dd>{supervisor?.name ?? "Unassigned"}</dd></div><div><dt>Status</dt><dd>{employee.status === "inactive" ? "Inactive" : "Active"}</dd></div><div><dt>Safety Score</dt><dd>{employee.safetyScore}</dd></div><div><dt>Enrollment status</dt><dd>{employee.faceSampleCount ? "Enrolled" : "Not enrolled"}</dd></div><div><dt>Active Face Samples</dt><dd>{employee.faceSampleCount ?? 0}</dd></div></dl>
        {persona.role === "admin" && <Link className="mt-6 inline-flex h-10 items-center rounded-md bg-amber-400 px-4 text-sm font-medium text-slate-950" to={`/employees/${employee.id}/face-enrollment`}>Enroll face</Link>}
      </div>
    </section>
  );
}

export function FaceEnrollmentPlaceholder() {
  return <section className="mx-auto max-w-2xl"><p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Face Enrollment</p><h1 className="mt-2 text-3xl font-semibold">Face Enrollment</h1><p className="mt-3 text-slate-600">Face Enrollment will be available in a future workflow. No Face Sample has been created.</p></section>;
}
