import { create } from "zustand";
import type { CanonicalPpeClassMapping } from "../services/saw-service";

export type PpeMappingDraft = {
  id?: string;
  yoloIndex: string;
  rawLabel: string;
  canonicalPpeClass: string;
  complianceCategory: CanonicalPpeClassMapping["complianceCategory"];
  active: boolean;
};

export type MappingCategoryFilter = "all" | "compliance" | "violation";
export type MappingStatusFilter = "all" | "active" | "inactive";

export interface CanonicalPpeClassState {
  draft?: PpeMappingDraft;
  notice?: string;
  searchQuery: string;
  categoryFilter: MappingCategoryFilter;
  statusFilter: MappingStatusFilter;
  setDraft: (draft?: PpeMappingDraft) => void;
  updateDraft: <Field extends keyof PpeMappingDraft>(
    field: Field,
    value: PpeMappingDraft[Field],
  ) => void;
  setNotice: (notice?: string) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (filter: MappingCategoryFilter) => void;
  setStatusFilter: (filter: MappingStatusFilter) => void;
  clearFilters: () => void;
  reset: () => void;
}

export const useCanonicalPpeClassStore = create<CanonicalPpeClassState>((set) => ({
  draft: undefined,
  notice: undefined,
  searchQuery: "",
  categoryFilter: "all",
  statusFilter: "all",
  setDraft: (draft) => set({ draft }),
  updateDraft: (field, value) =>
    set((state) => ({
      draft: state.draft ? { ...state.draft, [field]: value } : state.draft,
    })),
  setNotice: (notice) => set({ notice }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  clearFilters: () =>
    set({
      searchQuery: "",
      categoryFilter: "all",
      statusFilter: "all",
    }),
  reset: () =>
    set({
      draft: undefined,
      notice: undefined,
      searchQuery: "",
      categoryFilter: "all",
      statusFilter: "all",
    }),
}));
