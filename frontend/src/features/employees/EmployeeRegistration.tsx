import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Building2,
  ChevronDown,
  ChevronLeft,
  Hash,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserRound,
} from "lucide-react";

import { Button } from "../../components/ui/button";
import {
  useCreateEmployeeMutation,
  useEmployeesQuery,
} from "../../hooks/queries/useEmployeesQuery";
import { EnsureQueryClient } from "../../providers/EnsureQueryClient";
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

function EmployeeRegistrationContent({ service }: { service?: EmployeeDirectoryCapability }) {
  const navigate = useNavigate();
  const { data: directory, isError: directoryError } = useEmployeesQuery({ service });
  const createMutation = useCreateEmployeeMutation({ service });

  const [input, setInput] = useState<EmployeeRegistrationInput>({
    employeeCode: "",
    fullName: "",
    department: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [notice, setNotice] = useState<string>();

  const submitting = createMutation.isPending;

  const update = <K extends keyof EmployeeRegistrationInput>(
    field: K,
    value: EmployeeRegistrationInput[K],
  ) => {
    setInput((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setNotice(undefined);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const nextErrors = validate(input);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setNotice("Correct the highlighted Employee registration fields and try again.");
      return;
    }
    setNotice(undefined);
    try {
      const employee = await createMutation.mutateAsync(input);
      navigate(`/employees/${employee.id}`, {
        replace: true,
        state: { notice: `Employee ${employee.employeeCode ?? employee.id} was created.` },
      });
    } catch (reason) {
      setNotice(capabilityMessage(reason));
    }
  };

  const activeSupervisors =
    directory?.employees.filter((employee) => employee.status !== "inactive") ?? [];
  const departments = [
    ...new Set(directory?.employees.map((employee) => employee.departmentId) ?? []),
  ].sort();

  const displayedNotice = notice ?? (directoryError ? "Employee registration could not be loaded." : undefined);

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

      <div>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-amber-700">
          Employee registration
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          Add Employee
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Register an active Employee now. Face Enrollment can be completed later.
        </p>
      </div>

      {displayedNotice && (
        <div
          aria-live="polite"
          className="mt-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3.5 text-sm text-amber-900 shadow-2xs"
          role="alert"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-amber-700" />
          <p className="font-medium leading-relaxed">{displayedNotice}</p>
        </div>
      )}

      <form
        className="mt-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs"
        onSubmit={(event) => void submit(event)}
      >
        <div className="border-b border-slate-100 bg-gradient-to-r from-amber-500/10 via-amber-100/30 to-amber-50/10 px-5 sm:px-6 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <UserPlus aria-hidden="true" className="size-4 text-amber-700" />
            <span>Employee Profile Information</span>
          </h2>
        </div>

        <div className="space-y-5 sm:space-y-6 p-5 sm:p-8">
          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
            {/* Employee code */}
            <div>
              <label className="block text-sm font-semibold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Hash aria-hidden="true" className="size-3.5 text-amber-600" />
                  Employee code
                </span>
                <input
                  aria-describedby={errors.employeeCode ? "employee-code-error" : undefined}
                  aria-invalid={Boolean(errors.employeeCode)}
                  aria-label="Employee code"
                  autoFocus
                  className={`mt-1.5 block h-10 w-full rounded-lg border bg-slate-50/40 px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 ${
                    errors.employeeCode
                      ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 focus:border-amber-500 focus:ring-amber-500/20"
                  }`}
                  maxLength={50}
                  onChange={(event) => update("employeeCode", event.target.value)}
                  placeholder="e.g. EMP-013"
                  value={input.employeeCode}
                />
              </label>
              {errors.employeeCode && (
                <p id="employee-code-error" className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-700">
                  <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
                  <span>{errors.employeeCode}</span>
                </p>
              )}
            </div>

            {/* Full name */}
            <div>
              <label className="block text-sm font-semibold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <UserRound aria-hidden="true" className="size-3.5 text-amber-600" />
                  Full name
                </span>
                <input
                  aria-describedby={errors.fullName ? "full-name-error" : undefined}
                  aria-invalid={Boolean(errors.fullName)}
                  aria-label="Full name"
                  className={`mt-1.5 block h-10 w-full rounded-lg border bg-slate-50/40 px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 ${
                    errors.fullName
                      ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 focus:border-amber-500 focus:ring-amber-500/20"
                  }`}
                  maxLength={200}
                  onChange={(event) => update("fullName", event.target.value)}
                  placeholder="e.g. Avery Tan"
                  value={input.fullName}
                />
              </label>
              {errors.fullName && (
                <p id="full-name-error" className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-700">
                  <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
                  <span>{errors.fullName}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Department */}
            <div>
              <label className="block text-sm font-semibold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Building2 aria-hidden="true" className="size-3.5 text-amber-600" />
                  Department
                </span>
                <input
                  aria-describedby={errors.department ? "department-error" : undefined}
                  aria-invalid={Boolean(errors.department)}
                  aria-label="Department"
                  className={`mt-1.5 block h-10 w-full rounded-lg border bg-slate-50/40 px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 ${
                    errors.department
                      ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 focus:border-amber-500 focus:ring-amber-500/20"
                  }`}
                  list="employee-departments"
                  maxLength={100}
                  onChange={(event) => update("department", event.target.value)}
                  placeholder="Choose or enter department..."
                  value={input.department}
                />
                <datalist id="employee-departments">
                  {departments.map((department) => (
                    <option key={department} value={department} />
                  ))}
                </datalist>
              </label>
              {errors.department && (
                <p id="department-error" className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-700">
                  <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
                  <span>{errors.department}</span>
                </p>
              )}
            </div>

            {/* Direct supervisor */}
            <div>
              <label className="block text-sm font-semibold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <UserCheck aria-hidden="true" className="size-3.5 text-amber-600" />
                  Direct supervisor (optional)
                </span>
                <div className="relative mt-1.5">
                  <select
                    aria-label="Direct supervisor"
                    className="block h-10 w-full appearance-none rounded-lg border border-slate-300 bg-slate-50/40 pl-3 pr-9 text-sm text-slate-900 transition-colors focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    onChange={(event) => update("supervisorId", event.target.value || undefined)}
                    value={input.supervisorId ?? ""}
                  >
                    <option value="">No direct supervisor</option>
                    {activeSupervisors.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name ?? employee.id} · {employee.employeeCode ?? employee.id}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Default parameters */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </dt>
                <dd className="mt-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                    Active
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Initial Safety Score
                </dt>
                <dd className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <ShieldCheck aria-hidden="true" className="size-4 text-emerald-600" />
                  <span>Configured when created</span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-100 pt-5">
            <Button
              className="w-full sm:w-auto justify-center"
              disabled={submitting}
              onClick={() => navigate("/employees")}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto justify-center gap-2 bg-amber-400 font-semibold text-slate-950 shadow-xs hover:bg-amber-500"
              disabled={submitting}
              type="submit"
            >
              {submitting ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  <span>Creating Employee…</span>
                </>
              ) : (
                <>
                  <UserPlus aria-hidden="true" className="size-4" />
                  <span>Create Employee</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}

export function EmployeeRegistration(props: { service?: EmployeeDirectoryCapability }) {
  return (
    <EnsureQueryClient>
      <EmployeeRegistrationContent {...props} />
    </EnsureQueryClient>
  );
}
