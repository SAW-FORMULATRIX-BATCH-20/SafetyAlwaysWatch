import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeeScopeFor, type Persona } from "../../application/personas";
import { useSawService } from "../../providers/ServiceContext";
import type {
  Employee,
  EmployeeDirectoryCapability,
  EmployeeDirectoryData,
  EmployeeRegistrationInput,
  EmployeeScope,
  FaceEnrollmentCapability,
  FaceEnrollmentInput,
  FaceEnrollmentPolicy,
  FaceSample,
} from "../../services/saw-service";
import { useAuthStore } from "../../stores/useAuthStore";

export type FaceEnrollmentService = EmployeeDirectoryCapability & FaceEnrollmentCapability;

export const employeeKeys = {
  all: ["employees"] as const,
  directory: (scope?: EmployeeScope) => ["employees", "directory", scope] as const,
  detail: (id?: string, scope?: EmployeeScope) => ["employees", "detail", id, scope] as const,
  facePolicy: () => ["employees", "face-policy"] as const,
  faceSamples: (id?: string) => ["employees", "face-samples", id] as const,
};

export interface UseEmployeesQueryOptions {
  persona?: Persona;
  service?: EmployeeDirectoryCapability;
}

export function useEmployeesQuery({
  persona: propPersona,
  service: propService,
}: UseEmployeesQueryOptions = {}) {
  let service: EmployeeDirectoryCapability;
  try {
    const sawService = useSawService();
    service = propService ?? sawService;
  } catch {
    if (!propService) {
      throw new Error("useEmployeesQuery requires a ServiceProvider or a service prop");
    }
    service = propService;
  }

  const authPersona = useAuthStore((state) => state.persona);
  const persona = propPersona ?? authPersona;
  const scope = persona ? employeeScopeFor(persona) : undefined;

  return useQuery<EmployeeDirectoryData, Error>({
    queryKey: employeeKeys.directory(scope),
    queryFn: () => service.getEmployeeDirectory(scope),
  });
}

export interface UseEmployeeDetailQueryOptions {
  employeeId?: string;
  persona?: Persona;
  service?: EmployeeDirectoryCapability;
}

export function useEmployeeDetailQuery({
  employeeId,
  persona: propPersona,
  service: propService,
}: UseEmployeeDetailQueryOptions = {}) {
  let service: EmployeeDirectoryCapability;
  try {
    const sawService = useSawService();
    service = propService ?? sawService;
  } catch {
    if (!propService) {
      throw new Error("useEmployeeDetailQuery requires a ServiceProvider or a service prop");
    }
    service = propService;
  }

  const authPersona = useAuthStore((state) => state.persona);
  const persona = propPersona ?? authPersona;
  const scope = persona ? employeeScopeFor(persona) : undefined;

  const employeeQuery = useQuery<Employee, Error>({
    queryKey: employeeKeys.detail(employeeId, scope),
    queryFn: () => {
      if (!employeeId) throw new Error("Employee ID is required");
      return service.getEmployee(employeeId, scope);
    },
    enabled: Boolean(employeeId),
  });

  const supervisorId = employeeQuery.data?.supervisorId;

  const supervisorQuery = useQuery<Employee | null, Error>({
    queryKey: employeeKeys.detail(supervisorId),
    queryFn: async () => {
      if (!supervisorId) return null;
      try {
        return await service.getEmployee(supervisorId);
      } catch {
        return null;
      }
    },
    enabled: Boolean(supervisorId),
  });

  return {
    employee: employeeQuery.data,
    supervisor: supervisorQuery.data ?? undefined,
    isLoading: employeeQuery.isLoading,
    isError: employeeQuery.isError,
    error: employeeQuery.error,
    refetch: employeeQuery.refetch,
  };
}

export interface UseCreateEmployeeMutationOptions {
  service?: EmployeeDirectoryCapability;
}

