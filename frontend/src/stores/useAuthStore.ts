import { create } from "zustand";
import { getPersona, type Persona, type PersonaRole } from "../application/personas";

export interface AuthState {
  role: PersonaRole | undefined;
  persona: Persona | undefined;
  setRole: (role: PersonaRole | undefined) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  role: undefined,
  persona: undefined,
  setRole: (role) => {
    set({
      role,
      persona: role ? getPersona(role) : undefined,
    });
  },
  logout: () => {
    set({
      role: undefined,
      persona: undefined,
    });
  },
}));
