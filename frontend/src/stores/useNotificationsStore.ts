import { create } from "zustand";
import type {
  NotificationRecipientRole,
  NotificationRecipientScope,
} from "../services/saw-service";

export type RecipientRoleFilter = "all" | NotificationRecipientRole;
export type LogStatusFilter = "all" | "sent" | "failed";

export interface NotificationsFormDraft {
  adding: boolean;
  name: string;
  chatId: string;
  role: NotificationRecipientRole;
  scopeType: NotificationRecipientScope["type"];
  scopeTarget: string;
}

export interface NotificationsFilterState {
  recipientSearch: string;
  recipientRoleFilter: RecipientRoleFilter;
  recipientPage: number;
  recipientPageSize: number;
  logStatusFilter: LogStatusFilter;
  logSearch: string;
}

export interface NotificationsState
  extends NotificationsFormDraft,
    NotificationsFilterState {
  notice?: string;
  error?: string;
  setAdding: (adding: boolean) => void;
  setName: (name: string) => void;
  setChatId: (chatId: string) => void;
  setRole: (role: NotificationRecipientRole) => void;
  setScopeType: (scopeType: NotificationRecipientScope["type"]) => void;
  setScopeTarget: (scopeTarget: string) => void;
  setNotice: (notice?: string) => void;
  setError: (error?: string) => void;
  setRecipientSearch: (recipientSearch: string) => void;
  setRecipientRoleFilter: (recipientRoleFilter: RecipientRoleFilter) => void;
  setRecipientPage: (page: number | ((prev: number) => number)) => void;
  setLogStatusFilter: (logStatusFilter: LogStatusFilter) => void;
  setLogSearch: (logSearch: string) => void;
  resetRecipientFilters: () => void;
  resetLogFilters: () => void;
  resetForm: () => void;
  reset: () => void;
}

export const initialNotificationsForm: NotificationsFormDraft = {
  adding: false,
  name: "",
  chatId: "",
  role: "Human Resources (HR)",
  scopeType: "global",
  scopeTarget: "",
};

export const initialNotificationsFilters: NotificationsFilterState = {
  recipientSearch: "",
  recipientRoleFilter: "all",
  recipientPage: 1,
  recipientPageSize: 6,
  logStatusFilter: "all",
  logSearch: "",
};

export const useNotificationsStore = create<NotificationsState>((set) => ({
  ...initialNotificationsForm,
  ...initialNotificationsFilters,
  notice: undefined,
  error: undefined,
  setAdding: (adding) => set({ adding }),
  setName: (name) => set({ name }),
  setChatId: (chatId) => set({ chatId }),
  setRole: (role) =>
    set({
      role,
      scopeType: role === "Human Resources (HR)" ? "global" : "zone",
      scopeTarget: "",
    }),
  setScopeType: (scopeType) => set({ scopeType, scopeTarget: "" }),
  setScopeTarget: (scopeTarget) => set({ scopeTarget }),
  setNotice: (notice) => set({ notice }),
  setError: (error) => set({ error }),
  setRecipientSearch: (recipientSearch) =>
    set({ recipientSearch, recipientPage: 1 }),
  setRecipientRoleFilter: (recipientRoleFilter) =>
    set({ recipientRoleFilter, recipientPage: 1 }),
  setRecipientPage: (page) =>
    set((state) => ({
      recipientPage:
        typeof page === "function" ? page(state.recipientPage) : page,
    })),
  setLogStatusFilter: (logStatusFilter) => set({ logStatusFilter }),
  setLogSearch: (logSearch) => set({ logSearch }),
  resetRecipientFilters: () =>
    set({
      recipientSearch: "",
      recipientRoleFilter: "all",
      recipientPage: 1,
    }),
  resetLogFilters: () =>
    set({
      logStatusFilter: "all",
      logSearch: "",
    }),
  resetForm: () =>
    set({
      ...initialNotificationsForm,
      recipientPage: 1,
    }),
  reset: () =>
    set({
      ...initialNotificationsForm,
      ...initialNotificationsFilters,
      notice: undefined,
      error: undefined,
    }),
}));