export function useCreateEmployeeMutation({
  service: propService,
}: UseCreateEmployeeMutationOptions = {}) {
  let service: EmployeeDirectoryCapability;
  try {
    const sawService = useSawService();
    service = propService ?? sawService;
  } catch {
    if (!propService) {
      throw new Error("useCreateEmployeeMutation requires a ServiceProvider or a service prop");
    }
    service = propService;
  }

  const queryClient = useQueryClient();

  return useMutation<Employee, Error, EmployeeRegistrationInput>({
    mutationFn: (input) => service.createEmployee(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
}

export interface UseFaceEnrollmentQueryOptions {
  employeeId?: string;
  service?: FaceEnrollmentService;
}

export function useFaceEnrollmentQuery({
  employeeId,
  service: propService,
}: UseFaceEnrollmentQueryOptions = {}) {
  let service: FaceEnrollmentService;
  try {
    const sawService = useSawService();
    service = propService ?? (sawService as FaceEnrollmentService);
  } catch {
    if (!propService) {
      throw new Error("useFaceEnrollmentQuery requires a ServiceProvider or a service prop");
    }
    service = propService;
  }

  const employeeQuery = useQuery<Employee, Error>({
    queryKey: employeeKeys.detail(employeeId),
    queryFn: () => {
      if (!employeeId) throw new Error("Employee ID is required");
      return service.getEmployee(employeeId);
    },
    enabled: Boolean(employeeId),
  });

  const policyQuery = useQuery<FaceEnrollmentPolicy, Error>({
    queryKey: employeeKeys.facePolicy(),
    queryFn: () => service.getFaceEnrollmentPolicy(),
  });

  const samplesQuery = useQuery<FaceSample[], Error>({
    queryKey: employeeKeys.faceSamples(employeeId),
    queryFn: () => {
      if (!employeeId) throw new Error("Employee ID is required");
      return service.getFaceSamples(employeeId);
    },
    enabled: Boolean(employeeId),
  });

  const isLoading = employeeQuery.isLoading || policyQuery.isLoading || samplesQuery.isLoading;
  const isError = employeeQuery.isError || policyQuery.isError || samplesQuery.isError;
  const error = employeeQuery.error || policyQuery.error || samplesQuery.error;

  return {
    employee: employeeQuery.data,
    policy: policyQuery.data,
    samples: samplesQuery.data ?? [],
    isLoading,
    isError,
    error,
    refetch: () => {
      employeeQuery.refetch();
      policyQuery.refetch();
      samplesQuery.refetch();
    },
  };
}

export interface UseEnrollFaceSampleMutationOptions {
  service?: FaceEnrollmentCapability;
}

export function useEnrollFaceSampleMutation({
  service: propService,
}: UseEnrollFaceSampleMutationOptions = {}) {
  let service: FaceEnrollmentCapability;
  try {
    const sawService = useSawService();
    service = propService ?? sawService;
  } catch {
    if (!propService) {
      throw new Error("useEnrollFaceSampleMutation requires a ServiceProvider or a service prop");
    }
    service = propService;
  }

  const queryClient = useQueryClient();

  return useMutation<FaceSample, Error, FaceEnrollmentInput>({
    mutationFn: (input) => service.enrollFaceSample(input),
    onSuccess: (sample, variables) => {
      queryClient.setQueryData<FaceSample[]>(
        employeeKeys.faceSamples(variables.employeeId),
        (prev = []) => [...prev, sample],
      );
      queryClient.invalidateQueries({ queryKey: employeeKeys.faceSamples(variables.employeeId) });
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(variables.employeeId) });
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
}

export interface UseDeactivateFaceSampleMutationOptions {
  service?: FaceEnrollmentCapability;
}

export function useDeactivateFaceSampleMutation({
  service: propService,
}: UseDeactivateFaceSampleMutationOptions = {}) {
  let service: FaceEnrollmentCapability;
  try {
    const sawService = useSawService();
    service = propService ?? sawService;
  } catch {
    if (!propService) {
      throw new Error("useDeactivateFaceSampleMutation requires a ServiceProvider or a service prop");
    }
    service = propService;
  }

  const queryClient = useQueryClient();

  return useMutation<FaceSample, Error, { employeeId: string; faceSampleId: string }>({
    mutationFn: ({ employeeId, faceSampleId }) =>
      service.deactivateFaceSample(employeeId, faceSampleId),
    onSuccess: (updatedSample, variables) => {
      queryClient.setQueryData<FaceSample[]>(
        employeeKeys.faceSamples(variables.employeeId),
        (prev = []) => prev.map((s) => (s.id === updatedSample.id ? updatedSample : s)),
      );
      queryClient.invalidateQueries({ queryKey: employeeKeys.faceSamples(variables.employeeId) });
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(variables.employeeId) });
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
}
