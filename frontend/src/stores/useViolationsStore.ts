import { create } from "zustand";
import type { ViolationRecord } from "../services/saw-service";

export type ViolationSort = "oldest" | "newest" | "confidence-desc";

export interface ViolationsFilters {
  query: string;
  zoneId: string;
  cameraId: string;
  employeeId: string;
  department: string;
  status: ViolationRecord["status"] | "all";
  startDate: string;
  endDate: string;
  sort: ViolationSort;
}

export interface ViolationsState extends ViolationsFilters {
  page: number;
  pageSize: number;
  selectedId?: string;
  setQuery: (query: string) => void;
  setZoneId: (zoneId: string) => void;
  setCameraId: (cameraId: string) => void;
  setEmployeeId: (employeeId: string) => void;
  setDepartment: (department: string) => void;
  setStatus: (status: ViolationRecord["status"] | "all") => void;
  setStartDate: (startDate: string) => void;
  setEndDate: (endDate: string) => void;
  setSort: (sort: ViolationSort) => void;
  setPage: (page: number | ((prev: number) => number)) => void;
  setPageSize: (pageSize: number) => void;
  setSelectedId: (selectedId?: string) => void;
  resetPage: () => void;
  clearFilters: () => void;
  reset: () => void;
}

export const initialViolationsFilters: ViolationsFilters = {
  query: "",
  zoneId: "all",
  cameraId: "all",
  employeeId: "all",
  department: "all",
  status: "all",
  startDate: "",
  endDate: "",
  sort: "oldest",
};

export const useViolationsStore = create<ViolationsState>((set) => ({
  ...initialViolationsFilters,
  page: 1,
  pageSize: 10,
  selectedId: undefined,
  setQuery: (query) => set({ query, page: 1, selectedId: undefined }),
  setZoneId: (zoneId) => set({ zoneId, page: 1, selectedId: undefined }),
  setCameraId: (cameraId) => set({ cameraId, page: 1, selectedId: undefined }),
  setEmployeeId: (employeeId) => set({ employeeId, page: 1, selectedId: undefined }),
  setDepartment: (department) => set({ department, page: 1, selectedId: undefined }),
  setStatus: (status) => set({ status, page: 1, selectedId: undefined }),
  setStartDate: (startDate) => set({ startDate, page: 1, selectedId: undefined }),
  setEndDate: (endDate) => set({ endDate, page: 1, selectedId: undefined }),
  setSort: (sort) => set({ sort, page: 1, selectedId: undefined }),
  setPage: (page) =>
    set((state) => ({
      page: typeof page === "function" ? page(state.page) : page,
    })),
  setPageSize: (pageSize) => set({ pageSize, page: 1, selectedId: undefined }),
  setSelectedId: (selectedId) => set({ selectedId }),
  resetPage: () => set({ page: 1, selectedId: undefined }),
  clearFilters: () =>
    set({
      ...initialViolationsFilters,
      page: 1,
      pageSize: 10,
      selectedId: undefined,
    }),
  reset: () =>
    set({
      ...initialViolationsFilters,
      page: 1,
      pageSize: 10,
      selectedId: undefined,
    }),
}));
