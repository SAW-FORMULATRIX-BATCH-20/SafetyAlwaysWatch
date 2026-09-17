import { create } from "zustand";
import type {
  SafetyScoreResetReason,
  SafetyScoreResetResult,
} from "../services/saw-service";

export type EmployeeScoreFilter = "all" | "needs-reset" | "critical";

export interface ScoreResetState {
  employeeId: string;
  reason: SafetyScoreResetReason | "";
  note: string;
  step: "form" | "review" | "confirm";
  error?: string;
  result?: SafetyScoreResetResult;
  employeeSearch: string;
  employeeFilter: EmployeeScoreFilter;

  setEmployeeId: (employeeId: string) => void;
  setReason: (reason: SafetyScoreResetReason | "") => void;
  setNote: (note: string) => void;
  setStep: (step: "form" | "review" | "confirm") => void;
  setError: (error?: string) => void;
  setResult: (result?: SafetyScoreResetResult) => void;
  setEmployeeSearch: (employeeSearch: string) => void;
  setEmployeeFilter: (employeeFilter: EmployeeScoreFilter) => void;
  resetForm: () => void;
  reset: () => void;
}

export const initialScoreResetState = {
  employeeId: "",
  reason: "" as SafetyScoreResetReason | "",
  note: "",
  step: "form" as const,
  error: undefined,
  result: undefined,
  employeeSearch: "",
  employeeFilter: "all" as EmployeeScoreFilter,
};

export const useScoreResetStore = create<ScoreResetState>((set) => ({
  ...initialScoreResetState,
  setEmployeeId: (employeeId) =>
    set({
      employeeId,
      error: undefined,
      result: undefined,
    }),
  setReason: (reason) => set({ reason }),
  setNote: (note) => set({ note }),
  setStep: (step) => set({ step }),
  setError: (error) => set({ error }),
  setResult: (result) => set({ result }),
  setEmployeeSearch: (employeeSearch) => set({ employeeSearch }),
  setEmployeeFilter: (employeeFilter) => set({ employeeFilter }),
  resetForm: () =>
    set({
      reason: "",
      note: "",
      step: "form",
    }),
  reset: () => set({ ...initialScoreResetState }),
}));
