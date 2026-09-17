export type EmployeeEnrollmentStatus = "enrolled" | "pending" | "not-enrolled";
export type EmployeeStatus = "active" | "inactive";

export type Employee = {
  id: string;
  employeeCode?: string;
  departmentId: string;
  safetyScore: number;
  status?: EmployeeStatus;
  faceSampleCount?: number;
  safetyScorePeriodStartedAt?: string;
  name?: string;
  supervisorId?: string;
  supervisorArea?: string;
  enrollmentStatus?: EmployeeEnrollmentStatus;
  lastAuditAt?: string;
  auditSummary?: {
    violationCount: number;
    resetCount: number;
  };
};

export type EmployeeScope = "all" | { type: "supervisor-area"; area: string };

export type EmployeeDirectoryData = {
  employees: Employee[];
  escalationThreshold: number;
};

export type EmployeeRegistrationInput = {
  employeeCode: string;
  fullName: string;
  department: string;
  supervisorId?: string;
};

export type DemoValidationOutcome =
  | "success"
  | "no_face"
  | "multiple_faces"
  | "low_quality"
  | "duplicate";

export type FaceEnrollmentPolicy = {
  acceptedMediaTypes: readonly ("image/jpeg" | "image/png")[];
  maximumFileSizeBytes: number;
  maximumActiveSamples: number;
};

export type FaceSample = {
  id: string;
  employeeId: string;
  active: boolean;
  enrolledAt: string;
  enrolledBy: string;
  qualityScore?: number;
};

export type FaceEnrollmentInput = {
  employeeId: string;
  image: Blob;
  demoOutcome: DemoValidationOutcome;
  actor: string;
};

export type FaceEnrollmentFailureCode =
  | "unsupported_media_type"
  | "file_too_large"
  | "no_face"
  | "multiple_faces"
  | "low_quality"
  | "duplicate"
  | "active_sample_limit"
  | "employee_not_found"
  | "face_sample_not_found";

export class FaceEnrollmentError extends Error {
  readonly code: FaceEnrollmentFailureCode;
  constructor(code: FaceEnrollmentFailureCode) {
    super(code);
    this.code = code;
    this.name = "FaceEnrollmentError";
  }
}

export type EmployeeCapabilityFailureCode =
  | "employee_code_conflict"
  | "employee_not_found"
  | "employee_validation_failed";

export class EmployeeCapabilityError extends Error {
  readonly code: EmployeeCapabilityFailureCode;
  constructor(code: EmployeeCapabilityFailureCode) {
    super(code);
    this.code = code;
    this.name = "EmployeeCapabilityError";
  }
}
