import { create } from "zustand";

export interface ComplianceReportFilters {
  zoneId: string;
  departmentId: string;
  employeeId: string;
  fromDate: string;
  toDate: string;
}

export interface ComplianceReportState extends ComplianceReportFilters {
  setZoneId: (zoneId: string) => void;
  setDepartmentId: (departmentId: string) => void;
  setEmployeeId: (employeeId: string) => void;
  setFromDate: (fromDate: string) => void;
  setToDate: (toDate: string) => void;
  clearFilters: () => void;
  reset: () => void;
}

export const initialComplianceReportFilters: ComplianceReportFilters = {
  zoneId: "all",
  departmentId: "all",
  employeeId: "all",
  fromDate: "",
  toDate: "",
};

export const useComplianceReportStore = create<ComplianceReportState>((set) => ({
  ...initialComplianceReportFilters,
  setZoneId: (zoneId) => set({ zoneId }),
  setDepartmentId: (departmentId) => set({ departmentId }),
  setEmployeeId: (employeeId) => set({ employeeId }),
  setFromDate: (fromDate) => set({ fromDate }),
  setToDate: (toDate) => set({ toDate }),
  clearFilters: () => set({ ...initialComplianceReportFilters }),
  reset: () => set({ ...initialComplianceReportFilters }),
}));
