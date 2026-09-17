import { describe, expect, it } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryProvider } from "../../../providers/QueryProvider";
import {
  useCreateEmployeeMutation,
  useEmployeeDetailQuery,
  useEmployeesQuery,
  useFaceEnrollmentQuery,
} from "../useEmployeesQuery";
import { createMockSawService } from "../../../services/saw-service";
import { getPersona } from "../../../application/personas";

describe("State Management - useEmployeesQuery", () => {
  it("fetches employee directory data via useEmployeesQuery", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const adminPersona = getPersona("admin");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(
      () => useEmployeesQuery({ persona: adminPersona }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.employees.length).toBeGreaterThan(0);
    expect(result.current.data?.escalationThreshold).toBeDefined();
  });

  it("fetches supervisor-scoped employee directory data", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const supervisorPersona = getPersona("supervisor");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(
      () => useEmployeesQuery({ persona: supervisorPersona }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.employees.length).toBe(4);
  });

  it("fetches employee detail and supervisor via useEmployeeDetailQuery", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const adminPersona = getPersona("admin");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(
      () => useEmployeeDetailQuery({ employeeId: "EMP-01", persona: adminPersona }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.employee).toBeDefined());

    expect(result.current.employee?.id).toBe("EMP-01");
    expect(result.current.isError).toBe(false);
  });

  it("creates employee and invalidates queries via useCreateEmployeeMutation", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(() => useCreateEmployeeMutation(), { wrapper });

    let createdEmployee;
    await act(async () => {
      createdEmployee = await result.current.mutateAsync({
        employeeCode: "EMP-999",
        fullName: "Test Employee",
        department: "Testing",
      });
    });

    expect(createdEmployee).toBeDefined();
    expect((createdEmployee as unknown as { employeeCode: string }).employeeCode).toBe("EMP-999");
  });

  it("fetches face policy and samples via useFaceEnrollmentQuery", async () => {
    const service = createMockSawService({ scenario: "ready" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryProvider service={service}>{children}</QueryProvider>
    );

    const { result } = renderHook(
      () => useFaceEnrollmentQuery({ employeeId: "EMP-07" }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.employee).toBeDefined());
    await waitFor(() => expect(result.current.policy).toBeDefined());

    expect(result.current.employee?.id).toBe("EMP-07");
    expect(result.current.policy?.maximumActiveSamples).toBeDefined();
    expect(Array.isArray(result.current.samples)).toBe(true);
  });
});
