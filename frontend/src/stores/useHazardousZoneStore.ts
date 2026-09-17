import { create } from "zustand";

export type ZoneStatusFilter = "all" | "active" | "inactive";

export interface HazardousZoneState {
  selectedCameraId?: string;
  zoneStatusFilter: ZoneStatusFilter;
  setSelectedCameraId: (id?: string) => void;
  setZoneStatusFilter: (status: ZoneStatusFilter) => void;
  reset: () => void;
}

export const useHazardousZoneStore = create<HazardousZoneState>((set) => ({
  selectedCameraId: undefined,
  zoneStatusFilter: "all",
  setSelectedCameraId: (selectedCameraId) => set({ selectedCameraId }),
  setZoneStatusFilter: (zoneStatusFilter) => set({ zoneStatusFilter }),
  reset: () =>
    set({
      selectedCameraId: undefined,
      zoneStatusFilter: "all",
    }),
}));
