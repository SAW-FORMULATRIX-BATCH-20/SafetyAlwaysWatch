import { create } from "zustand";

export type ScoreStatus = "safe" | "warning" | "critical";
export type EmployeeSort = "name-asc" | "name-desc" | "score-desc" | "score-asc";

export interface EmployeeState {
  query: string;
  department: string;
  status: ScoreStatus | "all";
  sort: EmployeeSort;
  page: number;
  setQuery: (query: string) => void;
  setDepartment: (department: string) => void;
  setStatus: (status: ScoreStatus | "all") => void;
  setSort: (sort: EmployeeSort) => void;
  setPage: (page: number | ((prev: number) => number)) => void;
  resetPage: () => void;
  clearFilters: () => void;
}

export const useEmployeeStore = create<EmployeeState>((set) => ({
  query: "",
  department: "all",
  status: "all",
  sort: "name-asc",
  page: 1,
  setQuery: (query) => set({ query, page: 1 }),
  setDepartment: (department) => set({ department, page: 1 }),
  setStatus: (status) => set({ status, page: 1 }),
  setSort: (sort) => set({ sort, page: 1 }),
  setPage: (page) =>
    set((state) => ({
      page: typeof page === "function" ? page(state.page) : page,
    })),
  resetPage: () => set({ page: 1 }),
  clearFilters: () =>
    set({
      query: "",
      department: "all",
      status: "all",
      sort: "name-asc",
      page: 1,
    }),
}));
