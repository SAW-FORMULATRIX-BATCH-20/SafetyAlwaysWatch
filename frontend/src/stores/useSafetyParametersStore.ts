import { create } from "zustand";
import type { SafetySettings } from "../services/saw-service";

export const cloneSafetySettings = (settings: SafetySettings): SafetySettings => ({
  ...settings,
  deductions: settings.deductions.map((deduction) => ({ ...deduction })),
});

export interface SafetyParametersState {
  draft?: SafetySettings;
  error?: string;
  notice?: string;
  setDraft: (draft?: SafetySettings) => void;
  updateField: <Field extends keyof Omit<SafetySettings, "deductions" | "timeZone">>(
    field: Field,
    value: string | number,
  ) => void;
  updateDeduction: (canonicalPpeClass: string, points: number) => void;
  setError: (error?: string) => void;
  setNotice: (notice?: string) => void;
  reset: () => void;
}

export const initialSafetyParametersState = {
  draft: undefined,
  error: undefined,
  notice: undefined,
};

export const useSafetyParametersStore = create<SafetyParametersState>((set) => ({
  ...initialSafetyParametersState,
  setDraft: (draft) =>
    set({
      draft: draft ? cloneSafetySettings(draft) : undefined,
    }),
  updateField: (field, value) =>
    set((state) => ({
      draft: state.draft
        ? {
            ...state.draft,
            [field]: field === "resetTime" ? String(value) : Number(value),
          }
        : state.draft,
      error: undefined,
      notice: undefined,
    })),
  updateDeduction: (canonicalPpeClass, points) =>
    set((state) => ({
      draft: state.draft
        ? {
            ...state.draft,
            deductions: state.draft.deductions.map((item) =>
              item.canonicalPpeClass === canonicalPpeClass
                ? { ...item, points }
                : item,
            ),
          }
        : state.draft,
      error: undefined,
      notice: undefined,
    })),
  setError: (error) => set({ error }),
  setNotice: (notice) => set({ notice }),
  reset: () => set({ ...initialSafetyParametersState }),
}));
