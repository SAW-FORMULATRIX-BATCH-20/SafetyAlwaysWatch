import { create } from "zustand";

export type LiveMonitoringViewMode = "single" | "grid";

export interface LiveMonitoringState {
  selectedCameraId?: string;
  notificationFeed?: string;
  viewMode: LiveMonitoringViewMode;
  showSimulator: boolean;
  setSelectedCameraId: (
    selectedCameraId?: string | ((current?: string) => string | undefined)
  ) => void;
  setNotificationFeed: (notificationFeed?: string) => void;
  setViewMode: (viewMode: LiveMonitoringViewMode) => void;
  setShowSimulator: (showSimulator: boolean) => void;
  toggleSimulator: () => void;
  reset: () => void;
}

export const useLiveMonitoringStore = create<LiveMonitoringState>((set) => ({
  selectedCameraId: undefined,
  notificationFeed: undefined,
  viewMode: "single",
  showSimulator: true,
  setSelectedCameraId: (selectedCameraId) =>
    set((state) => ({
      selectedCameraId:
        typeof selectedCameraId === "function"
          ? selectedCameraId(state.selectedCameraId)
          : selectedCameraId,
    })),
  setNotificationFeed: (notificationFeed) => set({ notificationFeed }),
  setViewMode: (viewMode) => set({ viewMode }),
  setShowSimulator: (showSimulator) => set({ showSimulator }),
  toggleSimulator: () => set((state) => ({ showSimulator: !state.showSimulator })),
  reset: () =>
    set({
      selectedCameraId: undefined,
      notificationFeed: undefined,
      viewMode: "single",
      showSimulator: true,
    }),
}));
