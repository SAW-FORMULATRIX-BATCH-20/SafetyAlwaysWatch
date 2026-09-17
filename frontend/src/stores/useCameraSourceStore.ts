import { create } from "zustand";
import type { CameraStatus } from "../services/saw-service";

export type CameraStatusFilter = CameraStatus | "all";

export interface CameraSourceState {
  searchTerm: string;
  statusFilter: CameraStatusFilter;
  selectedCameraId?: string;
  notice?: string;
  setSearchTerm: (searchTerm: string) => void;
  setStatusFilter: (statusFilter: CameraStatusFilter) => void;
  setSelectedCameraId: (selectedCameraId?: string) => void;
  setNotice: (notice?: string) => void;
  reset: () => void;
}

export const useCameraSourceStore = create<CameraSourceState>((set) => ({
  searchTerm: "",
  statusFilter: "all",
  selectedCameraId: undefined,
  notice: undefined,
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSelectedCameraId: (selectedCameraId) => set({ selectedCameraId }),
  setNotice: (notice) => set({ notice }),
  reset: () =>
    set({
      searchTerm: "",
      statusFilter: "all",
      selectedCameraId: undefined,
      notice: undefined,
    }),
}));
