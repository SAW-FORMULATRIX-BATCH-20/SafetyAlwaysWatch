import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../components/ui/button";
import {
  EmployeeCapabilityError,
  type EmployeeDirectoryCapability,
  type EmployeeRegistrationInput,
} from "../../services/saw-service";

type FormErrors = Partial<Record<keyof EmployeeRegistrationInput, string>>;

function validate(input: EmployeeRegistrationInput): FormErrors {
  const employeeCode = input.employeeCode.trim();
  const fullName = input.fullName.trim();
  const department = input.department.trim();
  return {
    ...(!/^[A-Za-z0-9-]{1,50}$/.test(employeeCode)
      ? { employeeCode: "Employee code must contain 1–50 ASCII letters, digits, or hyphens." }
      : {}),
    ...(!fullName || fullName.length > 200
      ? { fullName: "Full name is required and must contain at most 200 characters." }
      : {}),
    ...(!department || department.length > 100
      ? { department: "Department is required and must contain at most 100 characters." }
      : {}),
  };
}

function capabilityMessage(reason: unknown) {
  if (reason instanceof EmployeeCapabilityError) {
    if (reason.code === "employee_code_conflict") return "An Employee with this Employee code already exists.";
    if (reason.code === "employee_not_found") return "The selected direct supervisor is no longer available.";
    return "Correct the highlighted Employee registration fields and try again.";
  }
  return "Employee registration could not be completed. Try again.";
}

export function EmployeeRegistration({ service }: { service: EmployeeDirectoryCapability }) {
  const navigate = useNavigate();
  const [directory, setDirectory] = useState<Awaited<ReturnType<EmployeeDirectoryCapability["getEmployeeDirectory"]>>>();
  const [input, setInput] = useState<EmployeeRegistrationInput>({ employeeCode: "", fullName: "", department: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [notice, setNotice] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const submissionInFlight = useRef(false);

  useEffect(() => {
    let active = true;
    service.getEmployeeDirectory().then((value) => active && setDirectory(value)).catch(() => active && setNotice("Employee registration could not be loaded."));
    return () => { active = false; };
  }, [service]);

  const update = <K extends keyof EmployeeRegistrationInput>(field: K, value: EmployeeRegistrationInput[K]) => {
    setInput((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setNotice(undefined);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionInFlight.current) return;
    const nextErrors = validate(input);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setNotice("Correct the highlighted Employee registration fields and try again.");
      return;
    }
    submissionInFlight.current = true;
    setSubmitting(true);
    setNotice(undefined);
    try {
      const employee = await service.createEmployee(input);
      navigate(`/employees/${employee.id}`, {
        replace: true,
        state: { notice: `Employee ${employee.employeeCode ?? employee.id} was created.` },
      });
    } catch (reason) {
      setNotice(capabilityMessage(reason));
    } finally {
      submissionInFlight.current = false;
      setSubmitting(false);
    }
  };

  const activeSupervisors = directory?.employees.filter((employee) => employee.status !== "inactive") ?? [];
  const departments = [...new Set(directory?.employees.map((employee) => employee.departmentId) ?? [])].sort();

  return (
    <section className="mx-auto max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">Employee registration</p>
      <h1 className="mt-2 text-3xl font-semibold">Add Employee</h1>
      <p className="mt-2 text-sm text-slate-600">Register an active Employee now. Face Enrollment can be completed later.</p>
      {notice && <p aria-live="polite" className="mt-5 border-l-2 border-amber-500 bg-amber-50 p-3 text-sm" role="alert">{notice}</p>}
      <form className="mt-6 space-y-5 border border-slate-200 bg-white p-5 sm:p-6" onSubmit={(event) => void submit(event)}>
        <label className="block text-sm font-medium text-slate-800">Employee code
          <input aria-describedby={errors.employeeCode ? "employee-code-error" : undefined} aria-invalid={Boolean(errors.employeeCode)} aria-label="Employee code" autoFocus className="mt-1 block h-10 w-full rounded-md border border-slate-300 px-3" maxLength={50} onChange={(event) => update("employeeCode", event.target.value)} value={input.employeeCode} />
        </label>
        {errors.employeeCode && <p id="employee-code-error" className="text-sm text-red-700">{errors.employeeCode}</p>}
        <label className="block text-sm font-medium text-slate-800">Full name
          <input aria-describedby={errors.fullName ? "full-name-error" : undefined} aria-invalid={Boolean(errors.fullName)} aria-label="Full name" className="mt-1 block h-10 w-full rounded-md border border-slate-300 px-3" maxLength={200} onChange={(event) => update("fullName", event.target.value)} value={input.fullName} />
        </label>
        {errors.fullName && <p id="full-name-error" className="text-sm text-red-700">{errors.fullName}</p>}
        <label className="block text-sm font-medium text-slate-800">Department
          <input aria-describedby={errors.department ? "department-error" : undefined} aria-invalid={Boolean(errors.department)} aria-label="Department" className="mt-1 block h-10 w-full rounded-md border border-slate-300 px-3" list="employee-departments" maxLength={100} onChange={(event) => update("department", event.target.value)} value={input.department} />
          <datalist id="employee-departments">{departments.map((department) => <option key={department} value={department} />)}</datalist>
        </label>
        {errors.department && <p id="department-error" className="text-sm text-red-700">{errors.department}</p>}
        <label className="block text-sm font-medium text-slate-800">Direct supervisor (optional)
          <select aria-label="Direct supervisor" className="mt-1 block h-10 w-full rounded-md border border-slate-300 px-3" onChange={(event) => update("supervisorId", event.target.value || undefined)} value={input.supervisorId ?? ""}>
            <option value="">No direct supervisor</option>
            {activeSupervisors.map((employee) => <option key={employee.id} value={employee.id}>{employee.name ?? employee.id} · {employee.employeeCode ?? employee.id}</option>)}
          </select>
        </label>
        <dl className="grid gap-3 border-y border-slate-200 py-4 text-sm sm:grid-cols-2"><div><dt>Status</dt><dd className="font-medium">Active</dd></div><div><dt>Initial Safety Score</dt><dd className="font-medium">Configured when created</dd></div></dl>
        <div className="flex flex-wrap justify-end gap-3"><Button disabled={submitting} onClick={() => navigate("/employees")} type="button" variant="outline">Cancel</Button><Button disabled={submitting} type="submit">{submitting ? "Creating Employee…" : "Create Employee"}</Button></div>
      </form>
    </section>
  );
}
