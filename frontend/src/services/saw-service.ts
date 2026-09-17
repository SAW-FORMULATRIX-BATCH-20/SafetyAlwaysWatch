/**
 * SAW Service Facade
 *
 * This file serves as a backward-compatible unified entrypoint (Facade Pattern).
 * It re-exports all domain types, capability contracts, and the mock service implementation.
 *
 * Individual modules can also be imported directly:
 * - Types: `src/types`
 * - Capability Contracts: `src/services/contracts`
 * - Mock Service: `src/services/mock/mock-saw-service`
 */

export * from "../types";
export * from "./contracts";
export {
  defaultCanonicalPpeClassConfiguration,
  defaultFaceEnrollmentPolicy,
  defaultSafetySettings,
} from "./mock/data/default-settings";
export {
  defaultComplianceReportObservations,
  defaultHazardousZone,
  defaultNotificationRecipients,
  seedData,
} from "./mock/data/seed-data";
export {
  createMockSawService,
  type MockServiceOptions,
} from "./mock/mock-saw-service";
